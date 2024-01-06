import { promises as fs } from 'fs';
import path from 'path';
import upperFirst from 'lodash/upperFirst';
import escape from 'lodash/escape';
import { stripIndent } from 'common-tags';
import {
  ProjectPageStructureComponent,
  StrictProjectPageStructure,
  ComponentLike,
  ProjectConfig,
  ProjectPageFooter,
  ProjectPageMetadata,
  ProjectHeader,
} from '../../sdk/platform.sdk';
import { getApplicationPageFileContent } from '../../templates/templates/page.template';
import { getApplicationFileContent } from '../../templates/templates/application.template';
import { getPageFolderPathFromUrl } from '../../lib/url';

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

export async function createApplicationPageFile({
  pageStructure,
  projectBuildFolderPath,
  componentsList,
}: {
  pageStructure: StrictProjectPageStructure;
  projectBuildFolderPath: string;
  componentsList: ComponentLike[];
}) {
  const pageFolderPath = getPageFolderPathFromUrl(pageStructure.url);
  const pageComponentName = getPageComponentName(pageFolderPath);
  const componentsTree = getPageComponentsTree(pageStructure.template);
  const componentsImports = getPageComponentsImports(componentsList);

  const absolutePageFolderPath = path.join(projectBuildFolderPath, 'pages', pageFolderPath);
  const absolutePageFilePath = path.join(absolutePageFolderPath, 'index.jsx');

  const pageFileContent = getApplicationPageFileContent({
    pageName: pageComponentName,
    pageContent: componentsTree,
    pageFooter: JSON.stringify({}),
    imports: componentsImports,
    loadableComponents: '',
    businessTheme: "'main'",
    colorTheme: "'light'",
  });

  await fs.mkdir(absolutePageFolderPath, { recursive: true });
  await fs.writeFile(absolutePageFilePath, stripIndent(pageFileContent));

  return { pageComponentName, pageFilePath: absolutePageFilePath };
}

export async function createApplicationFile({
  projectBuildFolderPath,
  generatedPages,
}: {
  projectBuildFolderPath: string;
  generatedPages: GeneratedPage[];
}) {
  const applicationFileContent = getApplicationFileContent({
    loadableComponents: getApplicationLoadableComponents(generatedPages),
    projectInitialStore: JSON.stringify({}),
    routes: getApplicationRoutes(generatedPages),
  });

  const absoluteApplicationFilePath = path.join(
    projectBuildFolderPath,
    'application/application.jsx',
  );

  await fs.writeFile(absoluteApplicationFilePath, stripIndent(applicationFileContent));
}

export function convertToMap(components: ComponentLike[]) {
  return components.reduce(
    (map, component) => map.set(component.name, component.version),
    new Map<string, string>(),
  );
}

function getPageComponentName(pageFolderPath: string) {
  const folderName = pageFolderPath.split('/').reverse()[0];
  return folderName ? formatComponentName(folderName) : 'Main';
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
