/* istanbul ignore file */

import { context as otlContext, SpanStatusCode, trace } from '@opentelemetry/api';
import type {
  Exception,
  Context as OtlContext,
  Span,
  SpanOptions,
  Tracer,
} from '@opentelemetry/api';
import { ExportResultCode, hrTimeToMicroseconds } from '@opentelemetry/core';
import type { ExportResult } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

import { logger } from './logger';

export { otlContext, SemanticAttributes };

interface OpentelemetryOptions {
  endpoint?: string;
  resource?: Resource;
}

let tracer: Tracer;
let provider: NodeTracerProvider;

export function initializeOpentelemetry(config: {
  name: string;
  environment: string;
  opentelemetry: OpentelemetryOptions;
}) {
  provider = new NodeTracerProvider({
    resource: createResource({
      name: config.name,
      environment: config.environment,
      opentelemetry: config.opentelemetry,
    }),
  });

  provider.register(createPropagator());
  provider.addSpanProcessor(createSpanProcessor(config.opentelemetry.endpoint));

  registerInstrumentations({
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-pino': {
          logHook: (_, record) => {
            record['resource.service.name'] = provider.resource.attributes['service.name'];
          },
        },
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook(req) {
            return req && Boolean(req.url?.match(/^.*(health|metrics).*$/));
          },
        },
      }),
      new SequelizeInstrumentation({
        queryHook: (span, params) => {
          span.setAttribute(
            'db.statement',
            sanitizeSQL(typeof params.sql === 'string' ? params.sql : params.sql.query),
          );
        },
      }),
    ],
  });

  trace.setGlobalTracerProvider(provider);
  tracer = trace.getTracer(config.name);
}

export function withSafelyActiveSpan<T>(
  { name, context, options }: { name: string; options: SpanOptions; context: OtlContext },
  callback: (span: Span | null) => Promise<T>,
) {
  if (!tracer) {
    return callback(null);
  }

  return tracer.startActiveSpan(name, options, context, async (span) => {
    try {
      const result = await callback(span);
      span.setStatus({
        code: SpanStatusCode.OK,
      });

      return result;
    } catch (error) {
      span.recordException(error as Exception);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error)?.message,
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

function createSpanExporter(): SpanExporter {
  return {
    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
      for (const span of spans) {
        logger.debug(
          {
            traceId: span.spanContext().traceId,
            parentId: span.parentSpanId,
            name: span.name,
            id: span.spanContext().spanId,
            kind: span.kind,
            timestamp: hrTimeToMicroseconds(span.startTime),
            duration: hrTimeToMicroseconds(span.duration),
            attributes: span.attributes,
            status: span.status,
            events: span.events,
            links: span.links,
          },
          '[Opentelemetry]',
        );
      }

      if (resultCallback) {
        resultCallback({ code: ExportResultCode.SUCCESS });
      }
    },
    shutdown(): Promise<void> {
      return Promise.resolve();
    },
  };
}

function createSpanProcessor(endpoint: string | undefined) {
  if (!endpoint) {
    return new BatchSpanProcessor(createSpanExporter());
  }

  return new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: endpoint,
    }),
  );
}

function createResource(config: {
  name: string;
  environment: string;
  opentelemetry: OpentelemetryOptions;
}): Resource {
  return Resource.default()
    .merge(config.opentelemetry.resource ?? new Resource({}))
    .merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: config.name,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
      }),
    );
}

function createPropagator() {
  return { propagator: new B3Propagator() };
}

function sanitizeSQL(query: string) {
  const valuePattern = /'[^']*'|\b\d+\b/g;
  return query.replace(valuePattern, '$');
}
