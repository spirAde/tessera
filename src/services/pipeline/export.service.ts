import { ChunkExtractor } from '@loadable/server';
import { outputFile } from 'fs-extra';
import { minify } from 'html-minifier';
import path from 'path';
import React, { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { ServerStyleSheet } from 'styled-components';

import {
  temporaryApplicationBuildFolderRootPath,
  useS3BucketForStatic,
  projectSysName,
  s3StaticUrl,
} from '../../config';
import { logger } from '../../lib/logger';
import { Page } from '../../models';
import { getExportPageFilePath } from '../page/page.service';

const STATIC_URL = useS3BucketForStatic
  ? `${s3StaticUrl}/${projectSysName.toLowerCase()}/static/`
  : '/static/';

const sheet = new ServerStyleSheet();

export async function exportPages(pages: Page[]): Promise<void> {
  const { nodeExtractor, webExtractor } = getLoadableExtractors();
  const { default: Application } = nodeExtractor.requireEntrypoint();

  await Promise.all(
    pages.map((page) =>
      exportPage({
        page,
        extractor: webExtractor,
        Application: Application as ComponentType<{ url: string }>,
      }),
    ),
  );
}

async function exportPage({
  Application,
  extractor,
  page,
}: {
  Application: ComponentType<{ url: string }>;
  extractor: ChunkExtractor;
  page: Page;
}) {
  logger.debug(`export page url: ${page.url}`);

  const html = renderToString(
    extractor.collectChunks(
      sheet.collectStyles(
        React.createElement(Application, {
          url: page.url,
        }),
      ),
    ),
  );
  const { htmlAttributes, title, base, meta, link, script } = Helmet.renderStatic();

  await outputFile(
    getExportPageFilePath(page),
    minify(
      `
      <!doctype html>
      <html ${htmlAttributes.toString()} lang="ru">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />

          ${title.toString()}
          ${base.toString()}
          ${meta.toString()}
          ${link.toString()}
          ${script.toString()}

          ${extractor.getLinkTags()}
          ${extractor.getStyleTags()}

          ${sheet.getStyleTags()}
          <style>
            #root { width: 100%; background: white; }
          </style>
        </head>
        <body>
          <div id="app">${html}</div>
          ${extractor.getScriptTags()}
        </body>
      </html>
    `,
      {
        collapseWhitespace: true,
        removeComments: true,
        collapseBooleanAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeOptionalTags: true,
        minifyJS: true,
      },
    ),
  );
}

function getLoadableExtractors() {
  const serverStats = path.join(
    temporaryApplicationBuildFolderRootPath,
    'build/server/loadable-stats.json',
  );
  const clientStats = path.join(
    temporaryApplicationBuildFolderRootPath,
    'build/client/loadable-stats.json',
  );

  const nodeExtractor = new ChunkExtractor({
    statsFile: serverStats,
    entrypoints: 'application-server',
  });
  const webExtractor = new ChunkExtractor({
    statsFile: clientStats,
    publicPath: STATIC_URL,
    entrypoints: 'application-client',
  });

  return {
    nodeExtractor,
    webExtractor,
  };
}
