import path from 'path';
import { Op } from 'sequelize';
import { copy, remove } from 'fs-extra';

import {
  outputFolderPath,
  persistentApplicationExportFolderRootPath,
  rootFolderPath,
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
} from '../../config';
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
import { exportPages } from '../pipeline/export.service';
import { commit } from '../pipeline/commit.service';
import { removeS3BucketFiles } from '../../sdk/minio.sdk';
import { getPageFolderPathFromUrl } from '../../lib/url';
import { getExportPageFilePath } from '../page/page.service';

type BuildUpdate = Partial<BuildAttributes>;

export interface BuildPipelineContext {
  build: Build;
  project: Project | null;
  projectPages: ProjectPage[];
  designSystemComponentsList: ComponentLike[];
  componentsRequiringBundles: ComponentLike[];
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
  await removeS3BucketFiles();
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
}

async function runCommitStage({ build }: BuildPipelineContext) {
  logger.debug(`build pipeline stage = commit`);

  await updateBuild(build, {
    stage: Stage.commit,
  });

  const [_, readyToCommitPages] = await Page.update(
    { stage: Stage.commit },
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

  await commit(readyToCommitPages);

  await copy(
    path.join(temporaryApplicationBuildFolderRootPath, 'server.js'),
    path.join(persistentApplicationExportFolderRootPath, 'server.js'),
  );

  await Page.update(
    { status: Status.success },
    {
      where: {
        buildId: build.id,
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
    serverEmittedAssets: [],
    ...context,
  };
}

function createBuild(values: BuildAttributesNew) {
  return Build.create(values);
}

function updateBuild(build: Build, values: BuildUpdate) {
  return build.update(values);
}
