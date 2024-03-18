import { copy } from 'fs-extra';
import path from 'path';

import {
  persistentApplicationBuildFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { Page, PageSnapshot, Pipeline } from '../../../models';
import { fetchProject } from '../../../sdk/platform/platform.sdk';
import { Stage, Status } from '../../../types';
import {
  createPageSnapshot,
  getLastPageSnapshot,
  updatePageSnapshot,
} from '../../pageSnapshot/pageSnapshot.service';
import { commit } from '../../pipeline/commit.service';
import { compile } from '../../pipeline/compiling.service';
import { exportPages } from '../../pipeline/export.service';
import {
  createApplicationFile,
  getAbsolutePageFilePath,
  getPageComponentName,
} from '../../pipeline/generating.service';
import { runPipeline, updatePipeline } from '../../pipeline/pipeline.service';
import { rollback } from '../../pipeline/rollback.service';
import {
  createPagePipelineContext,
  PagePipelineContext,
  rollbackCompilationStage,
  rollbackExportStage,
} from '../page.service';

export async function runPageDeleting(pipeline: Pipeline, pageId: number): Promise<void> {
  const pages = await Page.findAll();

  const lastSnapshot = await getLastPageSnapshot(pageId);
  const snapshot = await createPageSnapshot({
    pageId,
    pipelineId: pipeline.id,
    status: Status.progress,
  });

  await lastSnapshot.destroy();
  await snapshot.reload({
    include: { association: PageSnapshot.page, paranoid: false },
  });

  const pipelineContext = createPagePipelineContext({
    pages,
    pipeline,
    snapshot,
  });

  const stageToHandleMap = {
    [Stage.fetching]: runFetchingStage,
    [Stage.generating]: runGeneratingStage,
    [Stage.compilation]: runCompilationStage,
    [Stage.export]: runExportStage,
    [Stage.commit]: runCommitStage,
  };

  try {
    await runPipeline(pipelineContext, Object.values(stageToHandleMap));
    await updatePageSnapshot(snapshot, {
      status: Status.success,
    });
    await updatePipeline(pipeline, {
      status: Status.success,
    });
    logger.info(`page deleting pipeline is successfully finished`);
  } catch (error) {
    await updatePageSnapshot(snapshot, {
      status: Status.failed,
    });
    await updatePipeline(pipeline, {
      status: Status.failed,
    });
    await snapshot.page.restore();
    await lastSnapshot.restore();
    await snapshot.destroy();
    await rollback({
      context: pipelineContext,
      stages: Object.keys(stageToHandleMap) as Stage[],
      rollbackFns: { rollbackGeneratingStage, rollbackCompilationStage, rollbackExportStage },
    });
    throw error;
  }
}

async function runFetchingStage({ pipeline, snapshot }: PagePipelineContext) {
  logger.info(`page fetching stage: ${snapshot.page.url}`);

  await updatePipeline(pipeline, {
    stage: Stage.fetching,
  });

  const project = await fetchProject();

  return {
    project,
    designSystemComponentsList: [],
  } as Partial<PagePipelineContext>;
}

async function runGeneratingStage({ pipeline, pages, snapshot }: PagePipelineContext) {
  logger.info(`page generating stage: ${snapshot.page.url}`);

  await updatePipeline(pipeline, {
    stage: Stage.generating,
  });

  const generatedPages = pages.map((page) => ({
    pageUrl: page.url,
    path: getAbsolutePageFilePath(getPageFolderPathFromUrl(page.url)),
    pageName: getPageComponentName(getPageFolderPathFromUrl(page.url)),
  }));

  await createApplicationFile(generatedPages);

  return {
    componentsRequiringBundles: [],
    generatedPages,
  };
}

async function runCompilationStage({ pipeline, pages }: PagePipelineContext) {
  await updatePipeline(pipeline, {
    stage: Stage.compilation,
  });

  await compile(pages);
}

async function runExportStage({ pipeline, pages }: PagePipelineContext) {
  await updatePipeline(pipeline, {
    stage: Stage.export,
  });

  await exportPages(pages);
}

async function runCommitStage({ pipeline, pages }: PagePipelineContext) {
  await updatePipeline(pipeline, {
    stage: Stage.commit,
  });

  await commit(pages);
}

async function rollbackGeneratingStage() {
  await copy(
    path.join(persistentApplicationBuildFolderRootPath, 'application/application.jsx'),
    path.join(temporaryApplicationBuildFolderRootPath, 'application/application.jsx'),
  );
}
