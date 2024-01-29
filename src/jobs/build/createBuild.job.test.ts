import path from 'path';
import { readdirSync, readFileSync } from 'fs-extra';
import uniqBy from 'lodash/uniqBy';

import {
  nockPlatformProjects,
  nockPlatformProjectPages,
  nockPlatformDesignSystem,
  nockPlatformProjectPage,
  nockPlatformComponentSource,
} from '../../tests/nocks/platform.nock';
import { outputFolderPath, temporaryApplicationBuildFolderRootPath } from '../../config';
import { projectT1CloudFixture } from '../../tests/fixtures/project.fixture';
import {
  pageStructureMainFixture,
  pageStructureServiceFixture,
  pageStructureAboutFixture,
  pageComponentsByPageId,
} from '../../tests/fixtures/pageStructure.fixture';
import { ComponentLike, StrictProjectPageStructure } from '../../sdk/platform.sdk';
import { createBuildJob } from './createBuild.job';
import { Build } from '../../models';
import { Stage, Status } from '../../types';

describe('createBuildJob', () => {
  it('creates build', async () => {
    const pages = [
      pageStructureMainFixture,
      pageStructureServiceFixture,
      pageStructureAboutFixture,
    ] as unknown as StrictProjectPageStructure[];

    nockProjectEnvironment(pages);
    nockProjectPages(pages);
    nockProjectComponentsSources(pages);

    await createBuildJob({ id: '1', name: 'create-build-job', data: {} });

    expect(readdirSync(outputFolderPath)).toIncludeSameMembers(['temporary', 'persistent']);

    expect(readdirSync(temporaryApplicationBuildFolderRootPath)).toIncludeSameMembers([
      '.babelrc.js',
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
      readdirSync(path.join(temporaryApplicationBuildFolderRootPath, 'pages'), {
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
      readdirSync(path.join(temporaryApplicationBuildFolderRootPath, 'components')),
    ).toIncludeSameMembers([
      'Body.jsx',
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
      readFileSync(
        path.join(temporaryApplicationBuildFolderRootPath, 'application', 'application.jsx'),
        'utf-8',
      ),
    ).toIncludeMultiple([
      '<Route exact path="/" element={<Main />} />',
      '<Route exact path="/service" element={<Service />} />',
      '<Route exact path="/about-company" element={<AboutCompany />} />',
    ]);

    const builds = await Build.findAll();

    expect(builds.length).toEqual(1);
    expect(builds[0].status).toEqual(Status.success);
    expect(builds[0].stage).toEqual(Stage.commit);

    const buildPages = await builds[0].getPages();

    expect(buildPages).toIncludeSameMembers(
      [pageStructureMainFixture, pageStructureServiceFixture, pageStructureAboutFixture].map(
        (page) =>
          expect.objectContaining({
            url: page.url,
            status: Status.success,
            stage: Stage.commit,
          }),
      ),
    );
  });

  it('does not stop building if some pages throw error', async () => {
    const pages = [
      pageStructureMainFixture,
      pageStructureServiceFixture,
      pageStructureAboutFixture,
    ] as unknown as StrictProjectPageStructure[];

    nockProjectEnvironment(pages);
    nockPlatformProjectPage({
      pageId: pageStructureMainFixture.id,
      body: pageStructureMainFixture as unknown as StrictProjectPageStructure,
    });
    nockPlatformProjectPage({
      pageId: pageStructureServiceFixture.id,
      body: 'unknown error',
      status: 404,
    });
    nockPlatformProjectPage({
      pageId: pageStructureAboutFixture.id,
      body: pageStructureAboutFixture as unknown as StrictProjectPageStructure,
    });
    nockProjectComponentsSources(pages);

    await createBuildJob({ id: '1', name: 'create-build-job', data: {} });

    expect(
      readdirSync(path.join(temporaryApplicationBuildFolderRootPath, 'pages'), {
        recursive: true,
      }),
    ).toIncludeSameMembers(['index.jsx', 'about-company', 'about-company/index.jsx']);

    expect(
      readFileSync(
        path.join(temporaryApplicationBuildFolderRootPath, 'application', 'application.jsx'),
        'utf-8',
      ),
    ).toIncludeMultiple([
      '<Route exact path="/" element={<Main />} />',
      '<Route exact path="/about-company" element={<AboutCompany />} />',
    ]);

    const builds = await Build.findAll();

    expect(builds.length).toEqual(1);
    expect(builds[0].status).toEqual(Status.success);
    expect(builds[0].stage).toEqual(Stage.commit);

    const buildPages = await builds[0].getPages();

    expect(buildPages).toIncludeSameMembers([
      expect.objectContaining({
        url: pageStructureMainFixture.url,
        status: Status.success,
        stage: Stage.commit,
      }),
      expect.objectContaining({
        url: pageStructureServiceFixture.url,
        status: Status.failed,
        stage: Stage.fetching,
      }),
      expect.objectContaining({
        url: pageStructureAboutFixture.url,
        status: Status.success,
        stage: Stage.commit,
      }),
    ]);
  });
});

function nockProjectEnvironment(pages: StrictProjectPageStructure[]) {
  nockPlatformProjects();
  nockPlatformProjectPages({
    projectSysName: projectT1CloudFixture.sysName,
    body: { pages },
  });
  nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);
}

function nockProjectPages(pages: StrictProjectPageStructure[]) {
  for (const page of pages) {
    nockPlatformProjectPage({ pageId: page.id, body: page });
  }
}

function nockProjectComponentsSources(pages: StrictProjectPageStructure[]) {
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

  for (const component of components) {
    nockPlatformComponentSource({
      component,
      designSystemId: projectT1CloudFixture.settings.designSystemId,
    });
  }
}
