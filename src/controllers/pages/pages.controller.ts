import { RouteHandler } from 'fastify';

import { UpdatePageRequestBody } from '../../types';
import { enqueue, JobName } from '../../services/enqueueJob.service';
import { findActiveBuild } from '../../services/build/build.service';
import { Page } from '../../models';
import { throwBadRequest } from '../../lib/error';

export const update: RouteHandler<{ Body: UpdatePageRequestBody }> = async function (
  request,
  response,
) {
  const build = await findActiveBuild();

  console.log('here', build);

  if (!build) {
    return throwBadRequest();
  }

  const page = await Page.findOne({
    where: {
      buildId: build.id,
      url: request.body.url,
    },
  });

  if (!page) {
    return throwBadRequest();
  }

  await enqueue(JobName.updatePage, { pageId: page.id });

  return response.status(204).send();
};
