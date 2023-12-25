export interface Build {
    id: number;
    stage: Stage;
    status: Status;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}
export interface CreateBuildResponse {
    build: Build;
}
export interface CreatePageEndpoint {
    request: CreatePageRequest;
    response: CreateBuildResponse;
}
export interface CreatePageRequest {
}
export interface Page {
    id: number;
    buildId: number;
    url: string;
    stage: Stage;
    status: Status;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}
export declare enum Stage {
    idle = "idle",
    setup = "setup",
    fetching = "fetching",
    generating = "generating",
    preparing = "preparing",
    compilation = "compilation",
    export = "export",
    done = "done"
}
export declare enum Status {
    idle = "idle",
    progress = "progress",
    failed = "failed",
    success = "success"
}
export declare enum TesseraHttp {
    updatePagePutPages = "update-page|put /pages",
    createPagePostBuilds = "create-page|post /builds"
}
export interface UpdatePageEndpoint {
    request: UpdatePageRequest;
}
export interface UpdatePageRequest {
    body: UpdatePageRequestBody;
}
export interface UpdatePageRequestBody {
    url: string;
}
