import { Job } from 'pg-boss';
import { SpanContext } from '@opentelemetry/api/build/src/trace/span_context';

import { Build } from '../../models';
import { createBuild, runProjectBuild } from '../../services/build/build.service';
import { Stage, Status } from '../../types';
import { logger } from '../../lib/logger';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../lib/opentelemetry';
import { flushPendingTasks, JobName, runJob, stopJob } from '../../services/enqueueJob.service';
import { SpanKind } from '@opentelemetry/api';

export async function createBuildJob(payload: Job<{ parentSpanContext?: SpanContext }>) {
  await withSafelyActiveSpan(
    {
      name: 'create-build job',
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
      logger.debug(`[createBuildJob] start job`);

      await Build.destroy({ truncate: true });
      await stopPageJobs();

      const readyToRunProjectBuild = await createBuild({
        status: Status.progress,
        stage: Stage.setup,
      });

      await runProjectBuild(readyToRunProjectBuild);

      await runPageJobs();
    },
  );
}

async function stopPageJobs() {
  await stopJob(JobName.createPage);
  await stopJob(JobName.updatePage);
  await stopJob(JobName.deletePage);

  await flushPendingTasks(JobName.createPage);
  await flushPendingTasks(JobName.updatePage);
  await flushPendingTasks(JobName.deletePage);
}

async function runPageJobs() {
  await runJob(JobName.createPage);
  await runJob(JobName.updatePage);
  await runJob(JobName.deletePage);
}
