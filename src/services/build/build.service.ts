import { Stage, Status } from '../../types';
import { Build, BuildAttributes, BuildAttributesNew, Page } from '../../models';
import { getProjectPage, Project } from '../../sdk/platform.sdk';
import { logger } from '../../lib/logger';
import {
  projectSysName,
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
} from '../../config';
import { createPipelineContext, PipelineContext, runPipeline } from '../pipeline/pipeline.service';
import { createBuildIdFile, setupApplicationFolderEnvironment } from '../pipeline/setup.service';
import { getDesignSystemComponentsList, getProjectEnvironment } from '../pipeline/fetching.service';
import {
  convertToMap,
  createApplicationFile,
  createApplicationPageFile,
} from '../pipeline/generating.service';
import { parseProjectPage } from '../pipeline/parsing.service';
import { prepareComponentsForBuild } from '../pipeline/preparing.service';
import { runCompilation } from '../pipeline/compiling.service';
import { runExport } from '../pipeline/export.service';
import { createPage, updatePage } from '../page/page.service';

type BuildUpdate = Partial<BuildAttributes>;

export function createBuild(values: BuildAttributesNew) {
  return Build.create(values);
}

export function updateBuild(build: Build, values: BuildUpdate) {
  return build.update(values);
}

export function findActiveBuild() {
  return Build.findOne({
    where: {
      status: Status.success,
      deletedAt: null,
    },
    order: [['id', 'desc']],
    paranoid: false,
  });
}

export async function runProjectBuild(build: Build) {
  try {
    await runProjectBuildPipeline(build);

    await updateBuild(build, {
      status: Status.success,
    });
  } catch (error) {
    logger.error(error);
    await updateBuild(build, {
      status: Status.failed,
    });
    throw error;
  }
}

async function runProjectBuildPipeline(projectBuild: Build) {
  logger.debug(projectSysName);
  const pipelineContext = createPipelineContext({
    projectBuild,
    projectBuildFolderPath: temporaryApplicationBuildFolderRootPath,
    projectExportFolderPath: temporaryApplicationExportFolderRootPath,
  });

  const handlers = [
    runSetupStage,
    runFetchingStage,
    runGeneratingStage,
    runPreparingStage,
    runCompilationStage,
    runExportStage,
  ];

  await runPipeline(pipelineContext, handlers);

  logger.debug(`build pipeline is successfully finished`);
}

async function runSetupStage({ projectBuild, projectBuildFolderPath }: PipelineContext) {
  logger.debug(`build pipeline stage = setup`);

  await updateBuild(projectBuild, {
    stage: Stage.setup,
  });

  await setupApplicationFolderEnvironment(projectBuildFolderPath);
  await createBuildIdFile(projectBuild, projectBuildFolderPath);
}

async function runFetchingStage({ projectBuild }: PipelineContext) {
  logger.debug(`build pipeline stage = fetching`);

  await updateBuild(projectBuild, {
    stage: Stage.fetching,
  });

  const { project, projectPages } = await getProjectEnvironment();
  const designSystemComponentsList = await getDesignSystemComponentsList(
    project.settings.designSystemId,
  );

  return {
    project,
    projectPages,
    designSystemComponentsList,
  } as Partial<PipelineContext>;
}

async function runGeneratingStage(context: PipelineContext) {
  logger.debug(`build pipeline stage = generating`);

  await updateBuild(context.projectBuild, {
    stage: Stage.generating,
  });

  const componentsRequiringBundles = [];
  const generatedPages = [];

  for (const projectPage of context.projectPages) {
    logger.debug(
      `build pipeline generating page: id: - ${projectPage.id}, url - ${projectPage.url}`,
    );

    const page = await createPage({
      buildId: context.projectBuild.id,
      url: projectPage.url,
      stage: Stage.setup,
      status: Status.progress,
      externalId: projectPage.id,
    });

    try {
      const { pageFilePath, pageComponentName, pageComponentsList } =
        await runProjectPageGenerating(page, context);

      await updatePage(page, {
        status: Status.success,
      });

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

  await createApplicationFile({
    projectBuildFolderPath: context.projectBuildFolderPath,
    generatedPages,
  });

  return { componentsRequiringBundles, generatedPages };
}

async function runProjectPageGenerating(page: Page, context: PipelineContext) {
  await updatePage(page, {
    stage: Stage.fetching,
  });

  const pageStructure = await getProjectPage(page.externalId);

  await updatePage(page, {
    stage: Stage.generating,
  });

  const { pageComponentsList } = await parseProjectPage(
    pageStructure,
    convertToMap(context.designSystemComponentsList),
  );

  const { pageFilePath, pageComponentName } = await createApplicationPageFile({
    pageStructure,
    projectBuildFolderPath: context.projectBuildFolderPath,
    componentsList: pageComponentsList,
  });

  return { pageFilePath, pageComponentName, pageComponentsList };
}

async function runPreparingStage(context: PipelineContext) {
  logger.debug(`build pipeline stage = preparing`);

  assertPreparingStageIsReadyToRun(context);

  await updateBuild(context.projectBuild, {
    stage: Stage.preparing,
  });

  await prepareComponentsForBuild({
    projectBuildFolderPath: context.projectBuildFolderPath,
    componentsForBuild: [
      context.designSystemComponentsList.find((component) => component.name === 'foundation-kit')!,
      ...context.componentsRequiringBundles,
    ],
    project: context.project,
  });
}

async function runCompilationStage({
  projectBuild,
  projectBuildFolderPath,
  projectPages,
}: PipelineContext) {
  logger.debug(`build pipeline stage = compilation`);

  await updateBuild(projectBuild, {
    stage: Stage.compilation,
  });

  await runCompilation({
    projectBuildFolderPath,
    projectPageUrls: projectPages.map(({ url }) => url),
  });
}

async function runExportStage(context: PipelineContext) {
  logger.debug(`build pipeline stage = export`);

  assertExportStageIsReadyToRun(context);

  await runExport({
    projectBuildFolderPath: context.projectBuildFolderPath,
    projectExportFolderPath: context.projectExportFolderPath,
    projectPages: context.projectPages,
    project: context.project,
  });
}

function assertPreparingStageIsReadyToRun(
  context: PipelineContext,
): asserts context is PipelineContext & {
  project: Project;
} {
  if (!context.project) {
    throw new Error('project build has no project data');
  }

  const foundationKitComponentLike = context.designSystemComponentsList.find(
    (component) => component.name === 'foundation-kit',
  );

  if (!foundationKitComponentLike) {
    throw new Error('foundation-kit is missing in the design system components');
  }
}

function assertExportStageIsReadyToRun(
  context: PipelineContext,
): asserts context is PipelineContext & {
  project: Project;
} {
  if (!context.project) {
    throw new Error('project build has no project data');
  }
}
