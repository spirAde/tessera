import { logger } from '../../../lib/logger';
import { Page } from '../../../models';
import { Stage, Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';
import {
  convertToMap,
  getMissedComponentsList,
  generatePage,
} from '../../pipeline/generating.service';
import { runPipeline } from '../../pipeline/pipeline.service';
import {
  createPagePipelineContext,
  PagePipelineContext,
  runFetchingStage,
  runPreparingStage,
  runCompilationStage,
  runExportStage,
  updatePage,
} from '../page.service';

export async function runPageUpdating({
  buildId,
  externalId,
}: {
  buildId: number;
  externalId: number;
}) {
  const page = await Page.findOne({
    where: {
      buildId,
      externalId,
    },
    rejectOnEmpty: true,
  });

  const readyToRunPage = await updatePage(page, {
    status: Status.progress,
    stage: Stage.setup,
  });

  try {
    await runPageUpdatingPipeline(readyToRunPage);
  } catch (error) {
    await updatePage(readyToRunPage, {
      status: Status.failed,
    });
    throw error;
  }
}

async function runPageUpdatingPipeline(page: Page) {
  const projectPages = await Page.findAll({
    where: {
      buildId: page.buildId,
      status: Status.success,
    },
  });

  await updatePage(page, {
    status: Status.progress,
  });

  const pipelineContext = createPagePipelineContext({
    workInProgressPage: page,
    projectPages,
  });

  const handlers = [
    runFetchingStage,
    runGeneratingStage,
    runPreparingStage,
    runCompilationStage,
    runExportStage,
    runCommitStage,
  ];

  await runPipeline(pipelineContext, handlers);

  logger.debug(`page updating pipeline is successfully finished`);
}

async function runGeneratingStage({
  workInProgressPage,
  designSystemComponentsList,
}: PagePipelineContext) {
  logger.debug('page generating stage');

  await updatePage(workInProgressPage, {
    stage: Stage.generating,
  });

  const { pageComponentsList } = await generatePage(
    workInProgressPage,
    convertToMap(designSystemComponentsList),
  );

  return {
    componentsRequiringBundles: getMissedComponentsList(pageComponentsList),
  };
}

async function runCommitStage({ projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug(`page commit stage`);

  await updatePage(workInProgressPage, {
    stage: Stage.commit,
  });

  await commit([...projectPages, workInProgressPage]);

  await updatePage(workInProgressPage, {
    status: Status.success,
  });
}
