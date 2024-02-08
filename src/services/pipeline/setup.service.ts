import { copy } from 'fs-extra';

import { logger } from '../../lib/logger';
import {
  applicationTemplateFolderPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../config';

export async function setupApplicationFolderEnvironment() {
  logger.debug('copy application environment folder');
  return copy(applicationTemplateFolderPath, temporaryApplicationBuildFolderRootPath);
}
