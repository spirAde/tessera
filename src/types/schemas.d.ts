import { JSONSchema6 } from 'json-schema';
import * as types from './types';
export interface SdkSchema<T> extends JSONSchema6 {
  _type?: T;
}
export declare const schemas: {
  Build: SdkSchema<types.Build>;
  CreateBuildEndpoint: SdkSchema<types.CreateBuildEndpoint>;
  CreateBuildRequest: SdkSchema<types.CreateBuildRequest>;
  CreatePageEndpoint: SdkSchema<types.CreatePageEndpoint>;
  CreatePageRequest: SdkSchema<types.CreatePageRequest>;
  CreatePageRequestBody: SdkSchema<types.CreatePageRequestBody>;
  DeletePageEndpoint: SdkSchema<types.DeletePageEndpoint>;
  DeletePageRequest: SdkSchema<types.DeletePageRequest>;
  DeletePageRequestBody: SdkSchema<types.DeletePageRequestBody>;
  Page: SdkSchema<types.Page>;
  Stage: SdkSchema<types.Stage>;
  Status: SdkSchema<types.Status>;
  TesseraHttp: SdkSchema<types.TesseraHttp>;
  UpdatePageEndpoint: SdkSchema<types.UpdatePageEndpoint>;
  UpdatePageRequest: SdkSchema<types.UpdatePageRequest>;
  UpdatePageRequestBody: SdkSchema<types.UpdatePageRequestBody>;
};
