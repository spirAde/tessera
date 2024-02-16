import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { create, update, remove } from '../../controllers/pages/pages.controller';
import { schemas } from '../../types';

// ts-prune-ignore-next
// eslint-disable-next-line require-await
export default fp(async (application: FastifyInstance) => {
  application.post(
    '/api/v1/pages',
    {
      schema: {
        body: schemas.CreatePageRequestBody,
        response: {
          204: {},
        },
      },
    },
    create,
  );

  application.put(
    '/api/v1/pages',
    {
      schema: {
        body: schemas.UpdatePageRequestBody,
        response: {
          201: {},
        },
      },
    },
    update,
  );

  application.delete(
    '/api/v1/pages',
    {
      schema: {
        body: schemas.DeletePageRequestBody,
        response: {
          200: {},
        },
      },
    },
    remove,
  );
});
