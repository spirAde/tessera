import { pathExistsSync } from 'fs-extra';

import {
  ComponentLike,
  createComponentFile,
  createComponentsFiles,
  convertComponentLikeToComponentFilePath,
  getMissedComponents,
} from '../component/component.service';

export async function prepare({
  designSystemId,
  foundationKitComponent,
  components,
}: {
  designSystemId: number;
  foundationKitComponent: ComponentLike;
  components: ComponentLike[];
}): Promise<void> {
  // in the case when design system returned new version of the foundation-kit
  if (!pathExistsSync(convertComponentLikeToComponentFilePath(foundationKitComponent))) {
    await createComponentFile(designSystemId, foundationKitComponent);
  }

  await createComponentsFiles({
    designSystemId,
    foundationKitComponent,
    components: getMissedComponents(components),
  });
}
