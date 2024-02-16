import { SpanKind } from '@opentelemetry/api';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';
import { Job } from 'pg-boss';

import { logger } from '../../lib/logger';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../lib/opentelemetry';
import { cleanUpBeforeBuild, runProjectBuild } from '../../services/build/build.service';
import { runPageJobs, stopPageJobs } from '../../services/enqueueJob.service';

export async function createBuildJob(payload: Job<{ parentSpanContext?: SpanContext }>) {
  await withSafelyActiveSpan(
    {
      name: 'create-build job',
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
      logger.debug(`[createBuildJob] start job`);

      await cleanUpBeforeBuild();

      await stopPageJobs();
      await runProjectBuild();
      await runPageJobs();
    },
  );
}
