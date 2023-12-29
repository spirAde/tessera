import { Job } from 'pg-boss';
import { SpanKind } from '@opentelemetry/api';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';

import { Build } from '../models';
import { runBuild, updateBuild } from '../services/build/build.service';
import { Stage, Status } from '../types';
import { logger } from '../lib/logger';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../lib/opentelemetry';

export async function createBuildJob(
  payload: Job<{ buildId: number; parentSpanContext: SpanContext }>,
) {
  await withSafelyActiveSpan(
    {
      name: 'create-build job',
      context: otlContext.active(),
      options: {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: 'job',
        },
        kind: SpanKind.CONSUMER,
        links: [{ context: payload.data.parentSpanContext }],
      },
    },
    async () => {
      logger.debug(`[createBuildJob] start job for build id: ${payload.data.buildId}`);

      const build = await Build.findByPk(payload.data.buildId, {
        rejectOnEmpty: true,
      });

      const readyToRunProjectBuild = await updateBuild(build, {
        status: Status.progress,
        stage: Stage.setup,
      });

      return runBuild(readyToRunProjectBuild);
    },
  );
}
