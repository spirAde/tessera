import fs, { pathExists } from 'fs-extra';
import { ServerOptions } from 'https';
import path from 'path';

import { persistentApplicationExportFolderRootPath, rootFolderPath } from '../../config';
import { logger } from '../../lib/logger';
import { enqueue, JobName, pgQueue, waitJobCompletion } from '../enqueueJob.service';

/* istanbul ignore next */
export function getHttpsServerOptions(): ServerOptions {
  return {
    key: fs.readFileSync(path.join(rootFolderPath, 'etc/certs/private-key.pem')),
    cert: fs.readFileSync(path.join(rootFolderPath, 'etc/certs/certificate.pem')),
  };
}

export async function ensureApplicationIsReadyToLaunch(
  forceRebuild: boolean = false,
): Promise<void> {
  const projectBuildCreationQueueSize = await pgQueue.getQueueSize(JobName.createBuild);
  const isProjectBuildCreationQueueEmpty = projectBuildCreationQueueSize === 0;

  const existsPersistentFolder = await pathExists(persistentApplicationExportFolderRootPath);

  const isApplicationReadyToLaunch = shouldLaunchApplication({
    forceRebuild,
    existsPersistentFolder,
    isProjectBuildCreationQueueEmpty,
  });

  const isApplicationNeededBuild = shouldRunApplicationBuild({
    forceRebuild,
    existsPersistentFolder,
    isProjectBuildCreationQueueEmpty,
  });

  if (isApplicationReadyToLaunch) {
    logger.debug('[ensureApplicationIsReadyToLaunch] application is ready to launch');
    return Promise.resolve();
  }

  if (isApplicationNeededBuild) {
    logger.debug('[ensureApplicationIsReadyToLaunch] application requires the project build');
    await enqueue(JobName.createBuild);
  }

  await waitJobCompletion(JobName.createBuild);

  logger.debug('[ensureApplicationIsReadyToLaunch] application is ready to launch');
}

function shouldLaunchApplication({
  forceRebuild,
  isProjectBuildCreationQueueEmpty,
  existsPersistentFolder,
}: {
  forceRebuild: boolean;
  isProjectBuildCreationQueueEmpty: boolean;
  existsPersistentFolder: boolean;
}) {
  return !forceRebuild && existsPersistentFolder && isProjectBuildCreationQueueEmpty;
}

function shouldRunApplicationBuild({
  forceRebuild,
  isProjectBuildCreationQueueEmpty,
  existsPersistentFolder,
}: {
  forceRebuild: boolean;
  isProjectBuildCreationQueueEmpty: boolean;
  existsPersistentFolder: boolean;
}) {
  return forceRebuild || (!existsPersistentFolder && isProjectBuildCreationQueueEmpty);
}
