import { copy, remove } from 'fs-extra';
import path from 'path';

import {
  persistentApplicationBuildFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { Page } from '../../../models';
import { Stage, Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';
import {
  convertToMap,
  createApplicationFile,
  generatePage,
  getAbsolutePageFilePath,
  getMissedComponentsList,
  getPageComponentName,
} from '../../pipeline/generating.service';
import { runPipeline } from '../../pipeline/pipeline.service';
import { rollback } from '../../pipeline/rollback.service';
import {
  createPage,
  createPagePipelineContext,
  PagePipelineContext,
  rollbackCompilationStage,
  runCompilationStage,
  runExportStage,
  runFetchingStage,
  runPreparingStage,
  updatePage,
} from '../page.service';

export async function runPageCreation({
  buildId,
  externalId,
  url,
}: {
  buildId: number;
  externalId: number;
  url: string;
}) {
  const workInProgressPage = await createPage({
    buildId,
    externalId,
    url,
    stage: Stage.setup,
    status: Status.progress,
  });

  const projectPages = await Page.findAll({
    where: {
      buildId,
      status: Status.success,
    },
  });

  const pipelineContext = createPagePipelineContext({
    workInProgressPage,
    projectPages,
  });

  const stageToHandleMap = {
    [Stage.fetching]: runFetchingStage,
    [Stage.generating]: runGeneratingStage,
    [Stage.preparing]: runPreparingStage,
    [Stage.compilation]: runCompilationStage,
    [Stage.export]: runExportStage,
    [Stage.commit]: runCommitStage,
  };

  try {
    await runPipeline(pipelineContext, Object.values(stageToHandleMap));

    logger.debug('page creation pipeline is successfully finished');
  } catch (error) {
    await rollback({
      context: pipelineContext,
      stages: Object.keys(stageToHandleMap) as Stage[],
      rollbackFns: { rollbackGeneratingStage, rollbackCompilationStage, rollbackExportStage },
    });
    throw error;
  }
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

async function runCommitStage({ workInProgressPage, projectPages }: PagePipelineContext) {
  logger.debug(`page commit stage`);

  await updatePage(workInProgressPage, {
    stage: Stage.commit,
  });

  await commit([...projectPages, workInProgressPage]);

  await updatePage(workInProgressPage, {
    status: Status.success,
  });
}

async function rollbackGeneratingStage({ workInProgressPage }: PagePipelineContext) {
  const pageFolderPath = getPageFolderPathFromUrl(workInProgressPage.url);
  const absolutePageFilePath = getAbsolutePageFilePath(pageFolderPath);

  await remove(absolutePageFilePath);
  await copy(
    path.join(persistentApplicationBuildFolderRootPath, 'application/application.jsx'),
    path.join(temporaryApplicationBuildFolderRootPath, 'application/application.jsx'),
  );
}

async function rollbackExportStage() {
  return Promise.resolve();
}
