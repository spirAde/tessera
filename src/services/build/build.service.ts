import path from 'path';
import { Op } from 'sequelize';
import { remove } from 'fs-extra';

import { outputFolderPath, rootFolderPath } from '../../config';
import { Stage, Status } from '../../types';
import { Build, BuildAttributes, BuildAttributesNew, Page } from '../../models';
import { ComponentLike, getProjectPages, Project, ProjectPage } from '../../sdk/platform.sdk';
import { logger } from '../../lib/logger';
import { runPipeline } from '../pipeline/pipeline.service';
import { setupApplicationFolderEnvironment } from '../pipeline/setup.service';
import { getDesignSystemComponentsList, getProject } from '../pipeline/fetching.service';
import { convertToMap, createApplicationFile, generatePages } from '../pipeline/generating.service';
import { collectMissedComponents } from '../pipeline/preparing.service';
import { compile } from '../pipeline/compiling.service';
import { exportClientStaticFiles, exportPages, exportServerFile } from '../pipeline/export.service';
import { commit } from '../pipeline/commit.service';

type BuildUpdate = Partial<BuildAttributes>;

export interface BuildPipelineContext {
  build: Build;
  project: Project | null;
  projectPages: ProjectPage[];
  designSystemComponentsList: ComponentLike[];
  componentsRequiringBundles: ComponentLike[];
  clientEmittedAssets: string[];
}

export function getCurrentBuild() {
  return Build.findOne({
    where: {
      status: Status.success,
      stage: Stage.commit,
      deletedAt: null,
    },
    order: [['id', 'desc']],
    paranoid: false,
  });
}

export async function prepareEnvironmentForBuild() {
  await Build.destroy({ truncate: true });
  await Page.destroy({ truncate: true });

  await remove(path.join(rootFolderPath, 'node_modules/.cache/babel-loader'));
  await remove(outputFolderPath);
}

export async function runProjectBuild() {
  const readyToRunProjectBuild = await createBuild({
    status: Status.progress,
    stage: Stage.setup,
  });

  try {
    await runProjectBuildPipeline(readyToRunProjectBuild);
    await updateBuild(readyToRunProjectBuild, {
      status: Status.success,
    });
  } catch (error) {
    await updateBuild(readyToRunProjectBuild, {
      status: Status.failed,
    });
    throw error;
  }
}

async function runProjectBuildPipeline(build: Build) {
  const pipelineContext = createBuildPipelineContext({
    build,
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

  logger.debug(`build pipeline is successfully finished`);
}

async function runSetupStage({ build }: BuildPipelineContext) {
  logger.debug(`build pipeline stage = setup`);

  await updateBuild(build, {
    stage: Stage.setup,
  });

  await setupApplicationFolderEnvironment();
}

async function runFetchingStage({ build }: BuildPipelineContext) {
  logger.debug(`build pipeline stage = fetching`);

  await updateBuild(build, {
    stage: Stage.fetching,
  });

  const project = await getProject();
  const projectPages = await getProjectPages(project.sysName);
  const designSystemComponentsList = await getDesignSystemComponentsList(
    project.settings.designSystemId,
  );

  return {
    project,
    projectPages,
    designSystemComponentsList,
  } as Partial<BuildPipelineContext>;
}

async function runGeneratingStage(context: BuildPipelineContext) {
  logger.debug(`build pipeline stage = generating`);

  await updateBuild(context.build, {
    stage: Stage.generating,
  });

  const pages = await Page.bulkCreate(
    context.projectPages.map((projectPage) => ({
      buildId: context.build.id,
      url: projectPage.url,
      stage: Stage.setup,
      status: Status.progress,
      externalId: projectPage.id,
    })),
    { returning: true },
  );

  const { componentsRequiringBundles, generatedPages } = await generatePages(
    pages,
    convertToMap(context.designSystemComponentsList),
  );

  await createApplicationFile(generatedPages);

  return { componentsRequiringBundles, generatedPages };
}

async function runPreparingStage(context: BuildPipelineContext) {
  logger.debug(`build pipeline stage = preparing`);

  await updateBuild(context.build, {
    stage: Stage.preparing,
  });

  await collectMissedComponents({
    project: context.project!,
    missedComponents: context.componentsRequiringBundles,
    foundationKitComponent: context.designSystemComponentsList.find(
      (component) => component.name === 'foundation-kit',
    )!,
  });
}

async function runCompilationStage({ build }: BuildPipelineContext) {
  logger.debug(`build pipeline stage = compilation`);

  await updateBuild(build, {
    stage: Stage.compilation,
  });

  const [_, readyToCompilationPages] = await Page.update(
    { stage: Stage.compilation },
    {
      where: {
        buildId: build.id,
        status: {
          [Op.ne]: Status.failed,
        },
      },
      returning: true,
    },
  );

  return compile(readyToCompilationPages.map(({ url }) => url));
}

async function runExportStage(context: BuildPipelineContext) {
  logger.debug(`build pipeline stage = export`);

  await updateBuild(context.build, {
    stage: Stage.export,
  });

  const [_, readyToExportPages] = await Page.update(
    { stage: Stage.export },
    {
      where: {
        buildId: context.build.id,
        status: {
          [Op.ne]: Status.failed,
        },
      },
      returning: true,
    },
  );

  await exportPages(readyToExportPages);
  await exportClientStaticFiles();
  await exportServerFile();
}

async function runCommitStage(context: BuildPipelineContext) {
  logger.debug(`build pipeline stage = commit`);

  await updateBuild(context.build, {
    stage: Stage.commit,
  });

  await Page.update(
    { stage: Stage.commit },
    {
      where: {
        buildId: context.build.id,
        status: {
          [Op.ne]: Status.failed,
        },
      },
    },
  );

  await commit();

  await Page.update(
    { status: Status.success },
    {
      where: {
        buildId: context.build.id,
        status: {
          [Op.ne]: Status.failed,
        },
      },
    },
  );
}

function createBuildPipelineContext(context: Partial<BuildPipelineContext> & { build: Build }) {
  return {
    project: null,
    projectPages: [],
    designSystemComponentsList: [],
    componentsRequiringBundles: [],
    clientEmittedAssets: [],
    ...context,
  };
}

function createBuild(values: BuildAttributesNew) {
  return Build.create(values);
}

function updateBuild(build: Build, values: BuildUpdate) {
  return build.update(values);
}
