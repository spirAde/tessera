'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TesseraHttp = exports.Status = exports.Stage = void 0;
var Stage;
(function (Stage) {
  Stage['setup'] = 'setup';
  Stage['fetching'] = 'fetching';
  Stage['generating'] = 'generating';
  Stage['preparing'] = 'preparing';
  Stage['compilation'] = 'compilation';
  Stage['export'] = 'export';
  Stage['commit'] = 'commit';
  Stage['teardown'] = 'teardown';
})((Stage = exports.Stage || (exports.Stage = {})));
var Status;
(function (Status) {
  Status['progress'] = 'progress';
  Status['failed'] = 'failed';
  Status['success'] = 'success';
})((Status = exports.Status || (exports.Status = {})));
var TesseraHttp;
(function (TesseraHttp) {
  TesseraHttp['createPagePostPages'] = 'create-page|post /pages';
  TesseraHttp['updatePagePutPages'] = 'update-page|put /pages';
  TesseraHttp['deletePageDeletePages'] = 'delete-page|delete /pages';
  TesseraHttp['createBuildPostBuilds'] = 'create-build|post /builds';
})((TesseraHttp = exports.TesseraHttp || (exports.TesseraHttp = {})));
