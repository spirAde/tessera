// import takeWhile from 'lodash/takeWhile';
//
// import { Page } from '../../models';
// import { Stage } from '../../types';
// import { ProcessPagePipelineType } from '../page/page.service';
//
// export async function rollback(page: Page, pipelineType: ProcessPagePipelineType) {
//   const previousStages = getPreviousStages(page, stages);
//
//   await Promise.all(
//     [
//       previousStages.includes(Stage.generating) ? rollbackGeneratingStage : Promise.resolve,
//       previousStages.includes(Stage.compilation) ? rollbackCompilationStage : Promise.resolve,
//       previousStages.includes(Stage.export) ? rollbackExportStage : Promise.resolve,
//     ].map((fn) => fn(page)),
//   );
// }
//
// function getPreviousStages(page: Page, stages: Stage[]) {
//   return takeWhile(stages, (stage) => stage !== page.stage);
// }
//
// async function rollbackGeneratingStage(page) {}
//
// async function rollbackCompilationStage(page) {}
//
// async function rollbackExportStage(page) {}
