import { RouteHandler } from 'fastify';

import {
  CreatePageRequestBody,
  DeletePageRequestBody,
  Stage,
  Status,
  UpdatePageRequestBody,
} from '../../types';
import { enqueue, JobName } from '../../services/enqueueJob.service';
import { getCurrentBuild } from '../../services/build/build.service';
import { Page } from '../../models';
import { throwBadRequest } from '../../lib/error';
import { createPage } from '../../services/page/page.service';

export const create: RouteHandler<{ Body: CreatePageRequestBody }> = async function (
  request,
  response,
) {
  const build = await getCurrentBuild();

  if (!build) {
    return throwBadRequest();
  }

  await enqueue(JobName.createPage, {
    externalId: request.body.id,
    url: request.body.url,
  });

  return response.status(204).send();
};

export const update: RouteHandler<{ Body: UpdatePageRequestBody }> = async function (
  request,
  response,
) {
  const build = await getCurrentBuild();

  if (!build) {
    return throwBadRequest();
  }

  const page = await Page.findOne({
    where: {
      buildId: build.id,
      externalId: request.body.id,
    },
  });

  if (!page) {
    return throwBadRequest();
  }

  await enqueue(JobName.updatePage, { pageId: page.id });

  return response.status(201).send();
};

export const remove: RouteHandler<{ Body: DeletePageRequestBody }> = async function (
  request,
  response,
) {
  const build = await getCurrentBuild();

  if (!build) {
    return throwBadRequest();
  }

  const page = await Page.findOne({
    where: {
      buildId: build.id,
      externalId: request.body.id,
    },
  });

  if (!page) {
    return throwBadRequest();
  }

  await enqueue(JobName.deletePage, { pageId: page.id });

  return response.status(200).send();
};
