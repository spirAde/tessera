import { Page, PageAttributesNew, PageAttributes } from '../../models';

import { ComponentLike, Project } from '../../sdk/platform.sdk';

type PageUpdate = Partial<PageAttributes>;

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

export function removePage(page: Page) {
  return page.destroy();
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

export function assertExportStageIsReadyToRun(
  context: PagePipelineContext,
): asserts context is PagePipelineContext & {
  project: Project;
} {
  if (!context.project) {
    throw new Error('project build has no project data');
  }
}
