import { JSONSchema6 } from "json-schema";
import * as types from "./types";
export interface SdkSchema<T> extends JSONSchema6 {
    _type?: T;
}
export declare const schemas: {
    Build: SdkSchema<types.Build>;
    CreateBuildResponse: SdkSchema<types.CreateBuildResponse>;
    CreatePageEndpoint: SdkSchema<types.CreatePageEndpoint>;
    CreatePageRequest: SdkSchema<types.CreatePageRequest>;
    Page: SdkSchema<types.Page>;
    Stage: SdkSchema<types.Stage>;
    Status: SdkSchema<types.Status>;
    TesseraHttp: SdkSchema<types.TesseraHttp>;
    UpdatePageEndpoint: SdkSchema<types.UpdatePageEndpoint>;
    UpdatePageRequest: SdkSchema<types.UpdatePageRequest>;
    UpdatePageRequestBody: SdkSchema<types.UpdatePageRequestBody>;
};
