import { pathExists } from 'fs-extra';

import { temporaryApplicationExportFolderRootPath } from '../config';
import { enqueue, JobName } from './enqueueJob.service';

export async function ensureBuildExistOrEnqueueJob() {
  if (await pathExists(temporaryApplicationExportFolderRootPath)) {
    return;
  }

  await enqueue(JobName.createBuild);
}
