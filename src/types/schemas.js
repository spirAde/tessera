"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = void 0;
exports.schemas = {
    Build: {},
    CreateBuildResponse: {},
    CreatePageEndpoint: {},
    CreatePageRequest: {},
    Page: {},
    Stage: {},
    Status: {},
    TesseraHttp: {},
    UpdatePageEndpoint: {},
    UpdatePageRequest: {},
    UpdatePageRequestBody: {},
};
exports.schemas.Build = Object.assign(exports.schemas.Build, {
    type: "object",
    properties: {
        id: { type: "integer" },
        stage: exports.schemas.Stage,
        status: exports.schemas.Status,
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        deletedAt: {
            anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
        },
    },
    required: ["id", "stage", "status", "createdAt", "updatedAt"],
    additionalProperties: false,
});
exports.schemas.CreateBuildResponse = Object.assign(exports.schemas.CreateBuildResponse, {
    type: "object",
    properties: { build: exports.schemas.Build },
    required: ["build"],
    additionalProperties: false,
});
exports.schemas.CreatePageEndpoint = Object.assign(exports.schemas.CreatePageEndpoint, {
    type: "object",
    properties: {
        request: exports.schemas.CreatePageRequest,
        response: exports.schemas.CreateBuildResponse,
    },
    required: ["request", "response"],
    additionalProperties: false,
});
exports.schemas.CreatePageRequest = Object.assign(exports.schemas.CreatePageRequest, {
    type: "object",
    properties: {},
});
exports.schemas.Page = Object.assign(exports.schemas.Page, {
    type: "object",
    properties: {
        id: { type: "integer" },
        buildId: { type: "integer" },
        url: { type: "string" },
        stage: exports.schemas.Stage,
        status: exports.schemas.Status,
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        deletedAt: {
            anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
        },
    },
    required: [
        "id",
        "buildId",
        "url",
        "stage",
        "status",
        "createdAt",
        "updatedAt",
    ],
    additionalProperties: false,
});
exports.schemas.Stage = Object.assign(exports.schemas.Stage, {
    type: "string",
    enum: [
        "idle",
        "setup",
        "fetching",
        "generating",
        "preparing",
        "compilation",
        "export",
        "done",
    ],
});
exports.schemas.Status = Object.assign(exports.schemas.Status, {
    type: "string",
    enum: ["idle", "progress", "failed", "success"],
});
exports.schemas.TesseraHttp = Object.assign(exports.schemas.TesseraHttp, {
    type: "string",
    enum: ["update-page|put /pages", "create-page|post /builds"],
});
exports.schemas.UpdatePageEndpoint = Object.assign(exports.schemas.UpdatePageEndpoint, {
    type: "object",
    properties: { request: exports.schemas.UpdatePageRequest },
    required: ["request"],
    additionalProperties: false,
});
exports.schemas.UpdatePageRequest = Object.assign(exports.schemas.UpdatePageRequest, {
    type: "object",
    properties: { body: exports.schemas.UpdatePageRequestBody },
    required: ["body"],
});
exports.schemas.UpdatePageRequestBody = Object.assign(exports.schemas.UpdatePageRequestBody, {
    type: "object",
    properties: { url: { type: "string" } },
    required: ["url"],
    additionalProperties: false,
});
Object.keys(exports.schemas).forEach(function (name) {
    exports.schemas[name].$id = "sdk_" + name;
});
