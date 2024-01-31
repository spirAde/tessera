import { Page, PageAttributes, PageAttributesNew } from '../../models';
import { ComponentLike, getProjectPageStructure, Project } from '../../sdk/platform.sdk';
import { advisoryLock, advisoryUnlock } from '../../lib/lock';
import { logger } from '../../lib/logger';
import { getDesignSystemComponentsList, getProject } from '../pipeline/fetching.service';
import { collectMissedComponents } from '../pipeline/preparing.service';
import { Stage } from '../../types';
import {
  normalizePageComponentsVersionsGivenDesignSystem,
  parsePageStructureComponentsList,
} from '../pipeline/parsing.service';
import { createApplicationPageFile } from '../pipeline/generating.service';

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

export async function runProjectPageGenerating(
  page: Page,
  designSystemComponentsMap: Map<string, string>,
) {
  logger.debug(`generating page: id: - ${page.externalId}, url - ${page.url}`);

  await updatePage(page, {
    stage: Stage.fetching,
  });

  const pageStructure = await getProjectPageStructure(page.externalId);
  const pageComponentsList = normalizePageComponentsVersionsGivenDesignSystem(
    designSystemComponentsMap,
    parsePageStructureComponentsList(pageStructure),
  );

  await updatePage(page, {
    stage: Stage.generating,
  });

  const { pageFilePath, pageComponentName } = await createApplicationPageFile(
    pageStructure,
    pageComponentsList,
  );

  return { pageFilePath, pageComponentName, pageComponentsList };
}

async function enforceLinearPageProcessing(page: Page) {
  await advisoryLock(getPageAdvisoryLockKey(page));
}

function getPageAdvisoryLockKey(page: Page) {
  return `pages_${page.id}`;
}
