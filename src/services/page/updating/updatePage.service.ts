import { copy } from 'fs-extra';

import {
  persistentApplicationBuildFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { Page, PageSnapshot, Pipeline } from '../../../models';
import { Stage, Status } from '../../../types';
import { convertComponentsToMap } from '../../component/component.service';
import {
  createPageSnapshot,
  getLastPageSnapshot,
  updatePageSnapshot,
} from '../../pageSnapshot/pageSnapshot.service';
import { commit } from '../../pipeline/commit.service';
import { generatePage, getAbsolutePageFilePath } from '../../pipeline/generating.service';
import { runPipeline, updatePipeline } from '../../pipeline/pipeline.service';
import { rollback } from '../../pipeline/rollback.service';
import {
  createPagePipelineContext,
  PagePipelineContext,
  rollbackCompilationStage,
  rollbackExportStage,
  runCompilationStage,
  runExportStage,
  runFetchingStage,
  runPreparingStage,
} from '../page.service';

export async function runPageUpdating(pipeline: Pipeline, pageId: number): Promise<void> {
  const pages = await Page.findAll();

  const lastSnapshot = await getLastPageSnapshot(pageId);
  const snapshot = await createPageSnapshot({
    pageId,
    pipelineId: pipeline.id,
    status: Status.progress,
  });

  await lastSnapshot.destroy();
  await snapshot.reload({
    include: { association: PageSnapshot.page },
  });

  const pipelineContext = createPagePipelineContext({
    pipeline,
    pages,
    snapshot,
  });

  const stageToHandleMap = {
    [Stage.fetching]: runFetchingStage,
    [Stage.generating]: runGeneratingStage,
    [Stage.preparing]: runPreparingStage,
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
    logger.info(`page updating pipeline is successfully finished`);
  } catch (error) {
    await updatePipeline(pipeline, {
      status: Status.failed,
    });
    await updatePageSnapshot(snapshot, {
      status: Status.failed,
    });
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

async function runGeneratingStage({
  pipeline,
  snapshot,
  designSystemComponentsList,
}: PagePipelineContext) {
  logger.info('page generating stage');

  await updatePipeline(pipeline, {
    stage: Stage.generating,
  });

  const { pageComponentsList } = await generatePage(
    snapshot.page,
    convertComponentsToMap(designSystemComponentsList),
  );

  return {
    componentsRequiringBundles: pageComponentsList,
  };
}

async function runCommitStage({ pipeline, pages }: PagePipelineContext) {
  logger.info(`page commit stage`);

  await updatePipeline(pipeline, {
    stage: Stage.commit,
  });

  await commit(pages);
}

async function rollbackGeneratingStage({ snapshot }: PagePipelineContext) {
  const pageFolderPath = getPageFolderPathFromUrl(snapshot.page.url);

  await copy(
    getAbsolutePageFilePath(pageFolderPath, temporaryApplicationBuildFolderRootPath),
    getAbsolutePageFilePath(pageFolderPath, persistentApplicationBuildFolderRootPath),
  );
}
