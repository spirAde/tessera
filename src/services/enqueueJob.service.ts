import PgBoss from 'pg-boss';

import { createBuildJob } from '../jobs/createBuild.job';
import { updatePageJob } from '../jobs/updatePage.job';
import { pgConnectionString } from '../config';

export enum JobName {
  createBuild = 'createBuild',
  updatePage = 'updatePage',
}

const jobs = {
  [JobName.createBuild]: createBuildJob,
  [JobName.updatePage]: updatePageJob,
};

const pgQueue = new PgBoss(pgConnectionString);

export function getJobFunction(jobName: JobName) {
  return jobs[jobName];
}

export async function enqueue(jobName: JobName, args: any = {}) {
  const jobFunction = getJobFunction(jobName);

  if (!jobFunction) {
    throw new Error(`Unknown job name ${jobName}`);
  }

  return pgQueue.send(jobName, args);
}

export async function runQueue() {
  await pgQueue.start();

  await pgQueue.work(JobName.createBuild, createBuildJob);
  await pgQueue.work(JobName.updatePage, updatePageJob);
}
