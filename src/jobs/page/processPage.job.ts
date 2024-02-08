import { Job } from 'pg-boss';
import { SpanKind } from '@opentelemetry/api';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';

import { logger } from '../../lib/logger';
import { ProcessPagePipelineType } from '../../services/page/page.service';
import { getCurrentBuild } from '../../services/build/build.service';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../lib/opentelemetry';
import { runPageCreation } from '../../services/page/creation/createPage.service';
import { runPageUpdating } from '../../services/page/updating/updatePage.service';
import { runPageDeleting } from '../../services/page/deleting/deletePage.service';

export async function processPageJob(
  payload: Job<{
    externalId: number;
    type: ProcessPagePipelineType;
    parentSpanContext?: SpanContext;
    url?: string;
  }>,
) {
  await withSafelyActiveSpan(
    {
      name: 'process-page job',
      context: otlContext.active(),
      options: {
        kind: SpanKind.CONSUMER,
        links: payload.data.parentSpanContext
          ? /* istanbul ignore next */
            [{ context: payload.data.parentSpanContext }]
          : /* istanbul ignore next */
            [],
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: `${payload.data.type} job`,
        },
      },
    },
    async () => {
      logger.debug(
        `[processPageJob] start ${payload.data.type} job for page with external id: ${payload.data.externalId}`,
      );

      const build = await getCurrentBuild();

      if (!build) {
        throw new Error('active build not found');
      }

      // Due to compilation and generating pages implies a lot of changes of
      // different files we can't guarantee race condition between
      // read/write (even with psql advisory lock). As result the processing
      // create/update/remove handlers for pages should be enqueued as singleton.
      // Maybe after MVP this behaviour will be changed
      switch (payload.data.type) {
        case ProcessPagePipelineType.create: {
          await runPageCreation({
            buildId: build.id,
            externalId: payload.data.externalId,
            url: payload.data.url as string,
          });
          return;
        }
        case ProcessPagePipelineType.update: {
          await runPageUpdating({
            buildId: build.id,
            externalId: payload.data.externalId,
          });
          return;
        }
        case ProcessPagePipelineType.remove: {
          await runPageDeleting({
            buildId: build.id,
            externalId: payload.data.externalId,
          });
          return;
        }
        default:
          throw new Error(`unknown processing type: ${payload.data.type}`);
      }
    },
  );
}
