import { RouteHandler } from 'fastify';

import { CreateBuildResponse, Stage, Status } from '../../types';
import { createBuild } from '../../services/build/build.service';
import { enqueue, JobName } from '../../services/enqueueJob.service';
import { withSafelyActiveSpan, otlContext, SemanticAttributes } from '../../lib/opentelemetry';

export const create: RouteHandler<{
  Reply: CreateBuildResponse;
}> = async function (_, response) {
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
      const build = await createBuild({
        status: Status.idle,
        stage: Stage.idle,
      });

      await enqueue(
        JobName.createBuild,
        {
          buildId: build.id,
          parentSpanContext: span?.spanContext(),
        },
        {
          singletonKey: 'build_key',
          useSingletonQueue: true,
        },
      );

      return response.code(200).send({
        build,
      });
    },
  );
};
