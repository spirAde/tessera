import path from 'path';
import fastify, { errorCodes, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { fastifyAutoload } from '@fastify/autoload';

import { host, port } from './config';
import { runQueue } from './services/enqueueJob.service';
import { sequelize } from './lib/sequelize';
import { initOpentelemetry } from './lib/opentelemetry';
import { logger } from './lib/logger';

export const application = fastify({
  logger: true,
});

async function handleErrors(error: FastifyError, _: FastifyRequest, reply: FastifyReply) {
  if (error instanceof errorCodes.FST_ERR_BAD_STATUS_CODE) {
    await reply.status(500).send();
  } else {
    await reply.send(error);
  }
}

export async function runApplication() {
  application.setErrorHandler(handleErrors);

  initOpentelemetry({
    name: 'tessera',
    environment: process.env.NODE_ENV ?? 'development',
    opentelemetry: {
      endpoint: process.env.OTEL_COLLECTOR_URL ?? '',
    },
  });

  try {
    await sequelize.sync();
    await runQueue();

    await application.register(require('fastify-metrics'), {
      endpoint: '/metrics',
    });
    await application.register(fastifyAutoload, {
      dir: path.join(__dirname, 'routes', 'v1'),
      options: {
        prefix: '/api/v1',
      },
    });
    await application.listen({ host, port });
  } catch (error) {
    logger.fatal('error', error);
    application.log.error(error);
    process.exit(1);
  }
}

export async function runTestApplication() {
  try {
    await sequelize.sync();
    await runQueue();

    await application.register(fastifyAutoload, {
      dir: path.join(__dirname, 'routes', 'v1'),
      options: {
        prefix: '/api/v1',
      },
    });
    await application.listen({ host, port });
  } catch (error) {
    logger.fatal(error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.fatal(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.fatal(error);
  process.exit(1);
});
