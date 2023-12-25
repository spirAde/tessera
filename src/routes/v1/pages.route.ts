import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { update } from '../../controllers/pages/pages.controller';
import { schemas } from '../../types';

export default fp(async (application: FastifyInstance) => {
  application.put(
    '/api/v1/pages',
    {
      schema: {
        body: schemas.UpdatePageRequestBody,
      },
    },
    update,
  );
});
