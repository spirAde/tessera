import { outputFile, pathExistsSync } from 'fs-extra';
import path from 'path';
import uniqBy from 'lodash/uniqBy';

import { ComponentLike, getDesignSystemComponentSource, Project } from '../../sdk/platform.sdk';
import { temporaryApplicationBuildFolderRootPath } from '../../config';

export async function collectMissedComponents({
  project,
  missedComponents,
  foundationKitComponent,
}: {
  project: Project;
  missedComponents: ComponentLike[];
  foundationKitComponent: ComponentLike;
}) {
  const componentsRequiringBundles = uniqBy(
    missedComponents,
    ({ name, version }) => `${name}@${version}`,
  );

  for (const component of componentsRequiringBundles) {
    const componentSourceBundle = await getDesignSystemComponentSource(
      project.settings.designSystemId,
      component,
    );

    const normalizedComponentSourceBundle = componentSourceBundle.replaceAll(
      '@vkit/foundation-kit',
      `@/components/foundation-kit@${foundationKitComponent.version}`,
    );

    const componentFilePath = path.join(
      temporaryApplicationBuildFolderRootPath,
      'components',
      `${component.name}@${component.version}.js`,
    );

    await outputFile(componentFilePath, normalizedComponentSourceBundle);
  }

  const foundationComponentKitFilePath = path.join(
    temporaryApplicationBuildFolderRootPath,
    'components',
    `${foundationKitComponent.name}@${foundationKitComponent.version}.js`,
  );

  if (!pathExistsSync(foundationComponentKitFilePath)) {
    const componentSourceBundle = await getDesignSystemComponentSource(
      project.settings.designSystemId,
      foundationKitComponent,
    );

    await outputFile(foundationComponentKitFilePath, componentSourceBundle);
  }
}
