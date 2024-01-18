import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { create } from '../../controllers/builds/builds.controller';

// ts-prune-ignore-next
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
