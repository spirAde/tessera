import { copy } from 'fs-extra';
import path from 'path';
import { Op } from 'sequelize';

import {
  persistentApplicationBuildFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { Page } from '../../../models';
import { Stage, Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';
import { compile } from '../../pipeline/compiling.service';
import { exportPages } from '../../pipeline/export.service';
import { getProject } from '../../pipeline/fetching.service';
import {
  createApplicationFile,
  getAbsolutePageFilePath,
  getPageComponentName,
} from '../../pipeline/generating.service';
import { runPipeline } from '../../pipeline/pipeline.service';
import { rollback } from '../../pipeline/rollback.service';
import {
  createPagePipelineContext,
  PagePipelineContext,
  rollbackCompilationStage,
  rollbackExportStage,
} from '../page.service';

export async function runPageDeleting({
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

  await page.destroy();

  const projectPages = await Page.findAll({
    where: {
      id: { [Op.ne]: page.id },
      buildId: page.buildId,
      status: Status.success,
      stage: Stage.commit,
    },
  });

  const pipelineContext = createPagePipelineContext({
    workInProgressPage: page,
    projectPages,
  });

  const stageToHandleMap = {
    [Stage.fetching]: runFetchingStage,
    [Stage.generating]: runGeneratingStage,
    [Stage.compilation]: runCompilationStage,
    [Stage.export]: runExportStage,
    [Stage.commit]: runCommitStage,
  };

  try {
    await runPipeline(pipelineContext, Object.values(stageToHandleMap));
    logger.debug(`page deleting pipeline is successfully finished`);
  } catch (error) {
    await page.restore();
    await rollback({
      context: pipelineContext,
      stages: Object.keys(stageToHandleMap) as Stage[],
      rollbackFns: { rollbackGeneratingStage, rollbackCompilationStage, rollbackExportStage },
    });
    throw error;
  }
}

async function runFetchingStage({ workInProgressPage }: PagePipelineContext) {
  logger.debug(`page fetching stage: ${workInProgressPage.url}`);

  const project = await getProject();

  return {
    project,
    designSystemComponentsList: [],
  } as Partial<PagePipelineContext>;
}

async function runGeneratingStage({ projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug(`page generating stage: ${workInProgressPage.url}`);

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
  await compile(projectPages.map(({ url }) => url));
}

async function runExportStage({ projectPages }: PagePipelineContext) {
  await exportPages(projectPages);
}

async function runCommitStage({ projectPages }: PagePipelineContext) {
  await commit(projectPages);
}

async function rollbackGeneratingStage() {
  await copy(
    path.join(persistentApplicationBuildFolderRootPath, 'application/application.jsx'),
    path.join(temporaryApplicationBuildFolderRootPath, 'application/application.jsx'),
  );
}
