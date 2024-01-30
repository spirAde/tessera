import { outputFile, readdirSync } from 'fs-extra';
import path from 'path';
import upperFirst from 'lodash/upperFirst';
import escape from 'lodash/escape';
import difference from 'lodash/difference';
import { stripIndent } from 'common-tags';

import { temporaryApplicationBuildFolderRootPath } from '../../config';
import {
  ComponentLike,
  ProjectPageStructureComponent,
  ProjectPageStructureMetaItemProps,
  ProjectPageStructureMetaProps,
  ProjectPageStructureSeoProps,
  StrictProjectPageStructure,
} from '../../sdk/platform.sdk';
import { getApplicationPageFileContent } from '../../templates/templates/page.template';
import { getApplicationFileContent } from '../../templates/templates/application.template';
import { getPageFolderPathFromUrl } from '../../lib/url';
import { getRandomString } from '../../lib/random';

export interface GeneratedPage {
  pageUrl: string;
  path: string;
  pageName: string;
}

const maxPageNameLength = 42;
const ignoreProps = [
  'components',
  'componentName',
  'version',
  'objectTypeSysName',
  'uiOrder',
  'uuid',
];

export async function createApplicationPageFile(
  pageStructure: StrictProjectPageStructure,
  componentsList: ComponentLike[],
) {
  const pageFolderPath = getPageFolderPathFromUrl(pageStructure.url);
  const absolutePageFilePath = getAbsolutePageFilePath(pageFolderPath);

  const pageHelmetComponent = getPageHelmetComponent({
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

export async function createApplicationFile(generatedPages: GeneratedPage[]) {
  const applicationFileContent = getApplicationFileContent({
    loadableComponents: getApplicationLoadableComponents(generatedPages),
    projectInitialStore: JSON.stringify({
      systemData: {
        mediaHost: 'https://admin.t1-academy.ru/api/mediastorage',
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

export function convertToMap(components: ComponentLike[]) {
  return components.reduce(
    (map, component) => map.set(component.name, component.version),
    new Map<string, string>(),
  );
}

export function getPageComponentName(pageFolderPath: string) {
  const folderName = pageFolderPath.split('/').reverse()[0];
  return folderName
    ? getHumanReadableComponentName(`page-${folderName}`)
        .slice(0, maxPageNameLength)
        .concat(getRandomString())
    : 'PageMain';
}

export function getAbsolutePageFilePath(
  pageFolderPath: string,
  prefix = temporaryApplicationBuildFolderRootPath,
) {
  return path.join(prefix, 'pages', pageFolderPath, 'index.jsx');
}

export function getMissedComponentsList(componentsList: ComponentLike[]) {
  const currentComponentFiles = readdirSync(
    path.join(temporaryApplicationBuildFolderRootPath, 'components'),
  );

  const missedComponentFiles = difference(
    componentsList.map(({ name, version }) => `${name}@${version}.js`),
    currentComponentFiles,
  );

  return missedComponentFiles.map((componentFile) => {
    const [name, version] = componentFile.replace('.js', '').split('@');
    return { name, version };
  }) as ComponentLike[];
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
    .map(({ path, pageName }) => {
      return `const ${pageName} = loadable(() => import('${path}'))`;
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
      return `import ${getHumanReadableComponentName(name)} from '@/components/${name}@${version}';`;
    })
    .join('\n');
}

function getPageHelmetComponent({
  url,
  seo,
  meta,
}: {
  url: string;
  seo: ProjectPageStructureSeoProps;
  meta: ProjectPageStructureMetaProps;
}) {
  const tags = adjustMetaTags(meta).map(
    (tag) => `<meta name="${tag.name}" content="${tag.content}" property="${tag.property}" />`,
  );

  return `
    <Helmet>
      <title>${seo.title}</title>
      <link rel="canonical" href="${url}" />
      <meta name="description" content="${seo.description}" />
      <meta name="keywords" content="${seo.keywords}" />
      ${tags}
    </Helmet>
  `;
}

function adjustMetaTags(meta: ProjectPageStructureMetaProps) {
  return (meta.items ?? []).reduce<ProjectPageStructureMetaItemProps[]>((tags, tag) => {
    if (isBotSpecificTag(tag)) {
      return [...tags, { ...tag, content: 'index,follow' }];
    }

    return isValidTag(tag) ? [...tags, tag] : tags;
  }, []);
}

function isBotSpecificTag(tag: ProjectPageStructureMetaItemProps) {
  return (tag.name === 'robots' || tag.name === 'googlebot') && !tag.content;
}

function isValidTag(tag: ProjectPageStructureMetaItemProps) {
  return tag.content || tag.name || tag.property;
}
