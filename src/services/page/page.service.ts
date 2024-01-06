import { promises as fs } from 'fs';
import path from 'path';

import { Page, PageAttributesNew, PageAttributes } from '../../models';
import { createPipelineContext, PipelineContext, runPipeline } from '../pipeline/pipeline.service';
import { Stage, Status } from '../../types';
import {
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
} from '../../config';
import { logger } from '../../lib/logger';
import { getDesignSystemComponentsList, getProjectEnvironment } from '../pipeline/fetching.service';
import {
  convertToMap,
  createApplicationFile,
  createApplicationPageFile,
} from '../pipeline/generating.service';
import { runCompilation } from '../pipeline/compiling.service';
import { runExport } from '../pipeline/export.service';
import { getProjectPage } from '../../sdk/platform.sdk';
import { parseProjectPage } from '../pipeline/parsing.service';

type PageUpdate = Partial<PageAttributes>;

export function createPage(values: PageAttributesNew) {
  return Page.create(values);
}

export function updatePage(page: Page, values: PageUpdate) {
  return page.update(values);
}

export async function runPageUpdate(page: Page) {
  try {
    await runPageUpdatePipeline(page);

    await updatePage(page, {
      status: Status.success,
    });
  } catch (error) {
    await updatePage(page, {
      status: Status.failed,
    });
  }
}

async function runPageUpdatePipeline(page: Page) {
  const build = await page.getBuild();

  const pipelineContext = createPipelineContext({
    projectBuild: build,
    projectBuildFolderPath: temporaryApplicationBuildFolderRootPath,
    projectExportFolderPath: temporaryApplicationExportFolderRootPath,
  });
}

export async function deletePage(page: Page) {
  await Page.destroy({
    where: {
      id: page.id,
    },
  });

  const pagePathWithoutExtension = page.url === '/' ? 'index' : `${page.url}/index`;

  await fs.rm(
    path.join(temporaryApplicationBuildFolderRootPath, `${pagePathWithoutExtension}.jsx`),
  );
  await fs.rm(
    path.join(temporaryApplicationExportFolderRootPath, `${pagePathWithoutExtension}.html`),
  );
}
