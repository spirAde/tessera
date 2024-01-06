import path from 'path';
import fs from 'fs';

import {
  nockPlatformProjects,
  nockPlatformProjectPages,
  nockPlatformDesignSystem,
  nockPlatformProjectPage,
  nockPlatformComponentSource,
} from '../../tests/nocks/platform.nock';
import {
  outputFolderPath,
  temporaryApplicationBuildFolderRootPath,
  temporaryApplicationExportFolderRootPath,
} from '../../config';
import { projectT1CloudFixture } from '../../tests/fixtures/project.fixture';
import {
  pageStructureMainFixture,
  pageStructureServiceFixture,
  pageStructureServiceCDNFixture,
} from '../../tests/fixtures/pageStructure.fixture';
import { StrictProjectPageStructure } from '../../sdk/platform.sdk';
import { createBuildJob } from './createBuild.job';
import { designSystemFixture } from '../../tests/fixtures/designSystem.fixture';

describe('createBuildJob', () => {
  it('creates build', async () => {
    nockProjectEnvironment();

    await createBuildJob({ id: '1', name: 'create-build-job', data: {} });

    expect(fs.readdirSync(outputFolderPath)).toIncludeSameMembers(['temporary', 'persistent']);

    expect(fs.readdirSync(temporaryApplicationBuildFolderRootPath)).toIncludeSameMembers([
      '.babelrc',
      'build',
      'BUILD_ID',
      'application',
      'cache',
      'contexts',
      'components',
      'pages',
      'public',
      'server.js',
    ]);

    expect(
      fs.readdirSync(path.join(temporaryApplicationBuildFolderRootPath, 'pages'), {
        recursive: true,
      }),
    ).toIncludeSameMembers([
      'index.jsx',
      'service',
      'service/index.jsx',
      'service/cdn',
      'service/cdn/index.jsx',
    ]);

    expect(
      fs.readdirSync(path.join(temporaryApplicationBuildFolderRootPath, 'components')),
    ).toIncludeSameMembers([
      'Body.jsx',
      'PlatformProvider.jsx',
      'banner-bubble@1.0.7.js',
      'banner-head@1.0.5.js',
      'card-solution@1.0.6.js',
      'footer@1.0.2.js',
      'foundation-kit@1.0.18.js',
      'header@1.0.3.js',
      'layout-card@1.0.3.js',
      'section@1.0.5.js',
      'section-header@1.0.2.js',
    ]);

    expect(
      fs.readFileSync(
        path.join(temporaryApplicationBuildFolderRootPath, 'application', 'application.jsx'),
        'utf-8',
      ),
    ).toIncludeMultiple([
      '<Route exact path="/" element={<Main />} />',
      '<Route exact path="/service" element={<Service />} />',
      '<Route exact path="/service/cdn" element={<Cdn />} />',
    ]);
  });
});

function nockProjectEnvironment() {
  nockPlatformProjects();
  nockPlatformProjectPages(projectT1CloudFixture.sysName);
  nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);

  nockPlatformProjectPage({
    pageId: 1,
    body: pageStructureMainFixture as unknown as StrictProjectPageStructure,
  });
  nockPlatformProjectPage({
    pageId: 2,
    body: pageStructureServiceFixture as unknown as StrictProjectPageStructure,
  });
  nockPlatformProjectPage({
    pageId: 3,
    body: pageStructureServiceCDNFixture as unknown as StrictProjectPageStructure,
  });

  for (const component of designSystemFixture) {
    nockPlatformComponentSource({
      component: {
        name: component.componentName,
        version: component.currentVersion,
      },
      designSystemId: projectT1CloudFixture.settings.designSystemId,
    });
  }
}
