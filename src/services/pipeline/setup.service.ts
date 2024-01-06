import { promises as fs } from 'fs';
import path from 'path';

import { logger } from '../../lib/logger';
import { applicationTemplateFolderPath } from '../../config';
import { Build } from '../../models';

export async function setupApplicationFolderEnvironment(projectBuildFolderPath: string) {
  logger.debug('copy application environment folder');
  await copyApplicationTemplateFolder(projectBuildFolderPath);
}

function copyApplicationTemplateFolder(projectBuildFolderPath: string) {
  return fs.cp(applicationTemplateFolderPath, projectBuildFolderPath, {
    recursive: true,
  });
}

export async function createBuildIdFile(projectBuild: Build, projectBuildFolderPath: string) {
  await fs.writeFile(path.join(projectBuildFolderPath, 'BUILD_ID'), String(projectBuild.id));
}
