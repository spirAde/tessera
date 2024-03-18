import { RouteHandler } from 'fastify';

import { withSafelyActiveSpan, otlContext, SemanticAttributes } from '../../lib/opentelemetry';
import { enqueue, JobName } from '../../services/enqueueJob.service';

export const create: RouteHandler = async function (_, response) {
  await withSafelyActiveSpan(
    {
      name: 'create-build handler',
      context: otlContext.active(),
      options: {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: 'handler',
        },
      },
    },
    async (span) => {
      await enqueue(
        JobName.createBuild,
        {
          parentSpanContext: span?.spanContext() ?? null,
        },
        {
          useSingletonQueue: true,
        },
      );

      return response.code(201).send();
    },
  );
};
