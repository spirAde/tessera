export type Build = {
  id: number;
  stage: Stage;
  status: Status;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
export type CreateBuildEndpoint = {
  request: CreateBuildRequest;
};
export type CreateBuildRequest = {};
export type CreatePageEndpoint = {
  request: CreatePageRequest;
};
export type CreatePageRequest = {
  body: CreatePageRequestBody;
};
export type CreatePageRequestBody = {
  id: number;
  url: string;
};
export type DeletePageEndpoint = {
  request: DeletePageRequest;
};
export type DeletePageRequest = {
  body: DeletePageRequestBody;
};
export type DeletePageRequestBody = {
  id: number;
};
export type Page = {
  id: number;
  buildId: number;
  url: string;
  stage: Stage;
  status: Status;
  externalId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
export declare enum Stage {
  setup = 'setup',
  fetching = 'fetching',
  generating = 'generating',
  preparing = 'preparing',
  compilation = 'compilation',
  export = 'export',
  cleanup = 'cleanup',
  commit = 'commit',
}
export declare enum Status {
  progress = 'progress',
  failed = 'failed',
  success = 'success',
}
export declare enum TesseraHttp {
  createPagePostPages = 'create-page|post /pages',
  updatePagePutPages = 'update-page|put /pages',
  deletePageDeletePages = 'delete-page|delete /pages',
  createBuildPostBuilds = 'create-build|post /builds',
}
export type UpdatePageEndpoint = {
  request: UpdatePageRequest;
};
export type UpdatePageRequest = {
  body: UpdatePageRequestBody;
};
export type UpdatePageRequestBody = {
  id: number;
};
