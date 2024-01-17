import { Page, PageAttributesNew, PageAttributes } from '../../models';
import { ComponentLike, Project } from '../../sdk/platform.sdk';
import { advisoryLock, advisoryUnlock } from '../../lib/lock';
import { logger } from '../../lib/logger';
import { getDesignSystemComponentsList, getProject } from '../pipeline/fetching.service';
import { collectMissedComponents } from '../pipeline/preparing.service';

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

export async function cancelLinearPageProcessing(page: Page) {
  await advisoryUnlock(getPageAdvisoryLockKey(page));
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

export async function runFetchingStage() {
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

export async function runPreparingStage({
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

export async function runPageAdvisoryLock({
  workInProgressPage,
}: Partial<PagePipelineContext> & { workInProgressPage: Page }) {
  await enforceLinearPageProcessing(workInProgressPage);
}

export async function runPageAdvisoryUnlock({
  workInProgressPage,
}: Partial<PagePipelineContext> & { workInProgressPage: Page }) {
  await cancelLinearPageProcessing(workInProgressPage);
}

async function enforceLinearPageProcessing(page: Page) {
  await advisoryLock(getPageAdvisoryLockKey(page));
}

function getPageAdvisoryLockKey(page: Page) {
  return `pages_${page.id}`;
}
