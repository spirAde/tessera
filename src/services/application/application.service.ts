import path from 'path';
import fs, { pathExists } from 'fs-extra';

import { persistentApplicationExportFolderRootPath, rootFolderPath } from '../../config';
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
    return Promise.resolve();
  }

  if (!existsPersistentFolder && isProjectBuildCreationQueueEmpty) {
    await enqueue(JobName.createBuild);
  }

  await waitJobCompletion(JobName.createBuild);
}
