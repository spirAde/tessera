import { SpanKind } from '@opentelemetry/api';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';
import { Job } from 'pg-boss';

import { logger } from '../../lib/logger';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../lib/opentelemetry';
import { ComponentLike } from '../../services/component/component.service';

// TODO: !important reexport jobs should take components which should be remove after
// TODO: due to existsSameComponentButDifferentVersion will be always run reexport
export async function reexportPagesJob(
  payload: Job<{
    externalIds: number[];
    expiredComponents: ComponentLike[];
    parentSpanContext?: SpanContext;
  }>,
) {
  await withSafelyActiveSpan(
    {
      name: 'reexport pages job',
      context: otlContext.active(),
      options: {
        kind: SpanKind.CONSUMER,
        links: payload.data.parentSpanContext
          ? /* istanbul ignore next */
            [{ context: payload.data.parentSpanContext }]
          : /* istanbul ignore next */
            [],
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: 'job',
        },
      },
    },
    async () => {
      logger.debug(
        `[reexportPagesJob] start reexport job for external ids: ${payload.data.externalIds}`,
      );

      return Promise.resolve();
    },
  );
}
