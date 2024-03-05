import { remove } from 'fs-extra';
import path from 'path';
import { Op } from 'sequelize';

import { outputFolderPath, rootFolderPath, useS3BucketForStatic } from '../../config';
import { logger } from '../../lib/logger';
import { Page, PageSnapshot, Pipeline } from '../../models';
import { removeS3BucketFiles } from '../../sdk/minio.sdk';
import { getProject, getProjectPages } from '../../sdk/platform/platform.sdk';
import { Project, ProjectPage } from '../../sdk/platform/types';
import { Stage, Status } from '../../types';
import {
  ComponentLike,
  convertComponentsToMap,
  getUniqueComponents,
} from '../component/component.service';
import { commit } from '../pipeline/commit.service';
import { compile } from '../pipeline/compiling.service';
import { exportPages } from '../pipeline/export.service';
import { getDesignSystemComponentsList } from '../pipeline/fetching.service';
import { createApplicationFile, generatePages } from '../pipeline/generating.service';
import { runPipeline, updatePipeline } from '../pipeline/pipeline.service';
import { prepare } from '../pipeline/preparing.service';
import { setupApplicationFolderEnvironment } from '../pipeline/setup.service';

type BuildPipelineContext = {
  pipeline: Pipeline;
  project: Project | null;
  projectPages: ProjectPage[];
  designSystemComponentsList: ComponentLike[];
  componentsRequiringBundles: ComponentLike[];
  foundationKitComponent: ComponentLike | null;
};

export async function cleanUpBeforeBuild(): Promise<void> {
  await Pipeline.destroy({ truncate: true });
  await Page.destroy({ truncate: true });
  await PageSnapshot.destroy({ truncate: true });

  await remove(path.join(rootFolderPath, 'node_modules/.cache/babel-loader'));
  await remove(outputFolderPath);

  useS3BucketForStatic && (await removeS3BucketFiles());
}

export async function runProjectBuild(pipeline: Pipeline): Promise<void> {
  try {
    await runProjectBuildPipeline(pipeline);
    await updatePipeline(pipeline, {
      status: Status.success,
    });
  } catch (error) {
    await updatePipeline(pipeline, {
      status: Status.failed,
    });
    throw error;
  }
}

async function runProjectBuildPipeline(pipeline: Pipeline) {
  const pipelineContext = createBuildPipelineContext({
    pipeline,
  });

  const handlers = [
    runSetupStage,
    runFetchingStage,
    runGeneratingStage,
    runPreparingStage,
    runCompilationStage,
    runExportStage,
    runCommitStage,
  ];

  await runPipeline(pipelineContext, handlers);

  logger.debug('build pipeline is successfully finished');
}

async function runSetupStage({ pipeline }: BuildPipelineContext) {
  logger.debug('build pipeline stage = setup');

  await updatePipeline(pipeline, {
    stage: Stage.setup,
  });

  await setupApplicationFolderEnvironment();
}

async function runFetchingStage({ pipeline }: BuildPipelineContext) {
  logger.debug('build pipeline stage = fetching');

  await updatePipeline(pipeline, {
    stage: Stage.fetching,
  });

  const project = await getProject();
  const projectPages = await getProjectPages();
  const designSystemComponentsList = await getDesignSystemComponentsList(
    project.settings.designSystemId,
  );

  const foundationKitComponent = designSystemComponentsList.find(
    (component) => component.name === 'foundation-kit',
  );

  if (!foundationKitComponent) {
    throw new Error('missed foundation kit component');
  }

  return {
    project,
    projectPages,
    designSystemComponentsList,
    foundationKitComponent,
  } as Partial<BuildPipelineContext>;
}

async function runGeneratingStage({
  pipeline,
  projectPages,
  designSystemComponentsList,
}: BuildPipelineContext) {
  logger.debug('build pipeline stage = generating');

  await updatePipeline(pipeline, {
    stage: Stage.generating,
  });

  const pages = await Page.bulkCreate(
    projectPages.map((projectPage) => ({
      url: projectPage.url,
      externalId: projectPage.id,
    })),
    { returning: true },
  );

  await PageSnapshot.bulkCreate(
    pages.map((page) => ({
      pipelineId: pipeline.id,
      pageId: page.id,
      status: Status.progress,
    })),
  );

  const { componentsRequiringBundles, generatedPages } = await generatePages(
    pages,
    convertComponentsToMap(designSystemComponentsList),
  );

  await createApplicationFile(generatedPages);

  return { componentsRequiringBundles, generatedPages };
}

async function runPreparingStage({
  pipeline,
  project,
  componentsRequiringBundles,
  foundationKitComponent,
}: BuildPipelineContext) {
  logger.debug('build pipeline stage = preparing');

  await updatePipeline(pipeline, { stage: Stage.preparing });

  await prepare({
    designSystemId: project!.settings.designSystemId,
    foundationKitComponent: foundationKitComponent!,
    components: getUniqueComponents(componentsRequiringBundles),
  });
}

async function runCompilationStage({ pipeline }: BuildPipelineContext) {
  logger.debug('build pipeline stage = compilation');

  await updatePipeline(pipeline, {
    stage: Stage.compilation,
  });

  const readyToCompilationPages = await Page.findAll({
    include: {
      association: Page.pageSnapshots,
      where: { pipelineId: pipeline.id, status: Status.progress },
    },
  });

  return compile(readyToCompilationPages);
}

async function runExportStage({ pipeline }: BuildPipelineContext) {
  logger.debug('build pipeline stage = export');

  await updatePipeline(pipeline, {
    stage: Stage.export,
  });

  const readyToExportPages = await Page.findAll({
    include: {
      association: Page.pageSnapshots,
      where: { pipelineId: pipeline.id, status: Status.progress },
    },
  });

  await exportPages(readyToExportPages);
}

async function runCommitStage({ pipeline }: BuildPipelineContext) {
  logger.debug('build pipeline stage = commit');

  await updatePipeline(pipeline, {
    stage: Stage.commit,
  });

  const readyToCommitPages = await Page.findAll({
    include: {
      association: Page.pageSnapshots,
      where: { pipelineId: pipeline.id, status: Status.progress },
    },
  });

  await commit(readyToCommitPages);

  await PageSnapshot.update(
    { status: Status.success },
    {
      where: {
        pipelineId: pipeline.id,
        status: {
          [Op.ne]: Status.failed,
        },
      },
    },
  );
}

function createBuildPipelineContext(
  context: Partial<BuildPipelineContext> & { pipeline: Pipeline },
) {
  return {
    project: null,
    projectPages: [],
    designSystemComponentsList: [],
    componentsRequiringBundles: [],
    foundationKitComponent: null,
    ...context,
  };
}
