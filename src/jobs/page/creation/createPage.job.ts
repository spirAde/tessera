import { Job } from 'pg-boss';
import { SpanKind } from '@opentelemetry/api';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';

import { logger } from '../../../lib/logger';
import { createPage } from '../../../services/page/page.service';
import { runPageCreation } from '../../../services/page/creation/createPage.service';
import { getCurrentBuild } from '../../../services/build/build.service';
import { Stage, Status } from '../../../types';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../../lib/opentelemetry';

export async function createPageJob(
  payload: Job<{ id: number; url: string; parentSpanContext?: SpanContext }>,
) {
  await withSafelyActiveSpan(
    {
      name: 'create-page job',
      context: otlContext.active(),
      options: {
        kind: SpanKind.CONSUMER,
        links: payload.data.parentSpanContext ? [{ context: payload.data.parentSpanContext }] : [],
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: 'job',
        },
      },
    },
    async () => {
      logger.debug(`[createPageJob] start job`);

      const build = await getCurrentBuild();

      if (!build) {
        throw new Error('active build not found');
      }

      const readyToRunPage = await createPage({
        buildId: build.id,
        stage: Stage.setup,
        status: Status.progress,
        url: payload.data.url,
        externalId: payload.data.id,
      });

      await runPageCreation(readyToRunPage);
    },
  );
}
