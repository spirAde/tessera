import { Job } from 'pg-boss';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';
import { SpanKind } from '@opentelemetry/api';

import { logger } from '../../../lib/logger';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../../lib/opentelemetry';
import { getCurrentBuild } from '../../../services/build/build.service';
import { runPageUpdating } from '../../../services/page/updating/updatePage.service';
import { Page } from '../../../models';
import { Stage, Status } from '../../../types';
import { updatePage } from '../../../services/page/page.service';

export async function updatePageJob(
  payload: Job<{ pageId: number; parentSpanContext?: SpanContext }>,
) {
  await withSafelyActiveSpan(
    {
      name: 'update-page job',
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
      logger.debug(`[updatePageJob] start job`);

      const build = await getCurrentBuild();

      if (!build) {
        throw new Error(`[updatePageJob] build is not found`);
      }

      const page = await Page.findByPk(payload.data.pageId, {
        rejectOnEmpty: true,
      });

      const readyToRunPage = await updatePage(page, {
        status: Status.progress,
        stage: Stage.setup,
      });

      await runPageUpdating(readyToRunPage);
    },
  );
}
