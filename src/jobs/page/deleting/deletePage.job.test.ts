import { readdirSync, existsSync, readFileSync } from 'fs-extra';
import path from 'path';

import { copyPrebuildProjectFixture } from '../../../tests/helpers';
import { deletePageJob } from './deletePage.job';
import {
  pageStructureAboutFixture,
  pageStructureMainFixture,
  pageStructureServiceFixture,
} from '../../../tests/fixtures/pageStructure.fixture';
import {
  persistentApplicationExportFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { seedBuild } from '../../../tests/seeds/build.seed';
import { seedPage } from '../../../tests/seeds/page.seed';
import { Stage, Status } from '../../../types';
import { nockPlatformProjects } from '../../../tests/nocks/platform.nock';

describe('deletePageJob', () => {
  beforeEach(() => {
    copyPrebuildProjectFixture();
  });

  it('deletes page', async () => {
    const build = await seedBuild({
      status: Status.success,
      stage: Stage.commit,
    });

    await Promise.all(
      [pageStructureMainFixture, pageStructureAboutFixture].map((pageStructure) =>
        seedPage({
          buildId: build.id,
          url: pageStructure.url,
          externalId: pageStructure.id,
          status: Status.success,
          stage: Stage.commit,
        }),
      ),
    );

    const deletingServicePage = await seedPage({
      buildId: build.id,
      url: pageStructureServiceFixture.url,
      externalId: pageStructureServiceFixture.id,
      status: Status.success,
      stage: Stage.commit,
    });

    nockPlatformProjects();

    await deletePageJob({
      id: '1',
      name: 'delete-page-job',
      data: {
        pageId: deletingServicePage.id,
      },
    });

    expect(
      readFileSync(
        path.join(temporaryApplicationBuildFolderRootPath, 'application', 'application.jsx'),
        'utf-8',
      ),
    ).toIncludeMultiple([
      '<Route exact path="/" element={<Main />} />',
      '<Route exact path="/about-company" element={<AboutCompany />} />',
    ]);

    expect(
      readdirSync(path.join(temporaryApplicationBuildFolderRootPath, 'pages'), {
        recursive: true,
      }),
    ).toIncludeSameMembers(['index.jsx', 'about-company', 'about-company/index.jsx']);

    expect(
      readdirSync(path.join(persistentApplicationExportFolderRootPath, 'pages'), {
        recursive: true,
      }),
    ).toIncludeSameMembers(['index.html', 'about-company', 'about-company/index.html']);

    expect(
      existsSync(
        path.join(temporaryApplicationBuildFolderRootPath, 'build/client/pages/service.js'),
      ),
    ).toBeFalse();
    expect(
      existsSync(
        path.join(temporaryApplicationBuildFolderRootPath, 'build/client/server/service.js'),
      ),
    ).toBeFalse();
    expect(
      existsSync(path.join(persistentApplicationExportFolderRootPath, 'static/pages/service.js')),
    ).toBeFalse();
  });

  it('throws error if current build does not exist', async () => {
    await expect(
      deletePageJob({
        id: '1',
        name: 'delete-page-job',
        data: {
          pageId: 1,
        },
      }),
    ).rejects.toThrow();
  });
});
