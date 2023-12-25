"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TesseraHttp = exports.Status = exports.Stage = void 0;
var Stage;
(function (Stage) {
    Stage["idle"] = "idle";
    Stage["setup"] = "setup";
    Stage["fetching"] = "fetching";
    Stage["generating"] = "generating";
    Stage["preparing"] = "preparing";
    Stage["compilation"] = "compilation";
    Stage["export"] = "export";
    Stage["done"] = "done";
})(Stage = exports.Stage || (exports.Stage = {}));
var Status;
(function (Status) {
    Status["idle"] = "idle";
    Status["progress"] = "progress";
    Status["failed"] = "failed";
    Status["success"] = "success";
})(Status = exports.Status || (exports.Status = {}));
var TesseraHttp;
(function (TesseraHttp) {
    TesseraHttp["updatePagePutPages"] = "update-page|put /pages";
    TesseraHttp["createPagePostBuilds"] = "create-page|post /builds";
})(TesseraHttp = exports.TesseraHttp || (exports.TesseraHttp = {}));
