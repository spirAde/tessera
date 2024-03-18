export type ProjectPageStructureSeoProps = {
  title: string;
  description: string;
  keywords: string;
  tabName: string;
  uiOrder: number;
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

export type Project = {
  id: number;
  title: string;
  sysName: string;
  description: string;
  updateLogin: string;
  updateMoment: string;
  settings: ProjectSettings;
};

export type DesignSystemComponent = {
  title: string;
  sysName: string;
  version: string;
  active: boolean;
};

export type ProjectPage = {
  id: number;
  url: string;
};

export type ProjectPageStructure = {
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

type ProjectPageStructureMeta = {
  id: number;
  title: string;
  objectTypeSysName: string;
  version: string;
  result: ProjectPageStructureMetaProps;
  uiOrder: number;
};

type ProjectPageStructureComponentProps = {
  id: string;
  theme: string;
  uiOrder: number;
  components?: ProjectPageStructureComponent[];
  [key: string]: unknown;
};

type ProjectStandParametersBucket = {
  sysName: string;
  name: string;
  value: number | string | boolean;
};

type ProjectSettings = {
  draftBaseUrl: string;
  webBaseUrl: string;
  standSettings: {
    parameters: ProjectStandParametersBucket[];
  };
  designSystemId: number;
  domain: string | null;
};
