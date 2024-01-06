import PgBoss, { SendOptions, WorkHandler } from 'pg-boss';

import { createBuildJob } from '../jobs/build/createBuild.job';
import { createPageJob } from '../jobs/page/createPage.job';
import { updatePageJob } from '../jobs/page/updatePage.job';
import { deletePageJob } from '../jobs/page/deletePage.job';
import { pgConnectionString, temporaryApplicationExportFolderRootPath } from '../config';
import { isFileSystemObjectExist } from '../lib/fs';

export enum JobName {
  createBuild = 'createBuild',
  createPage = 'createPage',
  updatePage = 'updatePage',
  deletePage = 'deletePage',
}

const jobs = {
  [JobName.createBuild]: createBuildJob,
  [JobName.createPage]: createPageJob,
  [JobName.updatePage]: updatePageJob,
  [JobName.deletePage]: deletePageJob,
};

export const pgQueue = new PgBoss(pgConnectionString);

export function getJobFunction(jobName: JobName) {
  return jobs[jobName] as WorkHandler<object>;
}

export async function enqueue(jobName: JobName, args: any = {}, options: SendOptions = {}) {
  const jobFunction = getJobFunction(jobName);

  if (!jobFunction) {
    throw new Error(`Unknown job name ${jobName}`);
  }

  return pgQueue.send(jobName, args, options);
}

export async function initializeJobs() {
  await runJob(JobName.createBuild);

  if (await shouldRunPageJobs()) {
    await runJob(JobName.createPage);
    await runJob(JobName.updatePage);
    await runJob(JobName.deletePage);
  }
}

export async function runJob(jobName: JobName) {
  await pgQueue.work(jobName, getJobFunction(jobName));
}

export async function stopJob(jobName: JobName) {
  await pgQueue.offWork(jobName);
}

export async function flushPendingTasks(jobName: JobName) {
  await pgQueue.deleteQueue(jobName);
}

async function shouldRunPageJobs() {
  return (
    isFileSystemObjectExist(temporaryApplicationExportFolderRootPath) &&
    (await pgQueue.getQueueSize(JobName.createBuild)) === 0
  );
}
