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
import { Page, PageAttributesNew, PageSnapshot, Pipeline } from '../../models';
import { getProject } from '../../sdk/platform/platform.sdk';
import { Project } from '../../sdk/platform/types';
import { Stage } from '../../types';
import { ComponentLike, getUniqueComponents } from '../component/component.service';
import { compile } from '../pipeline/compiling.service';
import { exportPages } from '../pipeline/export.service';
import { getDesignSystemComponentsList } from '../pipeline/fetching.service';
import { updatePipeline } from '../pipeline/pipeline.service';
import { prepare } from '../pipeline/preparing.service';
import { teardown } from '../pipeline/teardown.service';

export type PagePipelineContext = {
  project: Project | null;
  pages: Page[];
  pipeline: Pipeline;
  snapshot: EagerLoaded<PageSnapshot, 'page'>;
  designSystemComponentsList: ComponentLike[];
  componentsRequiringBundles: ComponentLike[];
  foundationKitComponent: ComponentLike | null;
};

export function createPage(values: PageAttributesNew): Promise<Page> {
  return Page.create(values);
}

// TODO: to figure out about converting snapshot -> snapshots
export function createPagePipelineContext(
  context: Partial<PagePipelineContext> & {
    pipeline: Pipeline;
    snapshot: PageSnapshot;
    pages: Page[];
  },
): PagePipelineContext {
  return {
    project: null,
    designSystemComponentsList: [],
    componentsRequiringBundles: [],
    foundationKitComponent: null,
    ...context,
  };
}

export async function runFetchingStage({ pipeline }: PagePipelineContext): Promise<{
  project: Project;
  designSystemComponentsList: ComponentLike[];
  foundationKitComponent: ComponentLike;
}> {
  logger.debug('page fetching stage');

  await updatePipeline(pipeline, { stage: Stage.fetching });

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
  pipeline,
  componentsRequiringBundles,
  foundationKitComponent,
}: PagePipelineContext): Promise<void> {
  logger.debug(`page preparing stage`);

  await updatePipeline(pipeline, { stage: Stage.preparing });

  await prepare({
    foundationKitComponent: foundationKitComponent!,
    designSystemId: project!.settings.designSystemId,
    components: getUniqueComponents(componentsRequiringBundles),
  });
}

export async function runCompilationStage({ pages, pipeline }: PagePipelineContext): Promise<void> {
  logger.debug('page compilation stage');

  await updatePipeline(pipeline, { stage: Stage.compilation });

  await compile(pages);
}

export async function runExportStage({ pages, pipeline }: PagePipelineContext): Promise<void> {
  logger.debug('page export stage');

  await updatePipeline(pipeline, { stage: Stage.export });

  await exportPages(pages);
}

// TODO: A decision needs to be made about which side (platform or tessera)
// TODO: the affected pages were found on, considering the updated component.
// ts-prune-ignore-next
export async function runTeardownStage({
  project,
  snapshot,
  componentsRequiringBundles,
}: PagePipelineContext): Promise<void> {
  logger.debug('page teardown stage');

  await teardown({
    snapshot,
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
