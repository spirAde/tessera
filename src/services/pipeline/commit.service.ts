import { copy, pathExistsSync, readJson, remove, readFileSync } from 'fs-extra';
import { glob } from 'glob';
import path from 'path';
import { diff } from 'json-diff';

import { uploadFileToS3Bucket, removeFilesFromS3Bucket } from '../../sdk/minio.sdk';
import {
  persistentApplicationFolderRootPath,
  persistentApplicationBuildFolderRootPath,
  persistentApplicationExportFolderRootPath,
  temporaryApplicationFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
  useS3BucketForStatic,
} from '../../config';
import { Page } from '../../models';
import { getExportPageIndexHtmlFilePath } from '../page/page.service';

interface Chunk {
  files: string[];
}
type DiffFileStateChangeType = ' ' | '-' | '+' | '~';
type DiffFileState = [DiffFileStateChangeType, string | { files: string[] | DiffFileState[] }];
type PrettifiedDiffOutput = Record<'add' | 'remove', string[]>;

const temporaryApplicationClientBuildFolderPath = path.join(
  temporaryApplicationBuildFolderRootPath,
  'build/client',
);
const temporaryApplicationServerBuildFolderPath = path.join(
  temporaryApplicationBuildFolderRootPath,
  'build/server',
);
const persistentApplicationClientBuildFolderPath = path.join(
  persistentApplicationBuildFolderRootPath,
  'build/client',
);

export async function commit(pages: Page[]) {
  const clientDiff = await getLoadableStatsDiff('client');
  const serverDiff = await getLoadableStatsDiff('server');

  await updateTemporaryFolderState(clientDiff, serverDiff);
  await updatePersistentFolderState(clientDiff);

  // Currently all exported pages are copying every time
  // It should be reimplemented and supposed to copy only created/updated pages
  // and related to this one pages
  if (useS3BucketForStatic) {
    const exportedPagesDiff = await getExportedPagesDiff(pages);

    await updateS3BucketState(clientDiff, {
      add: pages.map((page) => getExportPageIndexHtmlFilePath(page)),
      remove: exportedPagesDiff.remove,
    });
  }
}

async function updateTemporaryFolderState(
  clientDiff: PrettifiedDiffOutput,
  serverDiff: PrettifiedDiffOutput,
) {
  await Promise.all([
    removeFiles(temporaryApplicationClientBuildFolderPath, clientDiff.remove),
    removeFiles(temporaryApplicationServerBuildFolderPath, serverDiff.remove),
  ]);
}

// TODO: copy only files which were changed(added, removed) between rebuilds according to diffs
// TODO: + application.jsx, pages, cache, etc
async function updatePersistentFolderState(clientDiff: PrettifiedDiffOutput) {
  await removeFiles(persistentApplicationClientBuildFolderPath, clientDiff.remove);
  await copy(temporaryApplicationFolderRootPath, persistentApplicationFolderRootPath);
  await copy(
    temporaryApplicationClientBuildFolderPath,
    path.join(persistentApplicationExportFolderRootPath, 'static'),
  );
}

async function updateS3BucketState(
  clientDiff: PrettifiedDiffOutput,
  exportedPagesDiff: PrettifiedDiffOutput,
) {
  await Promise.all([
    removeFilesFromS3Bucket(clientDiff.remove.map((file) => `/static/${file}`)),
    removeFilesFromS3Bucket(exportedPagesDiff.remove),
    ...clientDiff.add.map((file) =>
      uploadFileToS3Bucket(
        `/static/${file}`,
        readFileSync(path.join(temporaryApplicationClientBuildFolderPath, file), 'utf-8'),
      ),
    ),
    ...exportedPagesDiff.add.map((pagePath) =>
      uploadFileToS3Bucket(
        pagePath,
        readFileSync(path.join(temporaryApplicationExportFolderRootPath, pagePath), 'utf-8'),
      ),
    ),
  ]);
}

async function getExportedPagesDiff(pages: Page[]) {
  const currentExportedPages = await glob('**/*.html', {
    cwd: persistentApplicationExportFolderRootPath,
  });

  return normalizeJsonDiffOutput(
    prettifyJsonDiffOutputFormat(
      diff(
        currentExportedPages,
        pages.map((page) => getExportPageIndexHtmlFilePath(page)),
      ),
    ),
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

async function removeFiles(folderPath: string, files: string[]) {
  await Promise.all(files.map((file) => remove(path.join(folderPath, file))));
}

function getLoadableStatsFilePath(parent: 'persistent' | 'temporary', folder: 'client' | 'server') {
  const parentFolder =
    parent === 'persistent'
      ? persistentApplicationBuildFolderRootPath
      : temporaryApplicationBuildFolderRootPath;

  return path.join(parentFolder, 'build', folder, 'loadable-stats.json');
}

function prettifyJsonDiffOutputFormat(diff: (DiffFileState | Chunk)[] = []): PrettifiedDiffOutput {
  return diff.reduce<PrettifiedDiffOutput>(
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

function normalizeJsonDiffOutput(diff: PrettifiedDiffOutput): PrettifiedDiffOutput {
  return {
    add: diff.add.filter((file) => !diff.remove.includes(file)),
    remove: diff.remove.filter((file) => !diff.add.includes(file)),
  };
}

function isDiffFileState(file: Chunk | DiffFileState): file is DiffFileState {
  return Array.isArray(file);
}
