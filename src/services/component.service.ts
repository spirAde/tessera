import { readdirSync } from 'fs-extra';
import path from 'path';
import difference from 'lodash/difference';

import { ComponentLike } from '../sdk/platform.sdk';
import { temporaryApplicationBuildFolderRootPath } from '../config';

export function getMissedComponentsList(componentsList: ComponentLike[]) {
  const currentComponentFiles = readdirSync(
    path.join(temporaryApplicationBuildFolderRootPath, 'components'),
  );

  const missedComponentFiles = difference(
    componentsList.map(({ name, version }) => `${name}@${version}.js`),
    currentComponentFiles,
  );

  return missedComponentFiles.map((componentFile) => {
    const [name, version] = componentFile.replace('.js', '').split('@');
    return { name, version };
  }) as ComponentLike[];
}
