export interface Build {
    id: number;
    stage: Stage;
    status: Status;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}
export interface CreateBuildEndpoint {
    request: CreateBuildRequest;
}
export interface CreateBuildRequest {
}
export interface CreatePageEndpoint {
    request: CreatePageRequest;
}
export interface CreatePageRequest {
    body: CreatePageRequestBody;
}
export interface CreatePageRequestBody {
    id: number;
    url: string;
}
export interface DeletePageEndpoint {
    request: DeletePageRequest;
}
export interface DeletePageRequest {
    body: DeletePageRequestBody;
}
export interface DeletePageRequestBody {
    id: number;
}
export interface Page {
    id: number;
    buildId: number;
    url: string;
    stage: Stage;
    status: Status;
    externalId: number;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}
export declare enum Stage {
    setup = "setup",
    fetching = "fetching",
    generating = "generating",
    preparing = "preparing",
    compilation = "compilation",
    export = "export",
    verification = "verification",
    teardown = "teardown"
}
export declare enum Status {
    progress = "progress",
    failed = "failed",
    success = "success"
}
export declare enum TesseraHttp {
    createPagePostPages = "create-page|post /pages",
    updatePagePutPages = "update-page|put /pages",
    deletePageDeletePages = "delete-page|delete /pages",
    createBuildPostBuilds = "create-build|post /builds"
}
export interface UpdatePageEndpoint {
    request: UpdatePageRequest;
}
export interface UpdatePageRequest {
    body: UpdatePageRequestBody;
}
export interface UpdatePageRequestBody {
    id: number;
}
