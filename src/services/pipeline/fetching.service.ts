import { logger } from '../../lib/logger';
import { getProjectDesignSystemComponents } from '../../sdk/platform/platform.sdk';
import { ComponentLike, DesignSystemComponent } from '../../sdk/platform/types';

export async function getDesignSystemComponentsList(
  designSystemId: number,
): Promise<ComponentLike[]> {
  logger.debug('fetch project design system');

  const designSystemComponentsList = await getProjectDesignSystemComponents(designSystemId);

  return mapDesignSystemComponentToComponentLike(designSystemComponentsList);
}

function mapDesignSystemComponentToComponentLike(
  designSystemComponentsList: DesignSystemComponent[],
) {
  return designSystemComponentsList.map((designSystemComponent) => ({
    name: designSystemComponent.sysName,
    version: designSystemComponent.version,
  })) as ComponentLike[];
}
