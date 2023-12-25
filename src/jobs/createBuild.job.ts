import { Job } from 'pg-boss';

import { Build } from '../models';
import { runBuild, updateBuild } from '../services/build/build.service';
import { Stage, Status } from '../types';

export async function createBuildJob(payload: Job<{ buildId: number }>) {
  console.log(`[createBuildJob] start job for build id: ${payload.data.buildId}`);

  const build = await Build.findByPk(payload.data.buildId, {
    rejectOnEmpty: true,
  });

  const readyToRunProjectBuild = await updateBuild(build, {
    status: Status.progress,
    stage: Stage.setup,
  });

  return runBuild(readyToRunProjectBuild);
}
