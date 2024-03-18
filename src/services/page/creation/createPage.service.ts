import { copy, remove } from 'fs-extra';
import path from 'path';

import {
  persistentApplicationBuildFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { logger } from '../../../lib/logger';
import { getPageFolderPathFromUrl } from '../../../lib/url';
import { Page, PageSnapshot, Pipeline } from '../../../models';
import { Stage, Status } from '../../../types';
import { convertComponentsToMap } from '../../component/component.service';
import { createPageSnapshot, updatePageSnapshot } from '../../pageSnapshot/pageSnapshot.service';
import { commit } from '../../pipeline/commit.service';
import {
  createApplicationFile,
  generatePage,
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
  runCompilationStage,
  runExportStage,
  runFetchingStage,
  runPreparingStage,
} from '../page.service';

export async function runPageCreation(pipeline: Pipeline, pageId: number): Promise<void> {
  const pages = await Page.findAll();

  const snapshot = (await createPageSnapshot({
    pageId,
    pipelineId: pipeline.id,
    status: Status.progress,
  })) as EagerLoaded<PageSnapshot, 'page'>;

  await snapshot.reload({
    include: [{ association: PageSnapshot.page }],
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
    await updatePipeline(pipeline, {
      status: Status.success,
    });
    await updatePageSnapshot(snapshot, {
      status: Status.success,
    });
    logger.info('page creation pipeline is successfully finished');
  } catch (error) {
    await updatePipeline(pipeline, {
      status: Status.failed,
    });
    await updatePageSnapshot(snapshot, {
      status: Status.failed,
    });
    await snapshot.page.destroy();
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
  pages,
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

  const generatedPages = pages.map((page) => ({
    pageUrl: page.url,
    path: getAbsolutePageFilePath(getPageFolderPathFromUrl(page.url)),
    pageName: getPageComponentName(getPageFolderPathFromUrl(page.url)),
  }));

  await createApplicationFile(generatedPages);

  return {
    componentsRequiringBundles: pageComponentsList,
    generatedPages,
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
  await remove(getAbsolutePageFilePath(getPageFolderPathFromUrl(snapshot.page.url)));
  await copy(
    path.join(persistentApplicationBuildFolderRootPath, 'application/application.jsx'),
    path.join(temporaryApplicationBuildFolderRootPath, 'application/application.jsx'),
  );
}
