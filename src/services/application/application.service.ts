import fs, { pathExists } from 'fs-extra';
import path from 'path';

import { persistentApplicationExportFolderRootPath, rootFolderPath } from '../../config';
import { logger } from '../../lib/logger';
import { enqueue, JobName, pgQueue, waitJobCompletion } from '../enqueueJob.service';

export function getHttpsServerOptions() {
  return {
    key: fs.readFileSync(path.join(rootFolderPath, 'etc/certs/private-key.pem')),
    cert: fs.readFileSync(path.join(rootFolderPath, 'etc/certs/certificate.pem')),
  };
}

export async function ensureApplicationIsReadyToLaunch() {
  const projectBuildCreationQueueSize = await pgQueue.getQueueSize(JobName.createBuild);

  const existsPersistentFolder = await pathExists(persistentApplicationExportFolderRootPath);
  const isProjectBuildCreationQueueEmpty = projectBuildCreationQueueSize === 0;

  if (existsPersistentFolder && isProjectBuildCreationQueueEmpty) {
    logger.debug('[ensureApplicationIsReadyToLaunch] application is ready to launch');
    return Promise.resolve();
  }

  if (!existsPersistentFolder && isProjectBuildCreationQueueEmpty) {
    logger.debug('[ensureApplicationIsReadyToLaunch] application requires the project build');
    await enqueue(JobName.createBuild);
  }

  await waitJobCompletion(JobName.createBuild);
  logger.debug('[ensureApplicationIsReadyToLaunch] application is ready to launch');
}
