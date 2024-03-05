import { RouteHandler } from 'fastify';

import { throwBadRequest } from '../../lib/error';
import { otlContext, SemanticAttributes, withSafelyActiveSpan } from '../../lib/opentelemetry';
import { Page } from '../../models';
import { enqueue, JobName } from '../../services/enqueueJob.service';
import { createPage } from '../../services/page/page.service';
import { PipelineType } from '../../services/pipeline/pipeline.service';
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
      const page = await Page.findOne({
        where: {
          externalId: request.body.id,
        },
      });

      if (page) {
        return throwBadRequest();
      }

      const createdPage = await createPage({
        url: request.body.url,
        externalId: request.body.id,
      });

      await enqueue(
        JobName.processPage,
        {
          type: PipelineType.create,
          pageId: createdPage.id,
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
      const page = await Page.findOne({
        where: {
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
          pageId: page.id,
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
      const page = await Page.findOne({
        where: {
          externalId: request.body.id,
        },
      });

      if (!page) {
        return throwBadRequest();
      }

      await page.destroy();

      await enqueue(
        JobName.processPage,
        {
          type: PipelineType.remove,
          pageId: page.id,
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
