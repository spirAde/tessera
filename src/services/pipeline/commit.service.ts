import { hashElement } from 'folder-hash';
import {
  copy,
  pathExistsSync,
  readJson,
  remove,
  readFileSync,
  readdir,
  stat,
  rmdir,
} from 'fs-extra';
import { glob } from 'glob';
import { diff } from 'json-diff';
import path from 'path';
import retryAsPromised from 'retry-as-promised';

import {
  persistentApplicationFolderRootPath,
  persistentApplicationBuildFolderRootPath,
  persistentApplicationExportFolderRootPath,
  temporaryApplicationFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
  useS3BucketForStatic,
} from '../../config';
import { logger } from '../../lib/logger';
import { Page } from '../../models';
import { uploadFileToS3Bucket, removeFilesFromS3Bucket } from '../../sdk/minio.sdk';
import { getExportPageIndexHtmlFilePath } from '../page/page.service';

type Chunk = { files: string[] };
type DiffFileStateChangeType = ' ' | '-' | '+' | '~';
type DiffFileState = [DiffFileStateChangeType, string | { files: string[] | DiffFileState[] }];
type PrettifiedDiffOutput = Record<'add' | 'remove', string[]>;

const temporaryApplicationClientBuildFolderPath = path.join(
  temporaryApplicationBuildFolderRootPath,
  'build/client',
);

// Currently all exported pages are copying every time
// It should be reimplemented and supposed to copy only created/updated pages
// and related to this one pages
export async function commit(pages: Page[]): Promise<void> {
  const clientDiff = await getLoadableStatsDiff('client');
  const serverDiff = await getLoadableStatsDiff('server');
  const pagesDiff = await getPagesDiff(pages);

  await retryAsPromised(
    () => {
      return updateFoldersState({
        clientDiff,
        serverDiff,
        pagesDiff: {
          remove: pagesDiff.remove,
          add: pages.map((page) => getExportPageIndexHtmlFilePath(page)),
        },
      });
    },
    {
      max: 3,
      backoffBase: 1000,
      backoffExponent: 1.5,
      report: (_, options) =>
        logger.debug(`[updateFoldersState] update folders state, attempt: ${options.$current}`),
    },
  );

  useS3BucketForStatic &&
    (await updateS3BucketState(clientDiff, {
      add: pages.map((page) => getExportPageIndexHtmlFilePath(page)),
      remove: pagesDiff.remove,
    }));
}

async function updateFoldersState({
  clientDiff,
  serverDiff,
  pagesDiff,
}: {
  clientDiff: PrettifiedDiffOutput;
  serverDiff: PrettifiedDiffOutput;
  pagesDiff: PrettifiedDiffOutput;
}) {
  const filesRequiringRemoving = getFilesRequiringRemoving({
    clientRemoveDiff: clientDiff.remove,
    serverRemoveDiff: serverDiff.remove,
    pagesRemoveDiff: pagesDiff.remove,
  });

  await updateTemporaryFolderState(clientDiff.add, filesRequiringRemoving);
  await updatePersistentFolderState(
    getFilesRequiringCopying({
      clientAddDiff: clientDiff.add,
      serverAddDiff: serverDiff.add,
      pagesAddDiff: pagesDiff.add,
      componentsAddDiff: (await getComponentsDiff()).add,
      constantFilesAddDiff: (await getConstantFilesDiff()).add,
    }),
    filesRequiringRemoving,
  );

  await assertFoldersHaveTheSameChecksum();
}

async function updateTemporaryFolderState(
  clientAddDiff: string[],
  filesRequiredRemoving: string[],
) {
  await removeFiles(temporaryApplicationFolderRootPath, filesRequiredRemoving);
  await removeEmptyFoldersRecursively(temporaryApplicationFolderRootPath);
  await copyFiles(
    temporaryApplicationClientBuildFolderPath,
    path.join(temporaryApplicationFolderRootPath, 'export/static'),
    clientAddDiff,
  );
}

async function updatePersistentFolderState(
  filesRequiredAdding: string[],
  filesRequiredRemoving: string[],
) {
  await copyFiles(
    temporaryApplicationFolderRootPath,
    persistentApplicationFolderRootPath,
    filesRequiredAdding,
  );
  await copyFiles(temporaryApplicationFolderRootPath, persistentApplicationFolderRootPath, [
    'build/build/client/loadable-stats.json',
    'build/build/server/loadable-stats.json',
    'build/application/application.jsx',
  ]);
  await removeFiles(persistentApplicationFolderRootPath, filesRequiredRemoving);
  await removeEmptyFoldersRecursively(persistentApplicationFolderRootPath);
}

async function updateS3BucketState(
  clientDiff: PrettifiedDiffOutput,
  pagesDiff: PrettifiedDiffOutput,
) {
  await Promise.all([
    removeFilesFromS3Bucket(clientDiff.remove.map((file) => `/static/${file}`)),
    removeFilesFromS3Bucket(pagesDiff.remove),
    ...clientDiff.add.map((file) =>
      uploadFileToS3Bucket(
        `/static/${file}`,
        readFileSync(path.join(temporaryApplicationClientBuildFolderPath, file), 'utf-8'),
      ),
    ),
    ...pagesDiff.add.map((pagePath) =>
      uploadFileToS3Bucket(
        pagePath,
        readFileSync(path.join(temporaryApplicationExportFolderRootPath, pagePath), 'utf-8'),
      ),
    ),
  ]);
}

async function getPagesDiff(pages: Page[]) {
  const exportedPages = await glob('**/*.html', {
    cwd: persistentApplicationExportFolderRootPath,
  });

  return normalizeJsonDiffOutput(
    prettifyJsonDiffOutputFormat(
      diff(
        exportedPages,
        pages.map((page) => getExportPageIndexHtmlFilePath(page)),
      ),
    ),
  );
}

async function getComponentsDiff() {
  const currentComponents = await glob('**/*.{js,jsx}', {
    cwd: path.join(temporaryApplicationBuildFolderRootPath, 'components'),
  });
  const previousComponents = await glob('**/*.{js,jsx}', {
    cwd: path.join(persistentApplicationBuildFolderRootPath, 'components'),
  });

  return normalizeJsonDiffOutput(
    prettifyJsonDiffOutputFormat(diff(previousComponents, currentComponents)),
  );
}

async function getLoadableStatsDiff(folder: 'client' | 'server') {
  const temporaryLoadableStatsJsonFilePath = getLoadableStatsFilePath('temporary', folder);
  const persistentLoadableStatsJsonFilePath = getLoadableStatsFilePath('persistent', folder);

  const persistentLoadableStatsJsonFileExists = pathExistsSync(persistentLoadableStatsJsonFilePath);

  const temporaryLoadableStatsJsonFileContent = await readJson(temporaryLoadableStatsJsonFilePath);
  const persistentLoadableStatsJsonFileContent = persistentLoadableStatsJsonFileExists
    ? await readJson(persistentLoadableStatsJsonFilePath)
    : { chunks: [] };

  const diffOutput = diff(
    persistentLoadableStatsJsonFileContent,
    temporaryLoadableStatsJsonFileContent,
  );

  return normalizeJsonDiffOutput(prettifyJsonDiffOutputFormat(diffOutput.chunks));
}

async function assertFoldersHaveTheSameChecksum() {
  const options = {
    files: {
      ignoreRootName: true,
    },
    folders: {
      ignoreRootName: true,
      exclude: ['**cache'],
    },
  };

  const temporaryFolderChecksum = await hashElement(temporaryApplicationFolderRootPath, options);
  const persistentFolderChecksum = await hashElement(persistentApplicationFolderRootPath, options);

  if (temporaryFolderChecksum.hash !== persistentFolderChecksum.hash) {
    return Promise.reject(new Error('wrong checksum between temporary and persistent folders'));
  }
}

// constant means the files and folders which can not be changed between
// recompilation/reexport(context, public, etc). Actually it's implemented
// for build task when persistent folder is empty
async function getConstantFilesDiff() {
  const ignore = [
    'build/**',
    'cache/**',
    'pages/**',
    'components/**',
    'application/application.jsx',
  ];

  const currentConstantFiles = await glob('**', {
    cwd: temporaryApplicationBuildFolderRootPath,
    nodir: true,
    dot: true,
    ignore,
  });
  const previousConstantFiles = await glob('**', {
    cwd: persistentApplicationBuildFolderRootPath,
    nodir: true,
    dot: true,
    ignore,
  });

  return normalizeJsonDiffOutput(
    prettifyJsonDiffOutputFormat(diff(previousConstantFiles, currentConstantFiles)),
  );
}

async function removeFiles(folderPath: string, files: string[]) {
  await Promise.all(files.map((file) => remove(path.join(folderPath, file))));
}

async function copyFiles(fromFolder: string, toFolder: string, files: string[]) {
  await Promise.all(
    files.map((file) => copy(path.join(fromFolder, file), path.join(toFolder, file))),
  );
}

async function removeFolderIfEmpty(folderPath: string) {
  const isFolderEmpty = (await readdir(folderPath)).length === 0;

  if (isFolderEmpty) {
    await rmdir(folderPath);
  }
}

async function removeEmptyFoldersRecursively(directoryPath: string) {
  const files = await readdir(directoryPath);

  for (const file of files) {
    const filePath = `${directoryPath}/${file}`;

    const fileStat = await stat(filePath);
    const isDirectory = fileStat.isDirectory();

    if (isDirectory) {
      await removeEmptyFoldersRecursively(filePath);
      await removeFolderIfEmpty(filePath);
    }
  }
}

function getLoadableStatsFilePath(parent: 'persistent' | 'temporary', folder: 'client' | 'server') {
  const parentFolder =
    parent === 'persistent'
      ? persistentApplicationBuildFolderRootPath
      : temporaryApplicationBuildFolderRootPath;

  return path.join(parentFolder, 'build', folder, 'loadable-stats.json');
}

function prettifyJsonDiffOutputFormat(
  jsonDiffOutput: (DiffFileState | Chunk)[] = [],
): PrettifiedDiffOutput {
  return jsonDiffOutput.reduce<PrettifiedDiffOutput>(
    (output, chunkOrDiffFileState) => {
      if (!isDiffFileState(chunkOrDiffFileState)) {
        return {
          ...output,
          add: [...output.add, ...chunkOrDiffFileState.files],
        } as PrettifiedDiffOutput;
      }

      const [fileStateChangeType, fileState] = chunkOrDiffFileState;

      if (fileStateChangeType === ' ') {
        return output;
      }

      const files = typeof fileState === 'string' ? [fileState] : fileState.files;

      if (fileStateChangeType === '+') {
        return {
          ...output,
          add: [...output.add, ...files],
        } as PrettifiedDiffOutput;
      }

      if (fileStateChangeType === '-') {
        return {
          ...output,
          remove: [...output.remove, ...files],
        } as PrettifiedDiffOutput;
      }

      const alteredFileStateOutput = prettifyJsonDiffOutputFormat(files as DiffFileState[]);

      return {
        add: [...output.add, ...alteredFileStateOutput.add],
        remove: [...output.remove, ...alteredFileStateOutput.remove],
      };
    },
    { add: [], remove: [] },
  );
}

function normalizeJsonDiffOutput(jsonDiffOutput: PrettifiedDiffOutput): PrettifiedDiffOutput {
  return {
    add: jsonDiffOutput.add.filter((file) => !jsonDiffOutput.remove.includes(file)),
    remove: jsonDiffOutput.remove.filter((file) => !jsonDiffOutput.add.includes(file)),
  };
}

function isDiffFileState(file: Chunk | DiffFileState): file is DiffFileState {
  return Array.isArray(file);
}

function getFilesRequiringRemoving({
  clientRemoveDiff,
  serverRemoveDiff,
  pagesRemoveDiff,
}: {
  clientRemoveDiff: string[];
  serverRemoveDiff: string[];
  pagesRemoveDiff: string[];
}) {
  return [
    ...clientRemoveDiff.map((filePath) => [
      path.join('build/build/client', filePath),
      path.join('export/static', filePath),
    ]),
    ...serverRemoveDiff.map((filePath) => path.join('build/build/server', filePath)),
    ...pagesRemoveDiff.map((pagePath) => [
      path.join('build', pagePath.replace('html', 'jsx')),
      path.join('export', pagePath),
    ]),
  ].flat();
}

function getFilesRequiringCopying({
  clientAddDiff,
  serverAddDiff,
  pagesAddDiff,
  componentsAddDiff,
  constantFilesAddDiff,
}: {
  clientAddDiff: string[];
  serverAddDiff: string[];
  pagesAddDiff: string[];
  componentsAddDiff: string[];
  constantFilesAddDiff: string[];
}) {
  return [
    ...clientAddDiff.map((filePath) => [
      path.join('build/build/client', filePath),
      path.join('export/static', filePath),
    ]),
    ...serverAddDiff.map((filePath) => path.join('build/build/server', filePath)),
    ...pagesAddDiff.map((pagePath) => [
      path.join('export', pagePath),
      path.join('build', pagePath.replace('html', 'jsx')),
    ]),
    ...componentsAddDiff.map((filePath) => path.join('build/components', filePath)),
    ...constantFilesAddDiff.map((filePath) => path.join('build', filePath)),
  ].flat();
}
