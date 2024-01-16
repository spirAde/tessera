import { outputFile, readdirSync } from 'fs-extra';
import path from 'path';
import upperFirst from 'lodash/upperFirst';
import escape from 'lodash/escape';
import difference from 'lodash/difference';
import { stripIndent } from 'common-tags';

import {
  ComponentLike,
  ProjectPageStructureComponent,
  StrictProjectPageStructure,
} from '../../sdk/platform.sdk';
import { getApplicationPageFileContent } from '../../templates/templates/page.template';
import { getApplicationFileContent } from '../../templates/templates/application.template';
import { getPageFolderPathFromUrl } from '../../lib/url';
import { temporaryApplicationBuildFolderRootPath } from '../../config';

interface GeneratedPage {
  pageUrl: string;
  path: string;
  pageName: string;
}

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
  const pageComponentName = getPageComponentName(pageFolderPath);
  const componentsTree = getPageComponentsTree(pageStructure.template);
  const componentsImports = getPageComponentsImports(componentsList);
  const absolutePageFilePath = getAbsolutePageFilePath(pageFolderPath);

  const pageFileContent = getApplicationPageFileContent({
    pageName: pageComponentName,
    pageContent: componentsTree,
    pageFooter: JSON.stringify({}),
    imports: componentsImports,
    loadableComponents: '',
    businessTheme: "'main'",
    colorTheme: "'light'",
  });

  await outputFile(absolutePageFilePath, stripIndent(pageFileContent));

  return { pageComponentName, pageFilePath: absolutePageFilePath };
}

export async function createApplicationFile(generatedPages: GeneratedPage[]) {
  const applicationFileContent = getApplicationFileContent({
    loadableComponents: getApplicationLoadableComponents(generatedPages),
    projectInitialStore: JSON.stringify({}),
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
  return folderName ? formatComponentName(folderName) : 'Main';
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

function getPageComponentsTree(template: ProjectPageStructureComponent[]) {
  return template.reduce((tree, component) => {
    return tree + getComponentsTree(component);
  }, '');
}

function getComponentsTree(component: ProjectPageStructureComponent) {
  if (component.result.isHidden) {
    return '';
  }

  const componentName = formatComponentName(component.componentName);

  let result = `<${componentName} {...platformContext} ${stringifyProps(component.result)}>`;

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

function formatComponentName(componentName: string) {
  return componentName.split('-').map(upperFirst).join('');
}

function stringifyProps(props: Record<string, unknown>) {
  return Object.entries(props).reduce((propsString, [propKey, propValue]) => {
    if (ignoreProps.includes(propKey)) {
      return propsString;
    }

    if (typeof propValue === 'boolean') {
      return [propsString, propValue ? propKey : `${propKey}={${propValue}}`].join(' ');
    }

    if (typeof propValue === 'string') {
      return [propsString, `${propKey}="${escape(propValue)}"`].join(' ');
    }

    return [propsString, `${propKey}={${propValue}}`].join(' ');
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
      return `import ${formatComponentName(name)} from '@/components/${name}@${version}';`;
    })
    .join('\n');
}
