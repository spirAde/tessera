import { copy } from 'fs-extra';

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
  getMissedComponentsList,
  generatePage,
  getAbsolutePageFilePath,
} from '../../pipeline/generating.service';
import { runPipeline } from '../../pipeline/pipeline.service';
import { rollback } from '../../pipeline/rollback.service';
import {
  createPagePipelineContext,
  PagePipelineContext,
  runFetchingStage,
  runPreparingStage,
  runCompilationStage,
  runExportStage,
  updatePage,
  rollbackCompilationStage,
  rollbackExportStage,
} from '../page.service';

export async function runPageUpdating({
  buildId,
  externalId,
}: {
  buildId: number;
  externalId: number;
}): Promise<void> {
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
    logger.debug(`page updating pipeline is successfully finished`);
  } catch (error) {
    await updatePage(readyToRunPage, {
      status: Status.failed,
    });
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

async function rollbackGeneratingStage({ workInProgressPage }: PagePipelineContext) {
  const pageFolderPath = getPageFolderPathFromUrl(workInProgressPage.url);

  await copy(
    getAbsolutePageFilePath(pageFolderPath, temporaryApplicationBuildFolderRootPath),
    getAbsolutePageFilePath(pageFolderPath, persistentApplicationBuildFolderRootPath),
  );
}
