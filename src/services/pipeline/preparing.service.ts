import { promises as fs } from 'fs';
import path from 'path';
import uniqBy from 'lodash/uniqBy';
import {
  getProjectEndpoints,
  getDesignSystemComponentSource,
  ComponentLike,
  Project,
  ProjectConfig,
} from '../../sdk/platform.sdk';

export async function prepareComponentsForBuild({
  projectBuildFolderPath,
  componentsForBuild,
  project,
}: {
  projectBuildFolderPath: string;
  componentsForBuild: ComponentLike[];
  project: Project;
}) {
  const componentsRequiringBundles = uniqBy(
    componentsForBuild,
    ({ name, version }) => `${name}@${version}`,
  );

  const [foundationKitComponent, ...components] = componentsForBuild;

  for (const componentRequiringBundle of componentsRequiringBundles) {
    const componentSourceBundle = await getDesignSystemComponentSource(
      project.settings.designSystemId,
      componentRequiringBundle,
    );

    const normalizedComponentSourceBundle = componentSourceBundle.replaceAll(
      '@vkit/foundation-kit',
      `@/components/foundation-kit@${foundationKitComponent.version}`,
    );

    await fs.writeFile(
      path.join(
        projectBuildFolderPath,
        'components',
        `${componentRequiringBundle.name}@${componentRequiringBundle.version}.js`,
      ),
      normalizedComponentSourceBundle,
    );
  }
}
