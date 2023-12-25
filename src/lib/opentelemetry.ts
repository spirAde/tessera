import {
  context as otlContext,
  Context as OtlContext,
  createContextKey,
  Span,
  SpanOptions,
  SpanStatusCode,
  trace,
  Tracer,
} from '@opentelemetry/api';
import { ExportResult, ExportResultCode, hrTimeToMicroseconds } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { Resource } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ReadableSpan,
  SimpleSpanProcessor,
  SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions';
import { InstrumentationOption, registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize';

import { logger } from './logger';
import { isTest } from './environment';

export { otlContext, SemanticAttributes };

interface OpentelemetryOptions {
  enabled: boolean;
  endpoint?: string;
  resource?: Resource;
  plugins?: {
    sequelize?: boolean;
  };
}

let tracerSettings:
  | { enabled: false }
  | { enabled: true; defaultTracer: Tracer; provider: BasicTracerProvider } = {
  enabled: false,
};

let opentelemetry: OpentelemetryOptions = {
  enabled: true,
};
let isInstrumentationRegisteredAlready = false;

export const otlContextAttributes = {
  requestId: createContextKey('requestId'),
};

export function initOpentelemetry(config: {
  name: string;
  environment: string;
  opentelemetry: OpentelemetryOptions;
}) {
  registerInstrumentationsIfNeeded({
    sequelizePluginEnabled: config.opentelemetry?.plugins?.sequelize,
  });

  const provider = new NodeTracerProvider({
    resource: createResource({
      name: config.name,
      environment: config.environment,
      opentelemetry: config.opentelemetry,
    }),
  });

  provider.register(createPropagator());
  provider.addSpanProcessor(createSpanProcessor(config.opentelemetry.endpoint));

  opentelemetry = config.opentelemetry;
  tracerSettings = {
    provider,
    enabled: true,
    defaultTracer: trace.getTracer(config.name),
  };
}

export function withSafelyActiveSpan<T>(
  { name, context, options }: { name: string; options: SpanOptions; context: OtlContext },
  callback: (span: Span | null) => Promise<T>,
) {
  if (tracerSettings.enabled) {
    return tracerSettings.defaultTracer.startActiveSpan(name, options, context, async (span) => {
      try {
        const result = await callback(span);
        span.setStatus({
          code: SpanStatusCode.OK,
        });

        return result;
      } catch (err) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (err as Error)?.message,
        });

        throw err;
      } finally {
        span.end();
      }
    });
  }

  return callback(null);
}

export async function withForceFlush<T>(callback: () => Promise<T>) {
  try {
    return await callback();
  } finally {
    await forceFlushTraces(tracerSettings);
  }
}

export function doIfSpanExists(span: Span | null, action: (span: Span) => void) {
  if (span) {
    action(span);
  }
}

export function getTracingHeader(span: Span | null) {
  if (!opentelemetry?.enabled || !span) {
    return undefined;
  }
  const ctx = span.spanContext();
  return { b3: `${ctx.traceId}-${ctx.spanId}-${ctx.traceFlags}` };
}

// private

function createSpanExporter(): SpanExporter {
  return {
    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
      for (const span of spans) {
        logger.debug('[Opentelemetry data]', {
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
        });
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
    logger.debug(
      '[initOpentelemetryCore] unnable to setup exporter to OTEL collector. CloudWatchSpanExporter will be used by default ',
      {
        errorType: 'Endpoint was not provided.',
      },
    );

    return new SimpleSpanProcessor(createSpanExporter());
  }

  if (isTest()) {
    logger.debug(
      '[initOpentelemetryCore] CloudWatchSpanExporter will be used by default for the "test" stage',
    );

    return new SimpleSpanProcessor(createSpanExporter());
  }

  return new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: endpoint,
    }),
  );
}

async function forceFlushTraces(
  defaultTracerSettings:
    | { enabled: false }
    | { enabled: true; defaultTracer: Tracer; provider: BasicTracerProvider },
) {
  if (defaultTracerSettings.enabled) {
    try {
      await defaultTracerSettings.provider.forceFlush();
    } catch (e) {
      logger.error({
        message: 'Failed to export logs to the OTEL Collector',
        data: {
          requestId: otlContext.active().getValue(otlContextAttributes.requestId),
        },
      });
    }
  }
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
        [SemanticResourceAttributes.SERVICE_NAME]: `${config.name}_${config.environment}`,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
      }),
    );
}

function createPropagator() {
  return { propagator: new B3Propagator() };
}

export function registerInstrumentationsIfNeeded({
  sequelizePluginEnabled,
}: {
  sequelizePluginEnabled?: boolean;
}) {
  if (isInstrumentationRegisteredAlready) {
    return;
  }
  const instrumentations: InstrumentationOption[] = [
    new HttpInstrumentation(),
    new FastifyInstrumentation(),
  ];

  if (sequelizePluginEnabled) {
    instrumentations.push(createSequelizeInstrumentation());
  }

  registerInstrumentations({ instrumentations });
  isInstrumentationRegisteredAlready = true;
}

function createSequelizeInstrumentation() {
  return new SequelizeInstrumentation({
    queryHook: (span, params) => {
      span.setAttribute(
        'db.statement',
        sanitizeSQL(typeof params.sql === 'string' ? params.sql : params.sql.query),
      );
    },
  });
}

function sanitizeSQL(query: string) {
  const valuePattern = /'[^']*'|\b\d+\b/g;
  return query.replace(valuePattern, '$');
}
