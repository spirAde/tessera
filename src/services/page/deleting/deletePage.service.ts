import { Op } from 'sequelize';

import { Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { runPipeline } from '../../pipeline/pipeline.service';
import { compile } from '../../pipeline/compiling.service';
import { exportPages } from '../../pipeline/export.service';
import { createPagePipelineContext, PagePipelineContext, PipelineType } from '../page.service';
import { Stage, Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';
import {
  createApplicationFile,
  getAbsolutePageFilePath,
  getPageComponentName,
} from '../../pipeline/generating.service';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { getProject } from '../../pipeline/fetching.service';

export async function runPageDeleting({
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

  await page.destroy();

  try {
    await runPageDeletingPipeline(page);
  } catch (error) {
    await page.restore();
    throw error;
  }
}

async function runPageDeletingPipeline(page: Page) {
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

  const handlers = [
    runFetchingStage,
    runGeneratingStage,
    runCompilationStage,
    runExportStage,
    runCommitStage,
  ];

  await runPipeline(pipelineContext, handlers);

  logger.debug(`page deleting pipeline is successfully finished`);
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
