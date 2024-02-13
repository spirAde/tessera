import takeWhile from 'lodash/takeWhile';

import { Page } from '../../models';
import { Stage } from '../../types';
import { PagePipelineContext } from '../page/page.service';

type RollbackFn = (context: PagePipelineContext) => Promise<void>;

interface RollbackFns {
  rollbackGeneratingStage: RollbackFn;
  rollbackCompilationStage: RollbackFn;
  rollbackExportStage: RollbackFn;
}

export async function rollback({
  context,
  stages,
  rollbackFns: { rollbackGeneratingStage, rollbackCompilationStage, rollbackExportStage },
}: {
  context: PagePipelineContext;
  stages: Stage[];
  rollbackFns: RollbackFns;
}) {
  await context.workInProgressPage.reload();

  const previousStages = getPreviousStages(context.workInProgressPage, stages);

  await Promise.all(
    [
      previousStages.includes(Stage.generating) ? rollbackGeneratingStage : Promise.resolve,
      previousStages.includes(Stage.compilation) ? rollbackCompilationStage : Promise.resolve,
      previousStages.includes(Stage.export) ? rollbackExportStage : Promise.resolve,
    ].map((fn) => fn(context)),
  );
}

function getPreviousStages(page: Page, stages: Stage[]) {
  return takeWhile(stages, (stage) => stage !== page.stage);
}
