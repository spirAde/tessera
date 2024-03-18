import { readdirSync, readFileSync } from 'fs-extra';
import uniqBy from 'lodash/uniqBy';
import path from 'path';

import { createBuildJob } from './createBuild.job';
import { outputFolderPath, temporaryApplicationBuildFolderRootPath } from '../../config';
import { Pipeline } from '../../models';
import { ProjectPageStructure } from '../../sdk/platform/types';
import { ComponentLike } from '../../services/component/component.service';
import {
  pageStructureMainFixture,
  pageStructureServiceFixture,
  pageStructureAboutFixture,
  pageComponentsByPageId,
} from '../../tests/fixtures/pageStructure.fixture';
import { projectExampleProjectFixture } from '../../tests/fixtures/project.fixture';
import {
  nockGetPlatformProject,
  nockGetPlatformProjectPages,
  nockGetPlatformDesignSystem,
  nockGetPlatformProjectPage,
  nockGetPlatformComponentSource,
} from '../../tests/nocks/platform.nock';
import { Stage, Status } from '../../types';

jest.mock('../../config');

const config: { useS3BucketForStatic: number; useWorkerThreadsProcessing: number } =
  jest.requireActual('../../config');

config.useS3BucketForStatic = 0;
config.useWorkerThreadsProcessing = 0;

describe('createBuildJob', () => {
  it('creates build', async () => {
    const pages = [
      pageStructureMainFixture,
      pageStructureServiceFixture,
      pageStructureAboutFixture,
    ] as unknown as ProjectPageStructure[];

    nockGetPlatformProject();
    nockGetPlatformProjectPages({ body: pages });
    nockGetPlatformDesignSystem({
      designSystemId: projectExampleProjectFixture.settings.designSystemId,
    });
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
      readdirSync(path.join(temporaryApplicationBuildFolderRootPath, 'components/outer')),
    ).toIncludeSameMembers([
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
      '<Route exact path="/" element={<PageMain />} />',
      '<Route exact path="/service" element={<PageService />} />',
      '<Route exact path="/about-company" element={<PageAboutCompany />} />',
    ]);

    const pipelines = await Pipeline.findAll();

    expect(pipelines.length).toEqual(1);
    expect(pipelines[0].status).toEqual(Status.success);
    expect(pipelines[0].stage).toEqual(Stage.commit);

    const snapshots = await pipelines[0].getPageSnapshots();

    expect(snapshots).toIncludeSameMembers(
      [pageStructureMainFixture, pageStructureServiceFixture, pageStructureAboutFixture].map(() =>
        expect.objectContaining({
          status: Status.success,
        }),
      ),
    );
  });

  it('does not stop building if some pages throw error', async () => {
    const pages = [
      pageStructureMainFixture,
      pageStructureServiceFixture,
      pageStructureAboutFixture,
    ] as unknown as ProjectPageStructure[];

    nockGetPlatformProject();
    nockGetPlatformProjectPages({ body: pages });
    nockGetPlatformDesignSystem({
      designSystemId: projectExampleProjectFixture.settings.designSystemId,
    });
    nockGetPlatformProjectPage({
      pageId: pageStructureMainFixture.id,
      body: pageStructureMainFixture as unknown as ProjectPageStructure,
    });
    nockGetPlatformProjectPage({
      pageId: pageStructureServiceFixture.id,
      body: 'unknown error',
      status: 404,
    });
    nockGetPlatformProjectPage({
      pageId: pageStructureAboutFixture.id,
      body: pageStructureAboutFixture as unknown as ProjectPageStructure,
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
      '<Route exact path="/" element={<PageMain />} />',
      '<Route exact path="/about-company" element={<PageAboutCompany />} />',
    ]);

    const pipelines = await Pipeline.findAll();

    expect(pipelines.length).toEqual(1);
    expect(pipelines[0].status).toEqual(Status.success);
    expect(pipelines[0].stage).toEqual(Stage.commit);

    const snapshots = await pipelines[0].getPageSnapshots();

    expect(snapshots).toIncludeSameMembers([
      expect.objectContaining({
        status: Status.success,
      }),
      expect.objectContaining({
        status: Status.failed,
      }),
      expect.objectContaining({
        status: Status.success,
      }),
    ]);
  });

  it('throws error if foundation kit is missed', async () => {
    nockGetPlatformProject();
    nockGetPlatformProjectPages({ body: [] });
    nockGetPlatformDesignSystem({
      designSystemId: projectExampleProjectFixture.settings.designSystemId,
      body: [],
    });

    await expect(createBuildJob({ id: '1', name: 'create-build-job', data: {} })).rejects.toThrow(
      'missed foundation kit component',
    );
  });
});

function nockProjectPages(pages: ProjectPageStructure[]) {
  for (const page of pages) {
    nockGetPlatformProjectPage({ pageId: page.id, body: page });
  }
}

function nockProjectComponentsSources(pages: ProjectPageStructure[]) {
  const components = [
    ...uniqBy(
      pages.reduce<ComponentLike[]>(
        (list, page) => [...list, ...pageComponentsByPageId[page.id]],
        [],
      ),
      'name',
    ),
    { name: 'foundation-kit', version: '1.0.18' },
  ];

  for (const component of components) {
    nockGetPlatformComponentSource({
      component,
      designSystemId: projectExampleProjectFixture.settings.designSystemId,
    });
  }
}
