import { Page, PageAttributes, PageAttributesNew } from '../../models';
import { ComponentLike, Project } from '../../sdk/platform.sdk';
import { logger } from '../../lib/logger';
import { getDesignSystemComponentsList, getProject } from '../pipeline/fetching.service';
import { collectMissedComponents } from '../pipeline/preparing.service';
import { Stage } from '../../types';
import { compile } from '../pipeline/compiling.service';
import { exportClientStaticFiles, exportPages } from '../pipeline/export.service';

type PageUpdate = Partial<PageAttributes>;

export enum ProcessPagePipelineType {
  create = 'create',
  update = 'update',
  remove = 'remove',
}

export interface PagePipelineContext {
  project: Project | null;
  projectPages: Page[];
  workInProgressPage: Page;
  designSystemComponentsList: ComponentLike[];
  componentsRequiringBundles: ComponentLike[];
  serverEmittedAssets: string[];
  clientEmittedAssets: string[];
}

export function createPage(values: PageAttributesNew) {
  return Page.create(values);
}

export function updatePage(page: Page, values: PageUpdate) {
  return page.update(values);
}

export function createPagePipelineContext(
  context: Partial<PagePipelineContext> & { workInProgressPage: Page; projectPages: Page[] },
) {
  return {
    project: null,
    designSystemComponentsList: [],
    componentsRequiringBundles: [],
    serverEmittedAssets: [],
    clientEmittedAssets: [],
    ...context,
  };
}

export async function runFetchingStage({ workInProgressPage }: PagePipelineContext) {
  logger.debug('page fetching stage');

  await updatePage(workInProgressPage, {
    stage: Stage.fetching,
  });

  const project = await getProject();
  const designSystemComponentsList = await getDesignSystemComponentsList(
    project.settings.designSystemId,
  );

  return {
    project,
    designSystemComponentsList,
  } as Partial<PagePipelineContext>;
}

export async function runPreparingStage({
  project,
  workInProgressPage,
  componentsRequiringBundles,
  designSystemComponentsList,
}: PagePipelineContext) {
  logger.debug(`page preparing stage`);

  await updatePage(workInProgressPage, {
    stage: Stage.preparing,
  });

  await collectMissedComponents({
    project: project!,
    missedComponents: componentsRequiringBundles,
    foundationKitComponent: designSystemComponentsList.find(
      (component) => component.name === 'foundation-kit',
    )!,
  });
}

export async function runCompilationStage({
  projectPages,
  workInProgressPage,
}: PagePipelineContext) {
  logger.debug('page compilation stage');

  await updatePage(workInProgressPage, {
    stage: Stage.compilation,
  });

  const { clientEmittedAssets, serverEmittedAssets } = await compile([
    ...projectPages.map(({ url }) => url),
    workInProgressPage.url,
  ]);

  return { clientEmittedAssets, serverEmittedAssets };
}

export async function runExportStage({ projectPages, workInProgressPage }: PagePipelineContext) {
  logger.debug('page export stage');

  await updatePage(workInProgressPage, {
    stage: Stage.export,
  });

  await exportPages([...projectPages, workInProgressPage]);
  await exportClientStaticFiles();
}
