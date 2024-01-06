import 'dotenv/config';
import path from 'path';

const pgConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'tessera-db',
  user: process.env.PG_USER || 'user',
  password: process.env.PG_PASSWORD || 'password',
};

export const pgConnectionString = `postgres://${pgConfig.user}:${pgConfig.password}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`;

export const host = process.env.HOST || '0.0.0.0';
export const port = Number(process.env.PORT || 3003);

export const projectSysName = 'T1Cloud';

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
