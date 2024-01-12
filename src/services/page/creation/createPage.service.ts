import { Build, Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { getProjectPageStructure } from '../../../sdk/platform.sdk';
import { runPipeline } from '../../pipeline/pipeline.service';
import { getDesignSystemComponentsList, getProject } from '../../pipeline/fetching.service';
import {
  convertToMap,
  createApplicationFile,
  createApplicationPageFile,
  getAbsolutePageFilePath,
  getPageComponentName,
} from '../../pipeline/generating.service';
import { parseProjectPage } from '../../pipeline/parsing.service';
import { compile } from '../../pipeline/compiling.service';
import { exportClientStaticFiles, exportPages } from '../../pipeline/export.service';
import {
  PagePipelineContext,
  assertExportStageIsReadyToRun,
  createPagePipelineContext,
  updatePage,
  createPage,
} from '../page.service';
import { Stage, Status } from '../../../types';
import { getMissedComponentsList } from '../../component.service';
import { commit } from '../../pipeline/commit.service';
import { collectMissedComponents } from '../../pipeline/preparing.service';
import { BuildPipelineContext, updateBuild } from '../../build/build.service';

export async function runPageCreation(page: Page) {
  try {
    await runPageCreationPipeline(page);
  } catch (error) {
    logger.fatal(error);
    await updatePage(page, {
      status: Status.failed,
    });
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

async function runFetchingStage() {
  logger.debug('page fetching stage');

  const project = await getProject();
  const designSystemComponentsList = await getDesignSystemComponentsList(
    project.settings.designSystemId,
  );

  return {
    project,
    designSystemComponentsList,
  } as Partial<PagePipelineContext>;
}

async function runGeneratingStage({
  workInProgressPage,
  projectPages,
  designSystemComponentsList,
}: PagePipelineContext) {
  logger.debug('page generating stage');

  const pageStructure = await getProjectPageStructure(workInProgressPage.externalId);

  const { pageComponentsList } = await parseProjectPage(
    pageStructure,
    convertToMap(designSystemComponentsList),
  );

  const generatedPages = [...projectPages, workInProgressPage].map((page) => ({
    pageUrl: page.url,
    path: getAbsolutePageFilePath(getPageFolderPathFromUrl(page.url)),
    pageName: getPageComponentName(getPageFolderPathFromUrl(page.url)),
  }));

  await createApplicationPageFile(pageStructure, pageComponentsList);
  await createApplicationFile(generatedPages);

  return {
    componentsRequiringBundles: getMissedComponentsList(pageComponentsList),
    generatedPages,
  };
}

async function runPreparingStage({
  project,
  componentsRequiringBundles,
  designSystemComponentsList,
}: PagePipelineContext) {
  logger.debug(`page preparing stage`);

  await collectMissedComponents({
    project: project!,
    missedComponents: componentsRequiringBundles,
    foundationKitComponent: designSystemComponentsList.find(
      (component) => component.name === 'foundation-kit',
    )!,
  });
}

async function runCompilationStage({ projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug('page compilation stage');

  return compile([...projectPages.map(({ url }) => url), workInProgressPage.url]);
}

async function runExportStage({
  project,
  projectPages,
  workInProgressPage,
  clientEmittedAssets,
}: PagePipelineContext) {
  logger.debug('page export stage');

  await exportPages(project!, [...projectPages.map((page) => page.url), workInProgressPage.url]);
  await exportClientStaticFiles(clientEmittedAssets);
}

async function runCommitStage() {
  logger.debug(`page commit stage`);

  await commit();
}

// TODO
// 1) remove created page
// 2) revert application.jsx
// 3) if compile stage happened than get persistent folder files by client/server emitted files
// 4) if export stage happened than
async function runRollback() {}
