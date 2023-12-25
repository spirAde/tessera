import { RouteHandler } from 'fastify';

import { CreateBuildResponse, Stage, Status } from '../../types';
import { createBuild } from '../../services/build/build.service';
import { enqueue, JobName } from '../../services/enqueueJob.service';

export const create: RouteHandler<{
  Reply: CreateBuildResponse;
}> = async function (_, response) {
  const build = await createBuild({
    status: Status.idle,
    stage: Stage.idle,
  });

  await enqueue(JobName.createBuild, { buildId: build.id });

  return response.code(200).send({
    build,
  });
};
