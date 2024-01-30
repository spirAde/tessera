import { Stage, Status } from '../types';
import { Page } from '../models';
import { getProjectPageStructure, ProjectPage } from '../sdk/platform.sdk';
import { logger } from '../lib/logger';
import { createPage, updatePage } from '../services/page/page.service';
import {
  normalizePageComponentsVersionsGivenDesignSystem,
  parsePageStructureComponentsList,
} from '../services/pipeline/parsing.service';
import { createApplicationPageFile } from '../services/pipeline/generating.service';

module.exports = async function runProjectPagesGenerating({
  projectPages,
  buildId,
  designSystemComponentsMap,
}: {
  projectPages: ProjectPage[];
  buildId: number;
  designSystemComponentsMap: Map<string, string>;
}) {
  const componentsRequiringBundles = [];
  const generatedPages = [];

  for (const projectPage of projectPages) {
    logger.debug(
      `build pipeline generating page: id: - ${projectPage.id}, url - ${projectPage.url}`,
    );

    const page = await createPage({
      buildId,
      url: projectPage.url,
      stage: Stage.setup,
      status: Status.progress,
      externalId: projectPage.id,
    });

    try {
      const { pageFilePath, pageComponentName, pageComponentsList } =
        await runProjectPageGenerating(page, designSystemComponentsMap);

      componentsRequiringBundles.push(...pageComponentsList);

      generatedPages.push({
        pageUrl: page.url,
        path: pageFilePath,
        pageName: pageComponentName,
      });
    } catch (error) {
      await updatePage(page, {
        status: Status.failed,
      });
    }
  }

  return { componentsRequiringBundles, generatedPages };
};

async function runProjectPageGenerating(
  page: Page,
  designSystemComponentsMap: Map<string, string>,
) {
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
