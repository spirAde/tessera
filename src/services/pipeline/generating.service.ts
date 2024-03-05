import { stripIndent } from 'common-tags';
import { outputFile } from 'fs-extra';
import escape from 'lodash/escape';
import upperFirst from 'lodash/upperFirst';
import path from 'path';

import {
  normalizePageComponentsVersionsGivenDesignSystem,
  parsePageStructureComponentsList,
} from './parsing.service';
import { useWorkerThreadsProcessing, temporaryApplicationBuildFolderRootPath } from '../../config';
import { logger } from '../../lib/logger';
import { isFulfilled } from '../../lib/promise';
import { getRandomString } from '../../lib/random';
import { getPageFolderPathFromUrl } from '../../lib/url';
import { Page, PageSnapshot } from '../../models';
import { getProjectPageStructure } from '../../sdk/platform/platform.sdk';
import { ProjectPageStructureComponent, ProjectPageStructure } from '../../sdk/platform/types';
import { getApplicationFileContent } from '../../templates/templates/application.template';
import { getApplicationPageFileContent } from '../../templates/templates/page.template';
import { Stage, Status } from '../../types';
import { ComponentLike } from '../component/component.service';
import { getHelmetComponent } from '../component/helmet.service';
import { getLastPageSnapshot, updatePageSnapshot } from '../pageSnapshot/pageSnapshot.service';
import { createPool } from '../thread.service';

type GeneratedPage = {
  pageUrl: string;
  path: string;
  pageName: string;
};

const maxPageNameLength = 42;
const ignoreProps = [
  'components',
  'componentName',
  'version',
  'objectTypeSysName',
  'uiOrder',
  'uuid',
];

export async function createApplicationFile(generatedPages: GeneratedPage[]): Promise<void> {
  const applicationFileContent = getApplicationFileContent({
    loadableComponents: getApplicationLoadableComponents(generatedPages),
    projectInitialStore: JSON.stringify({
      systemData: {
        mediaHost: 'https://admin.t1-academy.ru/api/mediastorage',
        // TODO: project config
      },
    }),
    routes: getApplicationRoutes(generatedPages),
  });

  const absoluteApplicationFilePath = path.join(
    temporaryApplicationBuildFolderRootPath,
    'application/application.jsx',
  );

  await outputFile(absoluteApplicationFilePath, stripIndent(applicationFileContent));
}

export async function generatePage(
  page: Page,
  designSystemComponentsMap: Map<string, string>,
): Promise<{
  pageFilePath: string;
  pageComponentName: string;
  pageComponentsList: ComponentLike[];
}> {
  logger.debug(`generating page: id: - ${page.externalId}, url - ${page.url}`);

  const pageStructure = await getProjectPageStructure(page.externalId);
  const pageComponentsList = normalizePageComponentsVersionsGivenDesignSystem(
    designSystemComponentsMap,
    parsePageStructureComponentsList(pageStructure),
  );

  const { pageFilePath, pageComponentName } = await createApplicationPageFile(
    pageStructure,
    pageComponentsList,
  );

  return { pageFilePath, pageComponentName, pageComponentsList };
}

export function generatePages(
  pages: Page[],
  designSystemComponentsMap: Map<string, string>,
): Promise<{
  generatedPages: GeneratedPage[];
  componentsRequiringBundles: ComponentLike[];
}> {
  // nock supports only main thread catching request, as result we can skip this branch
  /* istanbul ignore if */
  if (useWorkerThreadsProcessing) {
    return processGeneratingInWorkerThreads(pages, designSystemComponentsMap);
  }

  return processGeneratingInMainThread(pages, designSystemComponentsMap);
}

export function getPageComponentName(pageFolderPath: string): string {
  const folderName = pageFolderPath.split('/').reverse()[0];
  return folderName
    ? getHumanReadableComponentName(`page-${folderName}`)
        .slice(0, maxPageNameLength)
        .concat(getRandomString())
    : 'PageMain'.concat(getRandomString());
}

export function getAbsolutePageFilePath(
  pageFolderPath: string,
  prefix = temporaryApplicationBuildFolderRootPath,
): string {
  return path.join(prefix, 'pages', pageFolderPath, 'index.jsx');
}

async function createApplicationPageFile(
  pageStructure: ProjectPageStructure,
  componentsList: ComponentLike[],
) {
  const pageFolderPath = getPageFolderPathFromUrl(pageStructure.url);
  const absolutePageFilePath = getAbsolutePageFilePath(pageFolderPath);

  const pageHelmetComponent = getHelmetComponent({
    url: pageStructure.url,
    seo: pageStructure.seo.result,
    meta: pageStructure.meta.result,
  });
  const pageComponentsTree = getPageComponentsTree(pageStructure.template, [pageHelmetComponent]);
  const pageComponentsImports = getPageComponentsImports(componentsList);
  const pageComponentName = getPageComponentName(pageFolderPath);

  const pageFileContent = getApplicationPageFileContent({
    pageName: pageComponentName,
    pageContent: pageComponentsTree,
    pageFooter: JSON.stringify({}),
    imports: pageComponentsImports,
    businessTheme: "'main'",
    colorTheme: "'light'",
  });

  await outputFile(absolutePageFilePath, stripIndent(pageFileContent));

  return { pageComponentName, pageFilePath: absolutePageFilePath };
}

/* istanbul ignore next */
async function processGeneratingInWorkerThreads(
  pages: Page[],
  designSystemComponentsMap: Map<string, string>,
) {
  const pool = createPool(Stage.generating);

  const promises: Promise<{
    pageFilePath: string;
    pageComponentName: string;
    pageComponentsList: ComponentLike[];
  }>[] = pages.map((page) => pool.run({ pageId: page.id, designSystemComponentsMap }));

  const tasksOutput = await Promise.allSettled(promises);

  const groupedTasksOutput = tasksOutput.reduce<{
    fulfilled: {
      generatedPages: GeneratedPage[];
      componentsRequiringBundles: ComponentLike[];
    };
    rejected: Page[];
  }>(
    (groups, taskOutput, currentIndex) => {
      if (isFulfilled(taskOutput)) {
        return {
          ...groups,
          fulfilled: {
            componentsRequiringBundles: [
              ...groups.fulfilled.componentsRequiringBundles,
              ...taskOutput.value.pageComponentsList,
            ],
            generatedPages: [
              ...groups.fulfilled.generatedPages,
              {
                pageUrl: pages[currentIndex].url,
                path: taskOutput.value.pageFilePath,
                pageName: taskOutput.value.pageComponentName,
              },
            ],
          },
        };
      }

      return {
        ...groups,
        rejected: [...groups.rejected, pages[currentIndex]],
      };
    },
    {
      fulfilled: {
        componentsRequiringBundles: [],
        generatedPages: [],
      },
      rejected: [],
    },
  );

  const snapshots = await Promise.all(
    groupedTasksOutput.rejected.map((page) => getLastPageSnapshot(page.id)),
  );

  groupedTasksOutput.rejected.length > 0 &&
    (await PageSnapshot.update(
      { status: Status.failed },
      {
        where: {
          id: snapshots.map((snapshot) => snapshot.id),
        },
      },
    ));

  return groupedTasksOutput.fulfilled;
}

async function processGeneratingInMainThread(
  pages: Page[],
  designSystemComponentsMap: Map<string, string>,
) {
  const componentsRequiringBundles: ComponentLike[] = [];
  const generatedPages: GeneratedPage[] = [];

  for (const page of pages) {
    try {
      const { pageFilePath, pageComponentName, pageComponentsList } = await generatePage(
        page,
        designSystemComponentsMap,
      );

      componentsRequiringBundles.push(...pageComponentsList);

      generatedPages.push({
        pageUrl: page.url,
        path: pageFilePath,
        pageName: pageComponentName,
      });
    } catch (error) {
      const pageSnapshot = await getLastPageSnapshot(page.id);
      await updatePageSnapshot(pageSnapshot, {
        status: Status.failed,
      });
    }
  }

  return { componentsRequiringBundles, generatedPages };
}

function getPageComponentsTree(
  template: ProjectPageStructureComponent[],
  initialTreeNodes: string[] = [],
) {
  return template.reduce((tree, component) => {
    return tree + getComponentsTree(component);
  }, initialTreeNodes.join(''));
}

function getComponentsTree(component: ProjectPageStructureComponent) {
  if (component.result.isHidden) {
    return '';
  }

  const componentName = getHumanReadableComponentName(component.componentName);

  let result = `<${componentName} {...projectContext} ${stringifyProps(component.result)}>`;

  if (component.components?.length > 0) {
    component.components.forEach((childComponent) => {
      result += getComponentsTree(childComponent);
    });
  }

  if (component.result.components) {
    component.result.components.forEach((childComponent) => {
      result += getComponentsTree(childComponent);
    });
  }

  result += `</${componentName}>`;

  return result;
}

function getHumanReadableComponentName(componentName: string) {
  return componentName.split('-').map(upperFirst).join('');
}

function stringifyProps(props: Record<string, unknown>) {
  return Object.entries(props).reduce((propsString, [key, value]) => {
    if (ignoreProps.includes(key)) {
      return propsString;
    }

    if (typeof value === 'boolean') {
      return [propsString, value ? key : `${key}={${value}}`].join(' ');
    }

    if (typeof value === 'string') {
      return [propsString, `${key}="${escape(value)}"`].join(' ');
    }

    return [propsString, `${key}={${value}}`].join(' ');
  }, '');
}

function getApplicationLoadableComponents(generatedPages: GeneratedPage[]) {
  return generatedPages
    .map(({ path: pagePath, pageName }) => {
      return `const ${pageName} = loadable(() => import('${pagePath}'))`;
    })
    .join('\n');
}

function getApplicationRoutes(generatedPages: GeneratedPage[]) {
  return generatedPages
    .map(({ pageUrl, pageName }) => {
      return `<Route exact path="${pageUrl}" element={<${pageName} />} />`;
    })
    .join('\n');
}

function getPageComponentsImports(componentsList: ComponentLike[]) {
  return componentsList
    .map(({ name, version }) => {
      return `import ${getHumanReadableComponentName(name)} from '@/components/outer/${name}@${version}';`;
    })
    .join('\n');
}
