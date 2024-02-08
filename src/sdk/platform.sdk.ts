/* istanbul ignore file */

import got from 'got';
import { isTest } from '../config';
import { projectsMock } from '../mocks/projects.mock';
import { designSystemMock } from '../mocks/designSystem.mock';
import { pagesMock, projectPagesMock } from '../mocks/pages.mock';

type ProjectInfoSysName =
  | 'PROGRESS_BAR_ENABLE'
  | 'PROJECT_SYS_NAME'
  | 'ENABLE_TO_LOAD_SECONDARY_COMPONENTS'
  | 'BACKEND_ENDPOINT'
  | 'API_PATH'
  | 'COMPONENTS_PATH'
  | 'COMPONENTS_RESOLVER_PATH'
  | 'PAGE_PATH'
  | 'SCRIPTS_PATH'
  | 'MENU_PATH'
  | 'FOOTER_PATH'
  | 'MEDIA_HOST'
  | 'DESIGN_SYSTEM_ID';

interface RawProjectPageStructure {
  Data: string;
  [key: string]: unknown;
}

export interface ProjectPageStructureSeoProps {
  title: string;
  description: string;
  keywords: string;
  tabName: string;
  uiOrder: number;
}

interface ProjectPageStructureSeo {
  id: number;
  title: string;
  objectTypeSysName: string;
  version: string;
  componentName: string;
  result: ProjectPageStructureSeoProps;
  uiOrder: number;
  editable: boolean;
}

interface ProjectPageStructureProps {
  uiOrder: number;
  footerId: string;
  [key: string]: string | number | boolean;
}

interface ProjectPageStructureBreadcrumb {
  title: string;
  url: string;
}

export interface ProjectPageStructureMetaProps {
  title: string;
  items: ProjectPageStructureMetaItemProps[];
  uiOrder: number;
}

export interface ProjectPageStructureMetaItemProps {
  name: string;
  property: string;
  content: string;
}

interface ProjectPageStructureMeta {
  id: number;
  title: string;
  objectTypeSysName: string;
  version: string;
  result: ProjectPageStructureMetaProps;
  uiOrder: number;
}

export interface StrictProjectPageStructure {
  id: number;
  title: string;
  objectTypeSysName: string;
  version: string;
  meta: ProjectPageStructureMeta;
  result: ProjectPageStructureProps;
  template: ProjectPageStructureComponent[];
  uiOrder: string;
  breadcrumbs: ProjectPageStructureBreadcrumb[];
  breadcrumbTitle: string;
  url: string;
  seo: ProjectPageStructureSeo;
  code: number;
  designSystemId: number;
  projectSysName: string;
}

interface ProjectPageStructureComponentProps {
  id: string;
  theme: string;
  uiOrder: number;
  components?: ProjectPageStructureComponent[];
  [key: string]: unknown;
}

export interface ComponentLike {
  name: string;
  version: string;
}

export interface ProjectPageStructureComponent {
  id: number;
  uuid: string;
  title: string;
  objectTypeSysName: string;
  version: string;
  componentName: string;
  uiOrder: string;
  result: ProjectPageStructureComponentProps;
  components: ProjectPageStructureComponent[];
}

interface ProjectSpaParametersBucket {
  sysName: ProjectInfoSysName;
  name: ProjectInfoSysName;
  value: number | string | boolean;
}

interface ProjectSettings {
  baseUrl: string;
  spaParameters: ProjectSpaParametersBucket[];
  designSystemId: number;
}

export interface Project {
  id: number;
  title: string;
  sysName: string;
  description: string;
  settings: ProjectSettings;
}

export interface DesignSystemComponent {
  id: number;
  title: string;
  sysName: string;
  componentName: string;
  currentVersion: string;
  active: boolean;
  designSystemId: string;
  componentType: string;
}

export interface ProjectPage {
  id: number;
  url: string;
}

const client = got.extend({
  timeout: {
    request: 20_000,
  },
  retry: 0,
});

export async function getProjectPages(projectSysName: string) {
  const response = isTest
    ? await client
        .get(
          `${process.env.PLATFORM_HOST}/api/sitepages/page/list?projectSysName=${projectSysName}`,
        )
        .json<{ pages: ProjectPage[] }>()
    : projectPagesMock;

  return response.pages;
  // return new Promise((resolve) => setTimeout(() => resolve(projectPagesMock), 1000));
}

export async function getProjectPageStructure(pageId: number) {
  const projectPage: RawProjectPageStructure | StrictProjectPageStructure = isTest
    ? await client.get(`${process.env.PLATFORM_HOST}/api/sitepages/page/${pageId}/result`).json()
    : await new Promise((resolve) =>
        // @ts-ignore
        setTimeout(() => resolve(pagesMock[pageId] as unknown as StrictProjectPageStructure), 1000),
      );

  if (!projectPage) {
    throw new Error(`error: ${pageId}`);
  }

  if (isStrictProjectPageStructure(projectPage)) {
    return projectPage;
  }

  return JSON.parse(projectPage.Data) as StrictProjectPageStructure;
}

export function getProjectDesignSystemComponents(
  designSystemId: number,
): Promise<DesignSystemComponent[]> {
  return isTest
    ? client
        .get(
          `${process.env.PLATFORM_HOST}/api/sitepages/components?designSystemId=${designSystemId}`,
        )
        .json()
    : new Promise((resolve) =>
        setTimeout(() => resolve(designSystemMock as unknown as DesignSystemComponent[]), 1000),
      );
}

export function getDesignSystemComponentSource(designSystemId: number, component: ComponentLike) {
  return isTest
    ? client
        .get(
          `${process.env.PLATFORM_HOST}/api/mediastorage/media-files/system/design-systems/${designSystemId}/${component.name}/${component.name}@${component.version}.js`,
        )
        .text()
    : client.get(`http://localhost:3025/api/${component.name}@${component.version}.js`).text();
}

export function getProjects(): Promise<Project[]> {
  return isTest
    ? client.get(`${process.env.PLATFORM_HOST}/api/app/project/list`).json()
    : new Promise((resolve) =>
        setTimeout(() => resolve(projectsMock as unknown as Project[]), 1000),
      );
}

function isStrictProjectPageStructure(
  projectPage: RawProjectPageStructure | StrictProjectPageStructure,
): projectPage is StrictProjectPageStructure {
  return (
    !('Data' in projectPage) &&
    Object.keys(projectPage).some((structureKey) => ['template', 'result'].includes(structureKey))
  );
}
