import path from 'path';
import { copy, outputFile } from 'fs-extra';
import React, { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';
import { ChunkExtractor } from '@loadable/server';
import { minify } from 'html-minifier';

import { getPageFolderPathFromUrl } from '../../lib/url';
import { Project } from '../../sdk/platform.sdk';
import {
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
} from '../../config';

const STATIC_URL = '/static/';
const sheet = new ServerStyleSheet();

export async function exportPages(project: Project, projectPageUrls: string[]) {
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

  const { default: Application } = nodeExtractor.requireEntrypoint();

  for (const projectPageUrl of projectPageUrls) {
    await exportPage({
      project,
      projectPageUrl,
      Application: Application as ComponentType<{ url: string }>,
      extractor: webExtractor,
    });
  }

  await copy(
    path.join(temporaryApplicationBuildFolderRootPath, 'build/client'),
    path.join(temporaryApplicationExportFolderRootPath, 'static'),
  );
}

export async function runExportServerFile() {
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

async function exportPage({
  Application,
  extractor,
  projectPageUrl,
  project,
}: {
  Application: ComponentType<{ url: string }>;
  extractor: ChunkExtractor;
  projectPageUrl: string;
  project: Project;
}) {
  const jsx = extractor.collectChunks(
    sheet.collectStyles(
      React.createElement(Application, {
        url: projectPageUrl,
      }),
    ),
  );
  const html = renderToString(jsx);
  const pageFilePath = getPageFilePath(projectPageUrl);

  await outputFile(
    pageFilePath,
    minify(
      `
      <!doctype html>
      <html lang="en">
        <head>
          <title>${project.title}</title>
          <meta charset="utf-8">
          <meta name="description" content="${project.description}"> 
          ${extractor.getLinkTags()}
          ${extractor.getStyleTags()}
          ${sheet.getStyleTags()}
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

function getPageFilePath(url: string) {
  const pageFolderPath = getPageFolderPathFromUrl(url);
  return path.join(temporaryApplicationExportFolderRootPath, 'pages', pageFolderPath, 'index.html');
}
