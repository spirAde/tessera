import { outputFile, pathExistsSync } from 'fs-extra';
import uniqBy from 'lodash/uniqBy';
import path from 'path';

import { temporaryApplicationBuildFolderRootPath } from '../../config';
import { getDesignSystemComponentSource } from '../../sdk/platform/platform.sdk';
import { ComponentLike } from '../../sdk/platform/types';

export async function createMissedComponents({
  designSystemId,
  missedComponents,
  foundationKitComponent,
}: {
  designSystemId: number;
  missedComponents: ComponentLike[];
  foundationKitComponent: ComponentLike;
}): Promise<void> {
  const componentsRequiringBundles = uniqBy(
    missedComponents,
    ({ name, version }) => `${name}@${version}`,
  );

  for (const component of componentsRequiringBundles) {
    await createComponentFile(component, designSystemId, (componentBundleSource) =>
      componentBundleSource.replaceAll(
        '@vkit/foundation-kit',
        `@/components/foundation-kit@${foundationKitComponent.version}`,
      ),
    );
  }

  if (!pathExistsSync(getComponentFilePath(foundationKitComponent))) {
    await createComponentFile(foundationKitComponent, designSystemId);
  }
}

async function createComponentFile(
  component: ComponentLike,
  designSystemId: number,
  callback?: (componentBundleSource: string) => string,
) {
  let componentBundleSource = await getDesignSystemComponentSource(designSystemId, component);

  if (callback) {
    componentBundleSource = callback(componentBundleSource);
  }

  await outputFile(getComponentFilePath(component), componentBundleSource);
}

function getComponentFilePath(component: ComponentLike) {
  const componentFileName = `${component.name}@${component.version}.js`;
  return path.join(temporaryApplicationBuildFolderRootPath, 'components', componentFileName);
}
