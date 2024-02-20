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

export type RawProjectPageStructure = {
  Data: string;
  [key: string]: unknown;
};

export type ProjectPageStructureSeoProps = {
  title: string;
  description: string;
  keywords: string;
  tabName: string;
  uiOrder: number;
};

type ProjectPageStructureSeo = {
  id: number;
  title: string;
  objectTypeSysName: string;
  version: string;
  componentName: string;
  result: ProjectPageStructureSeoProps;
  uiOrder: number;
  editable: boolean;
};

type ProjectPageStructureProps = {
  uiOrder: number;
  footerId: string;
  [key: string]: string | number | boolean;
};

type ProjectPageStructureBreadcrumb = {
  title: string;
  url: string;
};

export type ProjectPageStructureMetaProps = {
  title: string;
  items: ProjectPageStructureMetaItemProps[];
  uiOrder: number;
};

export type ProjectPageStructureMetaItemProps = {
  name: string;
  property: string;
  content: string;
};

type ProjectPageStructureMeta = {
  id: number;
  title: string;
  objectTypeSysName: string;
  version: string;
  result: ProjectPageStructureMetaProps;
  uiOrder: number;
};

export type StrictProjectPageStructure = {
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
};

type ProjectPageStructureComponentProps = {
  id: string;
  theme: string;
  uiOrder: number;
  components?: ProjectPageStructureComponent[];
  [key: string]: unknown;
};

export type ComponentLike = {
  name: string;
  version: string;
};

export type ProjectPageStructureComponent = {
  id: number;
  uuid: string;
  title: string;
  objectTypeSysName: string;
  version: string;
  componentName: string;
  uiOrder: string;
  result: ProjectPageStructureComponentProps;
  components: ProjectPageStructureComponent[];
};

type ProjectSpaParametersBucket = {
  sysName: ProjectInfoSysName;
  name: ProjectInfoSysName;
  value: number | string | boolean;
};

type ProjectSettings = {
  baseUrl: string;
  spaParameters: ProjectSpaParametersBucket[];
  designSystemId: number;
};

export type Project = {
  id: number;
  title: string;
  sysName: string;
  description: string;
  settings: ProjectSettings;
};

export type DesignSystemComponent = {
  id: number;
  title: string;
  sysName: string;
  componentName: string;
  currentVersion: string;
  active: boolean;
  designSystemId: string;
  componentType: string;
};

export type ProjectPage = {
  id: number;
  url: string;
};
