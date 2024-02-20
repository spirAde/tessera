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
import { ComponentLike, Project } from '../../sdk/platform/types';
import { Stage } from '../../types';
import { compile } from '../pipeline/compiling.service';
import { exportPages } from '../pipeline/export.service';
import { getDesignSystemComponentsList, getProject } from '../pipeline/fetching.service';
import { collectMissedComponents } from '../pipeline/preparing.service';

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
    ...context,
  };
}

export async function runFetchingStage({ workInProgressPage }: PagePipelineContext): Promise<{
  project: Project;
  designSystemComponentsList: ComponentLike[];
}> {
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
  };
}

export async function runPreparingStage({
  project,
  workInProgressPage,
  componentsRequiringBundles,
  designSystemComponentsList,
}: PagePipelineContext): Promise<void> {
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
}: PagePipelineContext): Promise<void> {
  logger.debug('page compilation stage');

  await updatePage(workInProgressPage, {
    stage: Stage.compilation,
  });

  await compile([...projectPages.map(({ url }) => url), workInProgressPage.url]);
}

export async function runExportStage({
  projectPages,
  workInProgressPage,
}: PagePipelineContext): Promise<void> {
  logger.debug('page export stage');

  await updatePage(workInProgressPage, {
    stage: Stage.export,
  });

  await exportPages([...projectPages, workInProgressPage]);
}

export function getExportPageIndexHtmlFilePath(page: Page): string {
  return path.join('pages', getPageFolderPathFromUrl(page.url), 'index.html');
}

export function getExportPageFilePath(page: Page): string {
  return path.join(temporaryApplicationExportFolderRootPath, getExportPageIndexHtmlFilePath(page));
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
