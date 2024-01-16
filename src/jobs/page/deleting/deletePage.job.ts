import { Job } from 'pg-boss';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';
import { SpanKind } from '@opentelemetry/api';

import { sequelize } from '../../../lib/sequelize';
import { Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../../lib/opentelemetry';
import { getCurrentBuild } from '../../../services/build/build.service';
import { runPageDeletingPipeline } from '../../../services/page/deleting/deletePage.service';

export async function deletePageJob(
  payload: Job<{ pageId: number; parentSpanContext?: SpanContext }>,
) {
  await withSafelyActiveSpan(
    {
      name: 'delete-page job',
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
      await sequelize.transaction(async () => {
        logger.debug(`[deletePageJob] start job`);

        const build = await getCurrentBuild();

        if (!build) {
          throw new Error(`[deletePageJob] build is not found`);
        }

        const page = await Page.findByPk(payload.data.pageId, {
          rejectOnEmpty: true,
        });

        await page.destroy();

        await runPageDeletingPipeline(page);
      });
    },
  );
}
