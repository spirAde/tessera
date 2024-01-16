'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.schemas = void 0;
exports.schemas = {
  Build: {},
  CreateBuildEndpoint: {},
  CreateBuildRequest: {},
  CreatePageEndpoint: {},
  CreatePageRequest: {},
  CreatePageRequestBody: {},
  DeletePageEndpoint: {},
  DeletePageRequest: {},
  DeletePageRequestBody: {},
  Page: {},
  Stage: {},
  Status: {},
  TesseraHttp: {},
  UpdatePageEndpoint: {},
  UpdatePageRequest: {},
  UpdatePageRequestBody: {},
};
exports.schemas.Build = Object.assign(exports.schemas.Build, {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    stage: exports.schemas.Stage,
    status: exports.schemas.Status,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: {
      anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    },
  },
  required: ['id', 'stage', 'status', 'createdAt', 'updatedAt'],
  additionalProperties: false,
});
exports.schemas.CreateBuildEndpoint = Object.assign(exports.schemas.CreateBuildEndpoint, {
  type: 'object',
  properties: { request: exports.schemas.CreateBuildRequest },
  required: ['request'],
  additionalProperties: false,
});
exports.schemas.CreateBuildRequest = Object.assign(exports.schemas.CreateBuildRequest, {
  type: 'object',
  properties: {},
});
exports.schemas.CreatePageEndpoint = Object.assign(exports.schemas.CreatePageEndpoint, {
  type: 'object',
  properties: { request: exports.schemas.CreatePageRequest },
  required: ['request'],
  additionalProperties: false,
});
exports.schemas.CreatePageRequest = Object.assign(exports.schemas.CreatePageRequest, {
  type: 'object',
  properties: { body: exports.schemas.CreatePageRequestBody },
  required: ['body'],
});
exports.schemas.CreatePageRequestBody = Object.assign(exports.schemas.CreatePageRequestBody, {
  type: 'object',
  properties: { id: { type: 'integer' }, url: { type: 'string' } },
  required: ['id', 'url'],
  additionalProperties: false,
});
exports.schemas.DeletePageEndpoint = Object.assign(exports.schemas.DeletePageEndpoint, {
  type: 'object',
  properties: { request: exports.schemas.DeletePageRequest },
  required: ['request'],
  additionalProperties: false,
});
exports.schemas.DeletePageRequest = Object.assign(exports.schemas.DeletePageRequest, {
  type: 'object',
  properties: { body: exports.schemas.DeletePageRequestBody },
  required: ['body'],
});
exports.schemas.DeletePageRequestBody = Object.assign(exports.schemas.DeletePageRequestBody, {
  type: 'object',
  properties: { id: { type: 'integer' } },
  required: ['id'],
  additionalProperties: false,
});
exports.schemas.Page = Object.assign(exports.schemas.Page, {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    buildId: { type: 'integer' },
    url: { type: 'string' },
    stage: exports.schemas.Stage,
    status: exports.schemas.Status,
    externalId: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: {
      anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    },
  },
  required: ['id', 'buildId', 'url', 'stage', 'status', 'externalId', 'createdAt', 'updatedAt'],
  additionalProperties: false,
});
exports.schemas.Stage = Object.assign(exports.schemas.Stage, {
  type: 'string',
  enum: [
    'setup',
    'fetching',
    'generating',
    'preparing',
    'compilation',
    'export',
    'cleanup',
    'commit',
  ],
});
exports.schemas.Status = Object.assign(exports.schemas.Status, {
  type: 'string',
  enum: ['progress', 'failed', 'success'],
});
exports.schemas.TesseraHttp = Object.assign(exports.schemas.TesseraHttp, {
  type: 'string',
  enum: [
    'create-page|post /pages',
    'update-page|put /pages',
    'delete-page|delete /pages',
    'create-build|post /builds',
  ],
});
exports.schemas.UpdatePageEndpoint = Object.assign(exports.schemas.UpdatePageEndpoint, {
  type: 'object',
  properties: { request: exports.schemas.UpdatePageRequest },
  required: ['request'],
  additionalProperties: false,
});
exports.schemas.UpdatePageRequest = Object.assign(exports.schemas.UpdatePageRequest, {
  type: 'object',
  properties: { body: exports.schemas.UpdatePageRequestBody },
  required: ['body'],
});
exports.schemas.UpdatePageRequestBody = Object.assign(exports.schemas.UpdatePageRequestBody, {
  type: 'object',
  properties: { id: { type: 'integer' } },
  required: ['id'],
  additionalProperties: false,
});
Object.keys(exports.schemas).forEach(function (name) {
  exports.schemas[name].$id = 'sdk_' + name;
});
