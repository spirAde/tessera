import { RouteHandler } from 'fastify';

import { enqueue, JobName } from '../../services/enqueueJob.service';
import { withSafelyActiveSpan, otlContext, SemanticAttributes } from '../../lib/opentelemetry';

export const create: RouteHandler<{}> = async function (_, response) {
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
          parentSpanContext: span?.spanContext(),
        },
        {
          singletonKey: 'build_key',
          useSingletonQueue: true,
        },
      );

      return response.code(201).send();
    },
  );
};
