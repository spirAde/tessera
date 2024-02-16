import { projectSysName } from '../../config';
import { logger } from '../../lib/logger';
import { getProjectDesignSystemComponents, getProjects } from '../../sdk/platform/platform.sdk';
import { ComponentLike, DesignSystemComponent } from '../../sdk/platform/types';

export async function getProject() {
  logger.debug('fetch project');
  const projects = await getProjects();
  return projects.find((project) => project.sysName === projectSysName)!;
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
