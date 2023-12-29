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

export const initialProjectSettings = {
  PROGRESS_BAR_ENABLE: false,
  BACKEND_ENDPOINT: '',
  API_PATH: '/api/external/draft',
  PAGE_PATH: '/sitepages/v2?url=',
  COMPONENTS_PATH: '/sitepages/components',
  COMPONENTS_RESOLVER_PATH: '/components-kit',
  PROJECT_SYS_NAME: 'vtb.ru',
  MENU_PATH: '/menu/v2?projectSysName=',
  FOOTER_PATH: '/dictionaries/document',
  SCRIPTS_PATH: '/sitepages/scripts',
  FONT_FAMILY: 'VTB Group UI',
  HANDBOOKS_PATH: '/api/handbooks/handbooks',
  API_PREFIX: '',
  ENABLE_TO_LOAD_SECONDARY_COMPONENTS: false,
  DESIGN_SYSTEM_ID: 111,
  MEDIA_HOST: 'https://www.vtb.ru',
};

export const testPageUrls = [
  '/',
  // '/samozanyatym/',
  // '/malyj-biznes/',
  '/personal/ipoteka/dlya-semej-s-detmi/',
  '/krupnyj-biznes/',
  '/krupnyj-biznes/acquiring-i-sbp/',
  '/krupnyj-biznes/acquiring-i-sbp/torg-acquiring/',
  // '/credit-organizations/',
  // '/krupnyj-biznes/',
  // '/ir/',
  // '/ir/shares/',
  '/about/',
];

const rootFolderPath = process.cwd();

const tempApplicationFolderRootPath = path.join(rootFolderPath, 'temp');
export const tempApplicationBuildsFolderRootPath = path.join(
  tempApplicationFolderRootPath,
  'builds',
);
export const tempApplicationExportsFolderRootPath = path.join(
  tempApplicationFolderRootPath,
  'exports',
);

export const environmentApplicationFolderPath = path.join(
  rootFolderPath,
  'environments/application',
);
