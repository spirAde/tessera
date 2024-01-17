import { pathExists } from 'fs-extra';

import { persistentApplicationExportFolderRootPath } from '../../config';
import { enqueue, JobName, pgQueue, waitJobCompletion } from '../enqueueJob.service';

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
