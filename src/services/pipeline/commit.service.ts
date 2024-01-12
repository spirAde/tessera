import { copy } from 'fs-extra';

import {
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
  persistentApplicationBuildFolderRootPath,
  persistentApplicationExportFolderRootPath,
} from '../../config';

// TODO: copy only files which have different file.[contenthash].js in the client/server emitted assets
export async function commit() {
  return Promise.all([
    copy(temporaryApplicationBuildFolderRootPath, persistentApplicationBuildFolderRootPath),
    copy(temporaryApplicationExportFolderRootPath, persistentApplicationExportFolderRootPath),
  ]);
}
