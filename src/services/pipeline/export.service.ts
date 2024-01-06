import path from 'path';
import { promises as fs } from 'fs';
import React, { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';
import { ChunkExtractor } from '@loadable/server';
import { minify } from 'html-minifier';

import { getPageFolderPathFromUrl } from '../../lib/url';
import { Project, ProjectPage } from '../../sdk/platform.sdk';

const STATIC_URL = '/static/';
const sheet = new ServerStyleSheet();

export async function runExport({
  projectBuildFolderPath,
  projectExportFolderPath,
  projectPages,
  project,
}: {
  projectBuildFolderPath: string;
  projectExportFolderPath: string;
  projectPages: ProjectPage[];
  project: Project;
}) {
  const serverStats = path.join(projectBuildFolderPath, 'build/server/loadable-stats.json');
  const clientStats = path.join(projectBuildFolderPath, 'build/client/loadable-stats.json');

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

  for (const projectPage of projectPages) {
    await exportPage({
      projectExportFolderPath,
      project,
      Application: Application as ComponentType<{ url: string }>,
      extractor: webExtractor,
      projectPageUrl: projectPage.url,
    });
  }

  await fs.cp(
    path.join(projectBuildFolderPath, 'build/client'),
    path.join(projectExportFolderPath, 'static'),
    { recursive: true },
  );
  await fs.cp(
    path.join(projectBuildFolderPath, 'server.js'),
    path.join(projectExportFolderPath, 'server.js'),
  );
  await fs.cp(
    path.join(projectBuildFolderPath, 'BUILD_ID'),
    path.join(projectExportFolderPath, 'BUILD_ID'),
  );
}

async function exportPage({
  Application,
  extractor,
  projectExportFolderPath,
  projectPageUrl,
  project,
}: {
  Application: ComponentType<{ url: string }>;
  extractor: ChunkExtractor;
  projectExportFolderPath: string;
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

  const pageFolderPath = getPageFolderPathFromUrl(projectPageUrl);
  const absolutePageFolderPath = path.join(projectExportFolderPath, 'pages', pageFolderPath);
  const absolutePageFilePath = path.join(absolutePageFolderPath, 'index.html');

  await fs.mkdir(absolutePageFolderPath, { recursive: true });
  await fs.writeFile(
    absolutePageFilePath,
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
