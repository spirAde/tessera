import { readdirSync } from 'fs-extra';
import path from 'path';

import { updatePageJob } from './updatePage.job';
import {
  nockPlatformProjects,
  nockPlatformDesignSystem,
  nockPlatformProjectPage,
  nockPlatformComponentSource,
} from '../../../tests/nocks/platform.nock';
import { projectT1CloudFixture } from '../../../tests/fixtures/project.fixture';
import {
  pageStructureAboutFixture,
  pageStructureMainFixture,
  pageStructureServiceFixture,
  pageStructureServiceUpdateFixture,
} from '../../../tests/fixtures/pageStructure.fixture';
import { StrictProjectPageStructure } from '../../../sdk/platform.sdk';
import {
  persistentApplicationExportFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { copyPrebuildProjectFixture, hashFileSync } from '../../../tests/helpers';
import { seedBuild } from '../../../tests/seeds/build.seed';
import { Stage, Status } from '../../../types';
import { seedPage } from '../../../tests/seeds/page.seed';

describe('updatePageJob', () => {
  beforeEach(() => {
    copyPrebuildProjectFixture();
  });

  it('updates existing page', async () => {
    const mainPageHtmlHash = hashFileSync(
      path.join(persistentApplicationExportFolderRootPath, 'pages/index.html'),
    );
    const servicePageHtmlHash = hashFileSync(
      path.join(persistentApplicationExportFolderRootPath, 'pages/service/index.html'),
    );
    const aboutCompanyPageHtmlHash = hashFileSync(
      path.join(persistentApplicationExportFolderRootPath, 'pages/about-company/index.html'),
    );

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

    const updatingServicePage = await seedPage({
      buildId: build.id,
      url: pageStructureServiceFixture.url,
      externalId: pageStructureServiceFixture.id,
      status: Status.success,
      stage: Stage.commit,
    });

    nockProjectEnvironment();

    await updatePageJob({
      id: '1',
      name: 'update-page-job',
      data: {
        pageId: updatingServicePage.id,
      },
    });

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
      readdirSync(path.join(persistentApplicationExportFolderRootPath, 'pages'), {
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
      hashFileSync(path.join(persistentApplicationExportFolderRootPath, 'pages/index.html')),
    ).not.toEqual(mainPageHtmlHash);

    expect(
      hashFileSync(
        path.join(persistentApplicationExportFolderRootPath, 'pages/about-company/index.html'),
      ),
    ).not.toEqual(aboutCompanyPageHtmlHash);

    expect(
      hashFileSync(
        path.join(persistentApplicationExportFolderRootPath, 'pages/service/index.html'),
      ),
    ).not.toEqual(servicePageHtmlHash);
  });

  it('throws error if current build does not exist', async () => {
    await expect(
      updatePageJob({
        id: '1',
        name: 'update-page-job',
        data: {
          pageId: 1,
        },
      }),
    ).rejects.toThrow();
  });
});

function nockProjectEnvironment() {
  nockPlatformProjects();
  nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);

  nockPlatformProjectPage({
    pageId: pageStructureServiceUpdateFixture.id,
    body: pageStructureServiceUpdateFixture as unknown as StrictProjectPageStructure,
  });

  nockPlatformComponentSource({
    component: { version: '1.0.3', name: 'slider-case' },
    designSystemId: projectT1CloudFixture.settings.designSystemId,
  });
  nockPlatformComponentSource({
    component: { version: '1.0.1', name: 'slider-case-card' },
    designSystemId: projectT1CloudFixture.settings.designSystemId,
  });
}
