import { Op } from 'sequelize';

import { Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { runPipeline } from '../../pipeline/pipeline.service';
import { compile } from '../../pipeline/compiling.service';
import { exportClientStaticFiles, exportPages } from '../../pipeline/export.service';
import {
  PagePipelineContext,
  createPagePipelineContext,
  runPageAdvisoryLock,
  runPageAdvisoryUnlock,
} from '../page.service';
import { Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';
import {
  createApplicationFile,
  getAbsolutePageFilePath,
  getPageComponentName,
} from '../../pipeline/generating.service';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { getProject } from '../../pipeline/fetching.service';
import {
  removeDeletedPageFiles,
  removeEmptyFoldersRecursively,
} from '../../pipeline/cleanup.service';
import { outputFolderPath } from '../../../config';

export async function runPageDeletingPipeline(page: Page) {
  const projectPages = await Page.findAll({
    where: {
      id: { [Op.ne]: page.id },
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
    runPageAdvisoryLock,
    runGeneratingStage,
    runCompilationStage,
    runExportStage,
    runPageAdvisoryUnlock,
    runCleanupStage,
    runCommitStage,
  ];

  await runPipeline(pipelineContext, handlers);

  logger.debug(`page deleting pipeline is successfully finished`);
}

async function runFetchingStage() {
  logger.debug('page fetching stage');

  const project = await getProject();

  return {
    project,
    designSystemComponentsList: [],
  } as Partial<PagePipelineContext>;
}

async function runGeneratingStage({ projectPages }: PagePipelineContext) {
  logger.debug('page generating stage');

  const generatedPages = projectPages.map((page) => ({
    pageUrl: page.url,
    path: getAbsolutePageFilePath(getPageFolderPathFromUrl(page.url)),
    pageName: getPageComponentName(getPageFolderPathFromUrl(page.url)),
  }));

  await createApplicationFile(generatedPages);

  return {
    componentsRequiringBundles: [],
    generatedPages,
  };
}

async function runCompilationStage({ projectPages }: PagePipelineContext) {
  logger.debug('page compilation stage');

  return compile(projectPages.map(({ url }) => url));
}

async function runExportStage({ project, projectPages }: PagePipelineContext) {
  logger.debug('page export stage');

  await exportPages(
    project!,
    projectPages.map((page) => page.url),
  );
  await exportClientStaticFiles();
}

async function runCleanupStage({ workInProgressPage }: PagePipelineContext) {
  logger.debug('page cleanup stage');

  await removeDeletedPageFiles(workInProgressPage);
  await removeEmptyFoldersRecursively(outputFolderPath);
}

async function runCommitStage() {
  logger.debug(`page commit stage`);

  await commit();
}
