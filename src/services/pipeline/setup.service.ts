import { copy, remove } from 'fs-extra';
import path from 'path';

import { logger } from '../../lib/logger';
import {
  applicationTemplateFolderPath,
  rootFolderPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../config';

export async function setupApplicationFolderEnvironment() {
  logger.debug('copy application environment folder');
  return copy(applicationTemplateFolderPath, temporaryApplicationBuildFolderRootPath);
}

export function cleanBabelCache() {
  return remove(path.join(rootFolderPath, 'node_modules/.cache/babel-loader'));
}
