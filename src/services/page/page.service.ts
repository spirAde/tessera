import { copy, remove } from 'fs-extra';
import path from 'path';

import {
  persistentApplicationBuildFolderRootPath,
  persistentApplicationExportFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
} from '../../config';
import { logger } from '../../lib/logger';
import { getPageFolderPathFromUrl } from '../../lib/url';
import { Page, PageAttributes, PageAttributesNew } from '../../models';
import { getProject } from '../../sdk/platform/platform.sdk';
import { Project } from '../../sdk/platform/types';
import { Stage } from '../../types';
import { ComponentLike, getUniqueComponents } from '../component/component.service';
import { compile } from '../pipeline/compiling.service';
import { exportPages } from '../pipeline/export.service';
import { getDesignSystemComponentsList } from '../pipeline/fetching.service';
import { prepare } from '../pipeline/preparing.service';
import { teardown } from '../pipeline/teardown.service';

type PageUpdate = Partial<PageAttributes>;

export enum PipelineType {
  create = 'create',
  update = 'update',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  remove = 'remove',
}

export type PagePipelineContext = {
  project: Project | null;
  projectPages: Page[];
  workInProgressPage: Page;
  designSystemComponentsList: ComponentLike[];
  componentsRequiringBundles: ComponentLike[];
  foundationKitComponent: ComponentLike | null;
};

export function createPage(values: PageAttributesNew): Promise<Page> {
  return Page.create(values);
}

export function updatePage(page: Page, values: PageUpdate): Promise<Page> {
  return page.update(values);
}

export function createPagePipelineContext(
  context: Partial<PagePipelineContext> & { workInProgressPage: Page; projectPages: Page[] },
): PagePipelineContext {
  return {
    project: null,
    designSystemComponentsList: [],
    componentsRequiringBundles: [],
    foundationKitComponent: null,
    ...context,
  };
}

export async function runFetchingStage({ workInProgressPage }: PagePipelineContext): Promise<{
  project: Project;
  designSystemComponentsList: ComponentLike[];
  foundationKitComponent: ComponentLike;
}> {
  logger.debug('page fetching stage');

  await updatePage(workInProgressPage, { stage: Stage.fetching });

  const project = await getProject();
  const designSystemComponentsList = await getDesignSystemComponentsList(
    project.settings.designSystemId,
  );
  const foundationKitComponent = designSystemComponentsList.find(
    (component) => component.name === 'foundation-kit',
  );

  if (!foundationKitComponent) {
    throw new Error('missed foundation kit component');
  }

  return {
    project: project as Project,
    designSystemComponentsList,
    foundationKitComponent,
  };
}

export async function runPreparingStage({
  project,
  workInProgressPage,
  componentsRequiringBundles,
  foundationKitComponent,
}: PagePipelineContext): Promise<void> {
  logger.debug(`page preparing stage`);

  await updatePage(workInProgressPage, { stage: Stage.preparing });

  await prepare({
    foundationKitComponent: foundationKitComponent!,
    designSystemId: project!.settings.designSystemId,
    components: getUniqueComponents(componentsRequiringBundles),
  });
}

export async function runCompilationStage({
  projectPages,
  workInProgressPage,
}: PagePipelineContext): Promise<void> {
  logger.debug('page compilation stage');

  await updatePage(workInProgressPage, { stage: Stage.compilation });

  await compile([...projectPages.map(({ url }) => url), workInProgressPage.url]);
}

export async function runExportStage({
  projectPages,
  workInProgressPage,
}: PagePipelineContext): Promise<void> {
  logger.debug('page export stage');

  await updatePage(workInProgressPage, { stage: Stage.export });

  await exportPages([...projectPages, workInProgressPage]);
}

export async function runTeardownStage({
  project,
  workInProgressPage,
  componentsRequiringBundles,
}: PagePipelineContext): Promise<void> {
  logger.debug('page teardown stage');

  await teardown({
    workInProgressPage,
    components: componentsRequiringBundles,
    designSystemId: project!.settings.designSystemId,
  });
}

export async function rollbackCompilationStage(): Promise<void> {
  await remove(path.join(temporaryApplicationBuildFolderRootPath, 'build'));
  await copy(
    path.join(persistentApplicationBuildFolderRootPath, 'build'),
    path.join(temporaryApplicationBuildFolderRootPath, 'build'),
  );
}

export async function rollbackExportStage(): Promise<void> {
  await remove(path.join(temporaryApplicationExportFolderRootPath, 'pages'));
  await copy(
    path.join(persistentApplicationExportFolderRootPath, 'pages'),
    path.join(temporaryApplicationExportFolderRootPath, 'pages'),
  );
}

export function getExportPageIndexHtmlFilePath(page: Page): string {
  return path.join('pages', getPageFolderPathFromUrl(page.url), 'index.html');
}

export function getExportPageFilePath(page: Page): string {
  return path.join(temporaryApplicationExportFolderRootPath, getExportPageIndexHtmlFilePath(page));
}
