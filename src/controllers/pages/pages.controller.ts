import { RouteHandler } from 'fastify';

import { throwBadRequest } from '../../lib/error';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../lib/opentelemetry';
import { Page } from '../../models';
import { getCurrentBuild } from '../../services/build/build.service';
import { enqueue, JobName } from '../../services/enqueueJob.service';
import { PipelineType } from '../../services/page/page.service';
import { CreatePageRequestBody, DeletePageRequestBody, UpdatePageRequestBody } from '../../types';

export const create: RouteHandler<{ Body: CreatePageRequestBody }> = async function (
  request,
  response,
) {
  await withSafelyActiveSpan(
    {
      name: 'create-page handler',
      context: otlContext.active(),
      options: {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: 'handler',
        },
      },
    },
    async (span) => {
      const build = await getCurrentBuild();

      if (!build) {
        return throwBadRequest();
      }

      const page = await Page.findOne({
        where: {
          externalId: request.body.id,
          buildId: build.id,
        },
      });

      if (page) {
        return throwBadRequest();
      }

      await enqueue(
        JobName.processPage,
        {
          type: PipelineType.create,
          externalId: request.body.id,
          url: request.body.url,
          parentSpanContext: span?.spanContext() ?? null,
        },
        {
          useSingletonQueue: true,
        },
      );

      return response.status(204).send();
    },
  );
};

export const update: RouteHandler<{ Body: UpdatePageRequestBody }> = async function (
  request,
  response,
) {
  await withSafelyActiveSpan(
    {
      name: 'update-page handler',
      context: otlContext.active(),
      options: {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: 'handler',
        },
      },
    },
    async (span) => {
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

      await enqueue(
        JobName.processPage,
        {
          type: PipelineType.update,
          externalId: request.body.id,
          parentSpanContext: span?.spanContext() ?? null,
        },
        {
          useSingletonQueue: true,
        },
      );

      return response.status(201).send();
    },
  );
};

export const remove: RouteHandler<{ Body: DeletePageRequestBody }> = async function (
  request,
  response,
) {
  await withSafelyActiveSpan(
    {
      name: 'delete-page handler',
      context: otlContext.active(),
      options: {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: 'handler',
        },
      },
    },
    async (span) => {
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

      await enqueue(
        JobName.processPage,
        {
          type: PipelineType.remove,
          externalId: request.body.id,
          parentSpanContext: span?.spanContext() ?? null,
        },
        {
          useSingletonQueue: true,
        },
      );

      return response.status(200).send();
    },
  );
};
