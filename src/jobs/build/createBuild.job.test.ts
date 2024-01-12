import path from 'path';
import fs from 'fs';
import uniqBy from 'lodash/uniqBy';

import {
  nockPlatformProjects,
  nockPlatformProjectPages,
  nockPlatformDesignSystem,
  nockPlatformProjectPage,
  nockPlatformComponentSource,
} from '../../tests/nocks/platform.nock';
import {
  outputFolderPath,
  persistentApplicationExportFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../config';
import { projectT1CloudFixture } from '../../tests/fixtures/project.fixture';
import {
  pageStructureMainFixture,
  pageStructureServiceFixture,
  pageStructureAboutFixture,
  pageComponentsByPageId,
} from '../../tests/fixtures/pageStructure.fixture';
import { ComponentLike, StrictProjectPageStructure } from '../../sdk/platform.sdk';
import { createBuildJob } from './createBuild.job';

describe('createBuildJob', () => {
  it('creates build', async () => {
    nockProjectEnvironment([
      pageStructureMainFixture,
      pageStructureServiceFixture,
      pageStructureAboutFixture,
    ] as unknown as StrictProjectPageStructure[]);

    await createBuildJob({ id: '1', name: 'create-build-job', data: {} });

    expect(fs.readdirSync(outputFolderPath)).toIncludeSameMembers(['temporary', 'persistent']);

    expect(fs.readdirSync(temporaryApplicationBuildFolderRootPath)).toIncludeSameMembers([
      '.babelrc',
      'build',
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
      'about-company',
      'about-company/index.jsx',
    ]);

    expect(
      fs.readdirSync(path.join(persistentApplicationExportFolderRootPath, 'pages'), {
        recursive: true,
      }),
    ).toIncludeSameMembers([
      'index.html',
      'service',
      'service/index.html',
      'about-company',
      'about-company/index.html',
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
      'markdown-markup@1.0.1.js',
      'card-announce@1.0.4.js',
    ]);

    expect(
      fs.readFileSync(
        path.join(temporaryApplicationBuildFolderRootPath, 'application', 'application.jsx'),
        'utf-8',
      ),
    ).toIncludeMultiple([
      '<Route exact path="/" element={<Main />} />',
      '<Route exact path="/service" element={<Service />} />',
      '<Route exact path="/about-company" element={<AboutCompany />} />',
    ]);
  });
});

function nockProjectEnvironment(pages: StrictProjectPageStructure[]) {
  const components = uniqBy(
    [
      ...pages.reduce<ComponentLike[]>(
        (list, page) => [...list, ...pageComponentsByPageId[page.id]],
        [],
      ),
      { name: 'foundation-kit', version: '1.0.18' },
    ],
    'name',
  );

  nockPlatformProjects();
  nockPlatformProjectPages({
    projectSysName: projectT1CloudFixture.sysName,
    body: { pages },
  });
  nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);

  for (const page of pages) {
    nockPlatformProjectPage({ pageId: page.id, body: page });
  }

  for (const component of components) {
    nockPlatformComponentSource({
      component,
      designSystemId: projectT1CloudFixture.settings.designSystemId,
    });
  }
}
