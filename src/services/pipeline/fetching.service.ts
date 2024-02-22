import { logger } from '../../lib/logger';
import { getProjectDesignSystemComponents } from '../../sdk/platform/platform.sdk';
import {
  ComponentLike,
  mapDesignSystemComponentToComponentLike,
} from '../component/component.service';

export async function getDesignSystemComponentsList(
  designSystemId: number,
): Promise<ComponentLike[]> {
  logger.debug('fetch project design system');

  const designSystemComponentsList = await getProjectDesignSystemComponents(designSystemId);

  return mapDesignSystemComponentToComponentLike(designSystemComponentsList);
}
