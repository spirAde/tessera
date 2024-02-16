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

export interface RawProjectPageStructure {
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
