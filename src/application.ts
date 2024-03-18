import fastify, { errorCodes, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';

import { host, isDevelopment, isTest, port, useS3BucketForStatic } from './config';
import { logger } from './lib/logger';
import { initializeOpentelemetry } from './lib/opentelemetry';
import { sequelize } from './lib/sequelize';
import { ensureS3BucketExists } from './sdk/minio.sdk';
import { authenticate } from './sdk/platform/platform.sdk';
import {
  ensureApplicationIsReadyToLaunch,
  getHttpsServerOptions,
} from './services/application/application.service';
import { initializeJobs, pgQueue } from './services/enqueueJob.service';

export const application = fastify({
  logger: true,
  https: isDevelopment || isTest ? null : getHttpsServerOptions(),
});

async function handleErrors(error: FastifyError, _: FastifyRequest, reply: FastifyReply) {
  if (error instanceof errorCodes.FST_ERR_BAD_STATUS_CODE) {
    await reply.status(500).send();
  } else {
    await reply.send(error);
  }
}

export async function runApplication(argv: { force: boolean }) {
  application.setErrorHandler(handleErrors);

  initializeOpentelemetry({
    name: 'tessera',
    environment: process.env.NODE_ENV ?? 'development',
    opentelemetry: {
      endpoint: process.env.OTEL_COLLECTOR_URL ?? '',
    },
  });

  try {
    useS3BucketForStatic && (await ensureS3BucketExists());

    await sequelize.sync();
    await pgQueue.start();

    await authenticate();
    await initializeJobs();
    await ensureApplicationIsReadyToLaunch(argv.force);

    await application.register(require('@fastify/helmet'));
    await application.register(require('@fastify/swagger'), {
      mode: 'static',
      specification: {
        path: './etc/openapi.json',
      },
    });
    await application.register(require('@fastify/swagger-ui'), {
      routePrefix: '/swagger',
    });
    await application.register(require('fastify-metrics'), {
      endpoint: '/metrics',
    });
    await application.register(require('@fastify/autoload'), {
      dir: path.join(__dirname, 'routes', 'v1'),
      options: {
        prefix: '/api/v1',
      },
    });
    await application.listen({ host, port });
  } catch (error) {
    logger.fatal(error, 'fatal application error');
    application.log.error(error);
    process.exit(1);
  }
}

export async function runTestApplication() {
  try {
    await sequelize.sync();
    await pgQueue.start();

    await initializeJobs();

    await application.register(require('@fastify/autoload'), {
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

process.on('beforeExit', async () => {
  await application.close();
  await sequelize.close();
  await pgQueue.stop({ graceful: true });
  process.exit(0);
});
