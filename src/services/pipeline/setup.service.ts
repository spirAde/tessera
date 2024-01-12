import { promises as fs } from 'fs';

import { logger } from '../../lib/logger';
import {
  applicationTemplateFolderPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../config';

export async function setupApplicationFolderEnvironment() {
  logger.debug('copy application environment folder');
  return fs.cp(applicationTemplateFolderPath, temporaryApplicationBuildFolderRootPath, {
    recursive: true,
  });
}
