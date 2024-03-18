import { logger } from '../../lib/logger';
import { fetchProjectDesignSystemComponents } from '../../sdk/platform/platform.sdk';
import {
  ComponentLike,
  mapDesignSystemComponentToComponentLike,
} from '../component/component.service';

export async function getDesignSystemComponentsList(
  designSystemId: number,
): Promise<ComponentLike[]> {
  logger.info('fetch project design system');

  const designSystemComponentsList = await fetchProjectDesignSystemComponents(designSystemId);

  return mapDesignSystemComponentToComponentLike(designSystemComponentsList);
}
