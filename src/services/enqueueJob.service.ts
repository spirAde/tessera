/* istanbul ignore file */

import PgBoss, { JobWithMetadata, SendOptions, WorkHandler } from 'pg-boss';

import { pgConnectionString } from '../config';
import { createBuildJob } from '../jobs/build/createBuild.job';
import { processPageJob } from '../jobs/page/processPage.job';
import { logger } from '../lib/logger';

export enum JobName {
  createBuild = 'createBuild',
  processPage = 'processPage',
}

const jobs = {
  [JobName.createBuild]: createBuildJob,
  [JobName.processPage]: processPageJob,
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
  await runJob(JobName.processPage);
}

export async function runJob(jobName: JobName) {
  await pgQueue.work(jobName, { teamSize: 1, teamConcurrency: 1 }, getJobFunction(jobName));
}

export async function stopJob(jobName: JobName) {
  await pgQueue.offWork(jobName);
}

export async function flushPendingTasks(jobName: JobName) {
  await pgQueue.deleteQueue(jobName);
}

export async function stopPageJobs() {
  logger.debug('[stopPageJobs] stop page jobs');
  await stopJob(JobName.processPage);
  await flushPendingTasks(JobName.processPage);
}

export async function runPageJobs() {
  logger.debug('[runPageJobs] run page jobs');
  await runJob(JobName.processPage);
}

export function getJobFunction(jobName: JobName) {
  return jobs[jobName] as WorkHandler<object>;
}

export async function waitJobCompletion(jobName: JobName) {
  logger.debug('[waitJobCompletion] waiting the project building...');

  return new Promise((resolve) =>
    pgQueue.onComplete(jobName, (job: JobWithMetadata) => {
      void (isJobCompletedSuccessfully(job) && pgQueue.offComplete(jobName).then(resolve));
    }),
  );
}

function isJobCompletedSuccessfully(job: JobWithMetadata) {
  return 'state' in job.data && job.data.state === 'completed';
}
