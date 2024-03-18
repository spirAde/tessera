import { SpanKind } from '@opentelemetry/api';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';
import { Job } from 'pg-boss';

import { logger } from '../../lib/logger';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../lib/opentelemetry';
import { runPageCreation } from '../../services/page/creation/createPage.service';
import { runPageDeleting } from '../../services/page/deleting/deletePage.service';
import { runPageUpdating } from '../../services/page/updating/updatePage.service';
import { PipelineType, createPipeline } from '../../services/pipeline/pipeline.service';
import { Stage, Status } from '../../types';

export async function processPageJob(
  payload: Job<{
    pageId: number;
    type: PipelineType;
    parentSpanContext?: SpanContext;
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
      logger.debug(payload, `[processPageJob] start ${payload.data.type} job`);

      const pipeline = await createPipeline({
        jobId: payload.id,
        status: Status.progress,
        stage: Stage.setup,
      });

      // Due to compilation and generating pages implies a lot of changes of
      // different files we can't guarantee race condition between
      // read/write (even with psql advisory lock). As result the processing
      // create/update/remove handlers for pages should be enqueued as singleton.
      // Maybe after MVP this behaviour will be changed
      switch (payload.data.type) {
        case PipelineType.create: {
          await runPageCreation(pipeline, payload.data.pageId);
          return;
        }
        case PipelineType.update: {
          await runPageUpdating(pipeline, payload.data.pageId);
          return;
        }
        case PipelineType.remove: {
          await runPageDeleting(pipeline, payload.data.pageId);
          return;
        }
      }
    },
  );
}
