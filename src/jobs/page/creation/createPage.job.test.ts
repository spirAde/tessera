import { readdirSync } from 'fs-extra';
import path from 'path';

import { copyPrebuildProjectFixture } from '../../../tests/helpers';
import { createPageJob } from './createPage.job';
import {
  nockPlatformComponentSource,
  nockPlatformDesignSystem,
  nockPlatformProjectPage,
  nockPlatformProjects,
} from '../../../tests/nocks/platform.nock';
import { projectT1CloudFixture } from '../../../tests/fixtures/project.fixture';
import {
  pageStructureAboutFixture,
  pageStructureMainFixture,
  pageStructureServiceCDNFixture,
  pageStructureServiceFixture,
} from '../../../tests/fixtures/pageStructure.fixture';
import { StrictProjectPageStructure } from '../../../sdk/platform.sdk';
import {
  persistentApplicationExportFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../../config';
import { seedBuild } from '../../../tests/seeds/build.seed';
import { seedPage } from '../../../tests/seeds/page.seed';
import { Stage, Status } from '../../../types';

describe('createPageJob', () => {
  beforeEach(async () => {
    await copyPrebuildProjectFixture();
  });

  it('creates new page', async () => {
    const build = await seedBuild({
      status: Status.success,
      stage: Stage.commit,
    });

    await Promise.all(
      [pageStructureMainFixture, pageStructureServiceFixture, pageStructureAboutFixture].map(
        (pageStructure) =>
          seedPage({
            buildId: build.id,
            url: pageStructure.url,
            externalId: pageStructure.id,
            status: Status.success,
            stage: Stage.commit,
          }),
      ),
    );

    nockProjectEnvironment();

    await createPageJob({
      id: '1',
      name: 'create-page-job',
      data: {
        id: pageStructureServiceCDNFixture.id,
        url: pageStructureServiceCDNFixture.url,
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
      'service/cdn',
      'service/cdn/index.jsx',
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
      'service/cdn',
      'service/cdn/index.html',
      'about-company',
      'about-company/index.html',
    ]);
  });

  it('throws error if current build does not exist', async () => {
    await expect(
      createPageJob({
        id: '1',
        name: 'create-page-job',
        data: {
          id: pageStructureServiceCDNFixture.id,
          url: pageStructureServiceCDNFixture.url,
        },
      }),
    ).rejects.toThrow();
  });
});

function nockProjectEnvironment() {
  nockPlatformProjects();
  nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);

  nockPlatformProjectPage({
    pageId: pageStructureServiceCDNFixture.id,
    body: pageStructureServiceCDNFixture as unknown as StrictProjectPageStructure,
  });

  nockPlatformComponentSource({
    component: { version: '1.0.3', name: 'card-number' },
    designSystemId: projectT1CloudFixture.settings.designSystemId,
  });
}
