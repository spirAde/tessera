import { Build } from '../../models';
import { ComponentLike, Project, ProjectPage } from '../../sdk/platform.sdk';

export interface PipelineContext {
  projectBuild: Build;
  projectBuildFolderPath: string;
  projectExportFolderPath: string;
  project: Project | null;
  projectPages: ProjectPage[];
  designSystemComponentsList: ComponentLike[];
  componentsRequiringBundles: ComponentLike[];
}
export function createPipelineContext({
  projectBuild,
  projectBuildFolderPath,
  projectExportFolderPath,
}: {
  projectBuild: Build;
  projectBuildFolderPath: string;
  projectExportFolderPath: string;
}): PipelineContext {
  return {
    projectBuild,
    projectBuildFolderPath,
    projectExportFolderPath,
    project: null,
    projectPages: [],
    designSystemComponentsList: [],
    componentsRequiringBundles: [],
  };
}

type PipelineHandler = (
  context: PipelineContext,
) => Promise<Partial<PipelineContext>> | Promise<void> | void;

export async function runPipeline(context: PipelineContext, handlers: PipelineHandler[]) {
  let pipelineContext = context;

  for (const handler of handlers) {
    const stageOutput = await handler(pipelineContext);

    if (stageOutput) {
      pipelineContext = Object.assign({}, pipelineContext, stageOutput);
    }
  }
}
