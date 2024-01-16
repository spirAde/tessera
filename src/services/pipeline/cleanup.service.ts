import { remove, readdir, stat, rmdir } from 'fs-extra';
import path from 'path';

import { Page } from '../../models';
import {
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
  persistentApplicationBuildFolderRootPath,
  persistentApplicationExportFolderRootPath,
} from '../../config';
import { getPageFolderPathFromUrl } from '../../lib/url';

export async function removeEmptyFoldersRecursively(directoryPath: string) {
  const files = await readdir(directoryPath);

  for (const file of files) {
    const filePath = `${directoryPath}/${file}`;

    const fileStat = await stat(filePath);
    const isDirectory = fileStat.isDirectory();

    if (isDirectory) {
      await removeEmptyFoldersRecursively(filePath);

      const isFolderEmpty = (await readdir(filePath)).length === 0;

      if (isFolderEmpty) {
        await rmdir(filePath);
      }
    }
  }
}

export async function removeDeletedPageFiles(page: Page) {
  const pageFolderPath = getPageFolderPathFromUrl(page.url);

  await Promise.all([
    removeRelatedToDeletedPageFiles(pageFolderPath, 'temporary'),
    removeRelatedToDeletedPageFiles(pageFolderPath, 'persistent'),
  ]);
}

async function removeRelatedToDeletedPageFiles(
  pageFolderPath: string,
  folderType: 'temporary' | 'persistent',
) {
  const buildFolder =
    folderType === 'temporary'
      ? temporaryApplicationBuildFolderRootPath
      : persistentApplicationBuildFolderRootPath;

  const exportFolder =
    folderType === 'temporary'
      ? temporaryApplicationExportFolderRootPath
      : persistentApplicationExportFolderRootPath;

  const indexJsFilePath = pageFolderPath ? `${pageFolderPath}.js` : 'index.js';
  const indexJsxFilePath = pageFolderPath ? `${pageFolderPath}/index.jsx` : 'index.jsx';
  const indexHtmlFilePath = pageFolderPath ? `${pageFolderPath}/index.html` : 'index.html';

  await Promise.all(
    [
      path.join(buildFolder, 'build/client/pages/', indexJsFilePath),
      path.join(buildFolder, 'build/server/pages/', indexJsFilePath),
      path.join(buildFolder, 'pages', indexJsxFilePath),
      path.join(exportFolder, 'static/pages', indexJsFilePath),
      path.join(exportFolder, 'pages', indexHtmlFilePath),
    ].map((filePath) => remove(filePath)),
  );
}
