import { Op } from 'sequelize';

import { Stage, Status } from '../../types';
import { Build, BuildAttributes, BuildAttributesNew, Page } from '../../models';
import {
  ComponentLike,
  getProjectPages,
  getProjectPageStructure,
  Project,
  ProjectPage,
} from '../../sdk/platform.sdk';
import { logger } from '../../lib/logger';
import { runPipeline } from '../pipeline/pipeline.service';
import { setupApplicationFolderEnvironment } from '../pipeline/setup.service';
import { getDesignSystemComponentsList, getProject } from '../pipeline/fetching.service';
import {
  convertToMap,
  createApplicationFile,
  createApplicationPageFile,
} from '../pipeline/generating.service';
import { parseProjectPage } from '../pipeline/parsing.service';
import { collectMissedComponents } from '../pipeline/preparing.service';
import { compile } from '../pipeline/compiling.service';
import {
  exportClientStaticFiles,
  exportPages,
  runExportServerFile,
} from '../pipeline/export.service';
import { createPage, updatePage } from '../page/page.service';
import { commit } from '../pipeline/commit.service';

type BuildUpdate = Partial<BuildAttributes>;

interface BuildPipelineContext {
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

  const componentsRequiringBundles = [];
  const generatedPages = [];

  await updateBuild(context.build, {
    stage: Stage.generating,
  });

  for (const projectPage of context.projectPages) {
    logger.debug(
      `build pipeline generating page: id: - ${projectPage.id}, url - ${projectPage.url}`,
    );

    const page = await createPage({
      buildId: context.build.id,
      url: projectPage.url,
      stage: Stage.setup,
      status: Status.progress,
      externalId: projectPage.id,
    });

    try {
      const { pageFilePath, pageComponentName, pageComponentsList } =
        await runProjectPageGenerating(page, context);

      componentsRequiringBundles.push(...pageComponentsList);

      generatedPages.push({
        pageUrl: page.url,
        path: pageFilePath,
        pageName: pageComponentName,
      });
    } catch (error) {
      await updatePage(page, {
        status: Status.failed,
      });
    }
  }

  await createApplicationFile(generatedPages);

  return { componentsRequiringBundles, generatedPages };
}

async function runProjectPageGenerating(page: Page, context: BuildPipelineContext) {
  await updatePage(page, {
    stage: Stage.fetching,
  });

  const pageStructure = await getProjectPageStructure(page.externalId);

  const { pageComponentsList } = await parseProjectPage(
    pageStructure,
    convertToMap(context.designSystemComponentsList),
  );

  await updatePage(page, {
    stage: Stage.generating,
  });

  const { pageFilePath, pageComponentName } = await createApplicationPageFile(
    pageStructure,
    pageComponentsList,
  );

  return { pageFilePath, pageComponentName, pageComponentsList };
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

  await exportPages(
    context.project!,
    readyToExportPages.map(({ url }) => url),
  );
  await exportClientStaticFiles();
  await runExportServerFile();
}

async function runCommitStage(context: BuildPipelineContext) {
  logger.debug(`build pipeline stage = commit`);

  await updateBuild(context.build, {
    stage: Stage.commit,
  });

  await Page.update(
    { stage: Stage.commit, status: Status.success },
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
