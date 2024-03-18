import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { create } from '../../controllers/build/build.controller';

// ts-prune-ignore-next, eslint-disable-next-line require-await
export default fp(async (application: FastifyInstance) => {
  application.post(
    '/api/v1/builds',
    {
      schema: {
        response: {
          '201': {},
        },
      },
    },
    create,
  );
});
