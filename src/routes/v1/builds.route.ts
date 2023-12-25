import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { schemas } from '../../types';
import { create } from '../../controllers/builds/builds.controller';

export default fp(async (application: FastifyInstance) => {
  application.post(
    '/api/v1/builds',
    {
      schema: {
        response: {
          '200': {
            description: '',
            content: {
              'application/json': {
                schema: schemas.CreateBuildResponse,
              },
            },
          },
        },
      },
    },
    create,
  );
});
