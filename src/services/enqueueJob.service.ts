/* istanbul ignore file */

import PgBoss, { JobWithMetadata, SendOptions, WorkHandler } from 'pg-boss';

import { pgConnectionString } from '../config';
import { createBuildJob } from '../jobs/build/createBuild.job';
import { createPageJob } from '../jobs/page/creation/createPage.job';
import { updatePageJob } from '../jobs/page/updating/updatePage.job';
import { deletePageJob } from '../jobs/page/deleting/deletePage.job';

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

export const pgQueue = new PgBoss({
  connectionString: pgConnectionString,
  onComplete: true,
});

export function enqueue(jobName: JobName, args: any = {}, options: SendOptions = {}) {
  const jobFunction = getJobFunction(jobName);

  if (!jobFunction) {
    throw new Error(`Unknown job name ${jobName}`);
  }

  return pgQueue.send(jobName, args, options);
}

export async function initializeJobs() {
  await runJob(JobName.createBuild);
  await runJob(JobName.createPage);
  await runJob(JobName.updatePage);
  await runJob(JobName.deletePage);
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

export function getJobFunction(jobName: JobName) {
  return jobs[jobName] as WorkHandler<object>;
}

export async function waitJobCompletion(jobName: JobName) {
  return new Promise((resolve) =>
    pgQueue.onComplete(jobName, (job: JobWithMetadata) => {
      void (isJobCompletedSuccessfully(job) && pgQueue.offComplete(jobName).then(resolve));
    }),
  );
}

function isJobCompletedSuccessfully(job: JobWithMetadata) {
  return 'state' in job.data && job.data.state === 'completed';
}
