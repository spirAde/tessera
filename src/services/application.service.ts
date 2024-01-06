import { isFileSystemObjectExist } from '../lib/fs';
import { temporaryApplicationExportFolderRootPath } from '../config';
import { enqueue, JobName } from './enqueueJob.service';

export async function ensureBuildExistOrEnqueueJob() {
  if (isFileSystemObjectExist(temporaryApplicationExportFolderRootPath)) {
    return;
  }

  await enqueue(JobName.createBuild);
}
