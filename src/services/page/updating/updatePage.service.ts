import { Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { getProjectPageStructure } from '../../../sdk/platform.sdk';
import { runPipeline } from '../../pipeline/pipeline.service';
import {
  convertToMap,
  createApplicationPageFile,
  getMissedComponentsList,
} from '../../pipeline/generating.service';
import { parseProjectPage } from '../../pipeline/parsing.service';
import { compile } from '../../pipeline/compiling.service';
import { exportClientStaticFiles, exportPages } from '../../pipeline/export.service';
import {
  PagePipelineContext,
  createPagePipelineContext,
  updatePage,
  runFetchingStage,
  runPreparingStage,
  runPageAdvisoryLock,
  runPageAdvisoryUnlock,
  cancelLinearPageProcessing,
} from '../page.service';
import { Stage, Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';
import { Op } from 'sequelize';

export async function runPageUpdating(page: Page) {
  try {
    await runPageUpdatingPipeline(page);
  } catch (error) {
    await cancelLinearPageProcessing(page);
    await updatePage(page, {
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

  const pipelineContext = createPagePipelineContext({
    workInProgressPage: page,
    projectPages,
  });

  const handlers = [
    runFetchingStage,
    runPageAdvisoryLock,
    runGeneratingStage,
    runPreparingStage,
    runCompilationStage,
    runExportStage,
    runPageAdvisoryUnlock,
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

  const pageStructure = await getProjectPageStructure(workInProgressPage.externalId);

  const { pageComponentsList } = await parseProjectPage(
    pageStructure,
    convertToMap(designSystemComponentsList),
  );

  await createApplicationPageFile(pageStructure, pageComponentsList);

  return {
    componentsRequiringBundles: getMissedComponentsList(pageComponentsList),
  };
}

async function runCompilationStage({ projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug('page compilation stage');

  await Page.update(
    { stage: Stage.compilation },
    {
      where: {
        id: [...projectPages.map(({ id }) => id), workInProgressPage.id],
        status: {
          [Op.ne]: Status.failed,
        },
      },
    },
  );

  return compile([...projectPages.map(({ url }) => url), workInProgressPage.url]);
}

async function runExportStage({ project, projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug('page export stage');

  await Page.update(
    { stage: Stage.export },
    {
      where: {
        id: [...projectPages.map(({ id }) => id), workInProgressPage.id],
        status: {
          [Op.ne]: Status.failed,
        },
      },
    },
  );

  await exportPages(project!, [...projectPages.map((page) => page.url), workInProgressPage.url]);
  await exportClientStaticFiles();
}

async function runCommitStage({ projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug(`page commit stage`);

  await Page.update(
    { stage: Stage.commit },
    {
      where: {
        id: [...projectPages.map(({ id }) => id), workInProgressPage.id],
        status: {
          [Op.ne]: Status.failed,
        },
      },
    },
  );

  await commit();
}
