import 'dotenv/config';
import path from 'path';

export const host = process.env.HOST || '0.0.0.0';
export const port = Number(process.env.PORT || 3003);

const pgConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'tessera-db',
  user: process.env.PG_USER || 'user',
  password: process.env.PG_PASSWORD || 'password',
};

export const pgConnectionString = `postgres://${pgConfig.user}:${pgConfig.password}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`;

export const minioConfig = {
  endPoint: process.env.MINIO_HOST || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
};

export const s3StaticUrl = `${minioConfig.endPoint}:${Number(process.env.MINIO_PORT_STATIC) || 9001}`;

export const isTest = process.env.STAGE === 'test';

export const useWorkerThreadsProcessing = Number(process.env.USE_WORKER_THREADS) || 0;
export const useS3BucketForStatic = Number(process.env.USE_S3_BUCKET) || 0;

export const projectSysName = process.env.PROJECT_NAME || 'T1Cloud';

export const rootFolderPath = process.cwd();
export const outputFolderPath = path.join(rootFolderPath, 'output');

export const temporaryApplicationFolderRootPath = path.join(outputFolderPath, 'temporary');
export const temporaryApplicationBuildFolderRootPath = path.join(
  temporaryApplicationFolderRootPath,
  'build',
);
export const temporaryApplicationExportFolderRootPath = path.join(
  temporaryApplicationFolderRootPath,
  'export',
);

export const persistentApplicationFolderRootPath = path.join(outputFolderPath, 'persistent');
export const persistentApplicationBuildFolderRootPath = path.join(
  persistentApplicationFolderRootPath,
  'build',
);
export const persistentApplicationExportFolderRootPath = path.join(
  persistentApplicationFolderRootPath,
  'export',
);

export const applicationTemplateFolderPath = path.join(rootFolderPath, 'src/templates/application');
