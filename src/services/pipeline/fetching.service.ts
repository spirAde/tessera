import {
  ComponentLike,
  DesignSystemComponent,
  getProjects,
  getProjectDesignSystemComponents,
  getProjectPages,
} from '../../sdk/platform.sdk';
import { logger } from '../../lib/logger';
import { projectSysName } from '../../config';

export async function getProject() {
  logger.debug('fetch project');
  const projects = await getProjects();
  const project = projects.find((project) => project.sysName === projectSysName);

  if (!project) {
    throw new Error(`can not find ${projectSysName} in the projects list`);
  }

  return project;
}

export async function getDesignSystemComponentsList(designSystemId: number) {
  logger.debug('fetch project design system');

  const designSystemComponentsList = await getProjectDesignSystemComponents(designSystemId);

  return mapDesignSystemComponentToComponentLike(designSystemComponentsList);
}

function mapDesignSystemComponentToComponentLike(
  designSystemComponentsList: DesignSystemComponent[],
) {
  return designSystemComponentsList.map((designSystemComponent) => ({
    name: designSystemComponent.componentName,
    version: designSystemComponent.currentVersion,
  })) as ComponentLike[];
}
