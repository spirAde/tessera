import got from 'got';

export interface PlatformSettings {
  PROGRESS_BAR_ENABLE: boolean;
  BACKEND_ENDPOINT: string;
  API_PATH: string;
  PAGE_PATH: string;
  COMPONENTS_PATH: string;
  COMPONENTS_RESOLVER_PATH: string;
  PROJECT_SYS_NAME: string;
  MENU_PATH: string;
  FOOTER_PATH: string;
  SCRIPTS_PATH: string;
  FONT_FAMILY: string;
  HANDBOOKS_PATH: string;
  API_PREFIX: string;
  ENABLE_TO_LOAD_SECONDARY_COMPONENTS: boolean;
  DESIGN_SYSTEM_ID: number;
  MEDIA_HOST: string;
  MAIN_ENDPOINT: string;
}

export type ProjectInfoSysName =
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

interface ProjectPageStructureSeoProps {
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

interface ProjectPageStructureMetaProps {
  title: string;
  items: ProjectPageStructureMetaItemProps[];
  uiOrder: number;
}

interface ProjectPageStructureMetaItemProps {
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

export interface ProjectPageStructureComponentProps {
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

export interface ProjectSpaParametersBucket {
  sysName: ProjectInfoSysName;
  name: ProjectInfoSysName;
  value: number | string | boolean;
}

export interface ProjectSettings {
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

export interface ProjectConfig {
  BACKEND_ENDPOINT: string;
  API_PATH: string;
  PAGE_PATH: string;
  PROJECT_SYS_NAME: string;
  MENU_PATH: string;
  FOOTER_PATH: string;
  MEDIA_HOST: string;
  COMPONENTS_RESOLVER_PATH: string;
  COMPONENTS_PATH: string;
  DESIGN_SYSTEM_ID: number;
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

interface ProjectHeaderProps {
  logoType: string;
  phone: string;
  phoneType: string;
  phoneLink: string;
  isShowPhoneOnDesktop: boolean;
}

export interface ProjectPage {
  children: ProjectPage[];
  id: number;
  status: string;
  title: string;
  url: string;
}

interface ProjectHeaderComponentProps {
  link: string;
  target: string;
  title: string;
  isLinkWithArrow: boolean;
  uiOrder: number;
}

interface ProjectHeaderComponent {
  title: string;
  id: number;
  objectTypeSysName: string;
  version: string;
  result: ProjectHeaderComponentProps;
  children: ProjectHeaderComponent[];
}

export interface ProjectHeader {
  id: number;
  objectTypeSysName: string;
  version: string;
  result: ProjectHeaderProps;
  children: ProjectHeaderComponent[];
}

export interface ProjectPageFooter {
  isEnableDarkTheme: boolean;
  isEnableEngVersion: boolean;
  isEnableGeo: boolean;
  children: ProjectPageFooterFirstLevel[];
}

export interface ProjectPageMetadata {
  footerId: StrictProjectPageStructure['result']['footerId'];
  pageCode: StrictProjectPageStructure['code'];
  canonical: StrictProjectPageStructure['url'];
  breadcrumbs: StrictProjectPageStructure['breadcrumbs'];
  seo: StrictProjectPageStructure['seo']['result'];
  meta: StrictProjectPageStructure['meta']['result']['items'];
}

interface ProjectPageFooterFirstLevel {
  id: string;
  type: string;
  title: string;
  children: ProjectPageFooterSecondLevel[];
}

interface ProjectPageFooterSecondLevel {
  id: string;
  title: string;
  type: string;
  columns: number;
  sysName: string;
  children: ProjectPageFooterSecondLevel[];
}

const client = got.extend({
  timeout: {
    request: 20_000,
  },
  retry: 0,
});

export async function getProject(hostname: string) {
  return client.post(`${hostname}/getProjectInfo`).json<Project>();
}

export async function getProjectPages(projectSysName: string) {
  const response = await client
    .get(`${process.env.PLATFORM_HOST}/api/sitepages/page/list?projectSysName=${projectSysName}`)
    .json<{ pages: ProjectPage[] }>();

  return response.pages;
  // return new Promise((resolve) => setTimeout(() => resolve(projectPagesMock), 1000));
}

export function getProjectEndpoints(projectConfig: ProjectConfig) {
  const {
    BACKEND_ENDPOINT,
    API_PATH,
    PAGE_PATH,
    PROJECT_SYS_NAME,
    MENU_PATH,
    FOOTER_PATH,
    MEDIA_HOST,
    COMPONENTS_RESOLVER_PATH,
    COMPONENTS_PATH,
    DESIGN_SYSTEM_ID,
  } = projectConfig;

  return {
    pageEndpoint: (pageUrl: string) =>
      `${BACKEND_ENDPOINT}${API_PATH}${PAGE_PATH}${pageUrl}&projectSysName=${PROJECT_SYS_NAME}`,
    menuEndpoint: () => `${BACKEND_ENDPOINT}${API_PATH}${MENU_PATH}${PROJECT_SYS_NAME}`,
    footerEndpoint: (footerId: string) =>
      `${BACKEND_ENDPOINT}${API_PATH}${FOOTER_PATH}/${footerId}`,
    componentEndpoint: ({ name, version }: ComponentLike) =>
      `${MEDIA_HOST}${COMPONENTS_RESOLVER_PATH}/${DESIGN_SYSTEM_ID}/${name}/${name}@${version}.js`,
    designSystemEndpoint: () =>
      `${BACKEND_ENDPOINT}${API_PATH}${COMPONENTS_PATH}?designSystem=${DESIGN_SYSTEM_ID}`,
  };
}

export async function getProjectPage(pageId: number) {
  const projectPage: RawProjectPageStructure | StrictProjectPageStructure = await client
    .get(`${process.env.PLATFORM_HOST}/api/sitepages/page/${pageId}/result`)
    .json();
  // const projectPage: RawProjectPageStructure | StrictProjectPageStructure = await new Promise(
  //   (resolve) =>
  //     setTimeout(
  //       // @ts-ignore
  //       () => resolve(pagesMock[pageId]),
  //       1000,
  //     ),
  // );

  if (isStrictProjectPageStructure(projectPage)) {
    return projectPage;
  }

  return JSON.parse(projectPage.Data) as StrictProjectPageStructure;
}

export function getProjectDesignSystemComponents(
  designSystemId: number,
): Promise<DesignSystemComponent[]> {
  return client
    .get(`${process.env.PLATFORM_HOST}/api/sitepages/components?designSystemId=${designSystemId}`)
    .json();
  // return new Promise((resolve) =>
  //   setTimeout(() => resolve(designSystemMock as unknown as DesignSystemComponent[]), 1000),
  // );
}

export function getProjectHeader(projectHeaderEndpoint: string) {
  return client.get(projectHeaderEndpoint).json<ProjectHeader>();
}

export function getProjectPageFooter(footerEndpoint: string) {
  return client.get(footerEndpoint).json<ProjectPageFooter>();
}

export function getDesignSystemComponentSource(designSystemId: number, component: ComponentLike) {
  return client
    .get(
      `${process.env.PLATFORM_HOST}/api/mediastorage/media-files/system/design-systems/${designSystemId}/${component.name}/${component.name}@${component.version}.js`,
    )
    .text();
  // return client
  //   .get(`http://localhost:5000/dist/${component.name}/${component.name}@${component.version}.js`)
  //   .text();
}

export function getProjects(): Promise<Project[]> {
  return client.get(`${process.env.PLATFORM_HOST}/api/app/project/list`).json();
  // return new Promise((resolve) =>
  //   setTimeout(() => resolve(projectsMock as unknown as Project[]), 1000),
  // );
}

export function getPlatformSettings() {
  return client.get(`${process.env.PLATFORM_HOST}/app-settings.json`).json<Project[]>();
}

function isStrictProjectPageStructure(
  projectPage: RawProjectPageStructure | StrictProjectPageStructure,
): projectPage is StrictProjectPageStructure {
  return (
    !('Data' in projectPage) &&
    Object.keys(projectPage).some((structureKey) => ['template', 'result'].includes(structureKey))
  );
}
