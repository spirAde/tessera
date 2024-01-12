import PgBoss, { SendOptions, WorkHandler } from 'pg-boss';
import { pathExists } from 'fs-extra';

import { createBuildJob } from '../jobs/build/createBuild.job';
import { createPageJob } from '../jobs/page/creation/createPage.job';
import { updatePageJob } from '../jobs/page/updating/updatePage.job';
import { deletePageJob } from '../jobs/page/deleting/deletePage.job';
import { persistentApplicationExportFolderRootPath, pgConnectionString } from '../config';

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

export async function stopPageJobs() {
  await stopJob(JobName.createPage);
  await stopJob(JobName.updatePage);
  await stopJob(JobName.deletePage);

  await flushPendingTasks(JobName.createPage);
  await flushPendingTasks(JobName.updatePage);
  await flushPendingTasks(JobName.deletePage);
}

export async function runPageJobs() {
  await runJob(JobName.createPage);
  await runJob(JobName.updatePage);
  await runJob(JobName.deletePage);
}

async function shouldRunPageJobs() {
  return (
    (await pathExists(persistentApplicationExportFolderRootPath)) &&
    (await pgQueue.getQueueSize(JobName.createBuild)) === 0
  );
}
