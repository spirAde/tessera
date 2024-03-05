import { outputFile, pathExistsSync } from 'fs-extra';
import { globSync } from 'glob';
import uniqBy from 'lodash/uniqBy';
import path from 'path';

import { temporaryApplicationBuildFolderRootPath } from '../../config';
import { getDesignSystemComponentSource } from '../../sdk/platform/platform.sdk';
import { DesignSystemComponent } from '../../sdk/platform/types';

export type ComponentLike = {
  name: string;
  version: string;
};

export function getUniqueComponents(component: ComponentLike[]): ComponentLike[] {
  return uniqBy(component, ({ name, version }) => `${name}@${version}`);
}

export function convertComponentsToMap(
  components: ComponentLike[],
): Map<ComponentLike['name'], ComponentLike['version']> {
  return components.reduce(
    (map, component) => map.set(component.name, component.version),
    new Map<string, string>(),
  );
}

export function getSameComponentsButDifferentVersion(component: ComponentLike): ComponentLike[] {
  return globSync(`${component.name}@*.js`, {
    cwd: path.join(temporaryApplicationBuildFolderRootPath, 'components/outer'),
    ignore: convertComponentLikeToComponentFilePath(component),
  }).map((componentFilePath) => convertComponentFilePathToComponentLike(componentFilePath));
}

export async function createComponentsFiles({
  designSystemId,
  components,
  foundationKitComponent,
}: {
  designSystemId: number;
  components: ComponentLike[];
  foundationKitComponent: ComponentLike;
}): Promise<void> {
  for (const component of components) {
    await createComponentFile(designSystemId, component, (componentBundleSource) =>
      replaceFoundationKitVersion(componentBundleSource, foundationKitComponent),
    );
  }
}

export async function createComponentFile(
  designSystemId: number,
  component: ComponentLike,
  callback?: (componentBundleSource: string) => string,
): Promise<void> {
  let componentBundleSource = await getDesignSystemComponentSource(designSystemId, component);

  if (callback) {
    componentBundleSource = callback(componentBundleSource);
  }

  await outputFile(convertComponentLikeToComponentFilePath(component), componentBundleSource);
}

export function getMissedComponents(components: ComponentLike[]): ComponentLike[] {
  return components.filter(
    (component) => !pathExistsSync(convertComponentLikeToComponentFilePath(component)),
  );
}

export function mapDesignSystemComponentToComponentLike(
  designSystemComponentsList: DesignSystemComponent[],
): ComponentLike[] {
  return designSystemComponentsList.map((designSystemComponent) => ({
    name: designSystemComponent.sysName,
    version: designSystemComponent.version,
  }));
}

export function convertComponentLikeToComponentFilePath(component: ComponentLike): string {
  const componentFileName = `${component.name}@${component.version}.js`;
  return path.join(temporaryApplicationBuildFolderRootPath, 'components/outer', componentFileName);
}

function convertComponentFilePathToComponentLike(componentFilePath: string) {
  const [_, name, version] = componentFilePath.match(/(.+)@(.+).js/) ?? [];
  return { name, version };
}

function replaceFoundationKitVersion(
  componentBundleSource: string,
  foundationKitComponent: ComponentLike,
) {
  const regex = /require\(['"]((?:@[^/]+\/)?foundation-kit(?:@[^'"]+)?|[^'"]+)['"]\)/g;

  return componentBundleSource.replace(regex, (match, captured) => {
    return captured.includes('foundation-kit')
      ? `require('@/components/outer/foundation-kit@${foundationKitComponent.version}')`
      : match;
  });
}
