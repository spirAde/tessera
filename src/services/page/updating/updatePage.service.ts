import { Page } from '../../../models';
import { logger } from '../../../lib/logger';
import { getProjectPageStructure } from '../../../sdk/platform.sdk';
import { runPipeline } from '../../pipeline/pipeline.service';
import { getDesignSystemComponentsList, getProject } from '../../pipeline/fetching.service';
import { convertToMap, createApplicationPageFile } from '../../pipeline/generating.service';
import { parseProjectPage } from '../../pipeline/parsing.service';
import { compile } from '../../pipeline/compiling.service';
import { exportClientStaticFiles, exportPages } from '../../pipeline/export.service';
import { PagePipelineContext, createPagePipelineContext, updatePage } from '../page.service';
import { Status } from '../../../types';
import { getMissedComponentsList } from '../../component.service';
import { commit } from '../../pipeline/commit.service';
import { collectMissedComponents } from '../../pipeline/preparing.service';

export async function runPageUpdating(page: Page) {
  try {
    await runPageUpdatingPipeline(page);
  } catch (error) {
    logger.fatal(error);
    await updatePage(page, {
      status: Status.failed,
    });
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
    runGeneratingStage,
    runPreparingStage,
    runCompilationStage,
    runExportStage,
    runCommitStage,
  ];

  await runPipeline(pipelineContext, handlers);

  logger.debug(`page updating pipeline is successfully finished`);
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
  designSystemComponentsList,
}: PagePipelineContext) {
  logger.debug('page generating stage');

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
  workInProgressPage,
  clientEmittedAssets,
}: PagePipelineContext) {
  logger.debug('page export stage');

  await exportPages(project!, [workInProgressPage.url]);
  await exportClientStaticFiles(clientEmittedAssets);
}

async function runCommitStage() {
  logger.debug(`page commit stage`);

  await commit();
}
