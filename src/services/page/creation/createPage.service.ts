import { Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { runPipeline } from '../../pipeline/pipeline.service';
import {
  convertToMap,
  generatePage,
  createApplicationFile,
  getAbsolutePageFilePath,
  getMissedComponentsList,
  getPageComponentName,
} from '../../pipeline/generating.service';
import {
  createPage,
  createPagePipelineContext,
  PagePipelineContext,
  runFetchingStage,
  runPreparingStage,
  runCompilationStage,
  runExportStage,
  updatePage,
} from '../page.service';
import { Stage, Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';

export async function runPageCreation({
  buildId,
  externalId,
  url,
}: {
  buildId: number;
  externalId: number;
  url: string;
}) {
  const readyToRunPage = await createPage({
    buildId,
    externalId,
    url,
    stage: Stage.setup,
    status: Status.progress,
  });

  try {
    await runPageCreationPipeline(readyToRunPage);
  } catch (error) {
    await updatePage(readyToRunPage, {
      status: Status.failed,
    });
    throw error;
  }
}

async function runPageCreationPipeline(page: Page) {
  const projectPages = await Page.findAll({
    where: {
      buildId: page.buildId,
      status: Status.success,
    },
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

  logger.debug(`page creation pipeline is successfully finished`);
}

async function runGeneratingStage({
  workInProgressPage,
  projectPages,
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

  const generatedPages = [...projectPages, workInProgressPage].map((page) => ({
    pageUrl: page.url,
    path: getAbsolutePageFilePath(getPageFolderPathFromUrl(page.url)),
    pageName: getPageComponentName(getPageFolderPathFromUrl(page.url)),
  }));

  await createApplicationFile(generatedPages);

  return {
    componentsRequiringBundles: getMissedComponentsList(pageComponentsList),
    generatedPages,
  };
}

async function runCommitStage({ workInProgressPage }: PagePipelineContext) {
  logger.debug(`page commit stage`);

  await updatePage(workInProgressPage, {
    stage: Stage.commit,
  });

  await commit();

  await updatePage(workInProgressPage, {
    status: Status.success,
  });
}
