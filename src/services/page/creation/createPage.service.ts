import { Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { getProjectPageStructure } from '../../../sdk/platform.sdk';
import { runPipeline } from '../../pipeline/pipeline.service';
import {
  convertToMap,
  createApplicationFile,
  createApplicationPageFile,
  getAbsolutePageFilePath,
  getMissedComponentsList,
  getPageComponentName,
} from '../../pipeline/generating.service';
import {
  normalizePageComponentsVersionsGivenDesignSystem,
  parsePageStructureComponentsList,
} from '../../pipeline/parsing.service';
import { compile } from '../../pipeline/compiling.service';
import { exportClientStaticFiles, exportPages } from '../../pipeline/export.service';
import {
  PagePipelineContext,
  createPagePipelineContext,
  updatePage,
  runPageAdvisoryLock,
  runPageAdvisoryUnlock,
  runFetchingStage,
  runPreparingStage,
  cancelLinearPageProcessing,
  runProjectPageGenerating,
} from '../page.service';
import { Status } from '../../../types';
import { commit } from '../../pipeline/commit.service';

export async function runPageCreation(page: Page) {
  try {
    await runPageCreationPipeline(page);
  } catch (error) {
    await cancelLinearPageProcessing(page);
    await updatePage(page, {
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
    runPageAdvisoryLock,
    runGeneratingStage,
    runPreparingStage,
    runCompilationStage,
    runExportStage,
    runPageAdvisoryUnlock,
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

  const { pageComponentsList } = await runProjectPageGenerating(
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

async function runCompilationStage({ projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug('page compilation stage');

  return compile([...projectPages.map(({ url }) => url), workInProgressPage.url]);
}

async function runExportStage({ project, projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug('page export stage');

  await exportPages(project!, [...projectPages.map((page) => page.url), workInProgressPage.url]);
  await exportClientStaticFiles();
}

async function runCommitStage() {
  logger.debug(`page commit stage`);

  await commit();
}
