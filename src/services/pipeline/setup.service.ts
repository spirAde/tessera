import { copy } from 'fs-extra';

import {
  applicationTemplateFolderPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../config';
import { logger } from '../../lib/logger';

export function setupApplicationFolderEnvironment(): Promise<void> {
  logger.debug('copy application environment folder');
  return copy(applicationTemplateFolderPath, temporaryApplicationBuildFolderRootPath);
}
