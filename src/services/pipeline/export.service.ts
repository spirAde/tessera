import path from 'path';
import { copy, outputFile } from 'fs-extra';
import React, { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { ServerStyleSheet } from 'styled-components';
import { ChunkExtractor } from '@loadable/server';
import { minify } from 'html-minifier';

import { Page } from '../../models';
import { getPageFolderPathFromUrl } from '../../lib/url';
import {
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
} from '../../config';
import { logger } from '../../lib/logger';

const sheet = new ServerStyleSheet();
const STATIC_URL = '/static/';

export async function exportServerFile() {
  await copy(
    path.join(temporaryApplicationBuildFolderRootPath, 'server.js'),
    path.join(temporaryApplicationExportFolderRootPath, 'server.js'),
  );
}

export async function exportClientStaticFiles() {
  await copy(
    path.join(temporaryApplicationBuildFolderRootPath, 'build/client'),
    path.join(temporaryApplicationExportFolderRootPath, 'static'),
  );
}

export async function exportPages(pages: Page[]) {
  const { nodeExtractor, webExtractor } = getLoadableExtractors();
  const { default: Application } = nodeExtractor.requireEntrypoint();

  await Promise.all(
    pages.map((page) =>
      exportPage({
        pageUrl: page.url,
        extractor: webExtractor,
        Application: Application as ComponentType<{ url: string }>,
      }),
    ),
  );
}

async function exportPage({
  Application,
  extractor,
  pageUrl,
}: {
  Application: ComponentType<{ url: string }>;
  extractor: ChunkExtractor;
  pageUrl: string;
}) {
  logger.debug(`export page url: ${pageUrl}`);

  const jsx = extractor.collectChunks(
    sheet.collectStyles(
      React.createElement(Application, {
        url: pageUrl,
      }),
    ),
  );
  const html = renderToString(jsx);
  const { htmlAttributes, title, base, meta, link, script } = Helmet.renderStatic();

  await outputFile(
    getPageFilePath(pageUrl),
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

function getPageFilePath(url: string) {
  const pageFolderPath = getPageFolderPathFromUrl(url);
  return path.join(temporaryApplicationExportFolderRootPath, 'pages', pageFolderPath, 'index.html');
}
