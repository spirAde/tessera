import capitalize from 'lodash/capitalize';
import takeWhile from 'lodash/takeWhile';

import { logger } from '../../lib/logger';
import { Pipeline } from '../../models';
import { Stage } from '../../types';
import { PagePipelineContext } from '../page/page.service';

type RollbackFn = (context: PagePipelineContext) => Promise<void>;
type RollbackFns = Partial<{
  [K in keyof typeof Stage as `rollback${Capitalize<K>}Stage`]: RollbackFn;
}>;

export async function rollback({
  context,
  stages,
  rollbackFns,
}: {
  context: PagePipelineContext;
  stages: Stage[];
  rollbackFns: RollbackFns;
}): Promise<void> {
  logger.debug(`[rollback] run rollback for pipeline for page: ${context.snapshot.page.url}`);

  await context.pipeline.reload();

  await Promise.all(
    getPreviousStages(context.pipeline, stages)
      .map((stage) => getRollbackFn(rollbackFns, stage))
      .map((fn) => fn(context)),
  );
}

function getRollbackFn(rollbackFns: RollbackFns, stage: Stage): RollbackFn {
  return (
    rollbackFns[`rollback${capitalize(stage)}Stage` as keyof RollbackFns] ??
    (() => Promise.resolve())
  );
}

function getPreviousStages(pipeline: Pipeline, stages: Stage[]) {
  return takeWhile(stages, (stage) => stage !== pipeline.stage).concat(pipeline.stage);
}
