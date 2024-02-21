import { existsSync, readdirSync, readFileSync } from 'fs-extra';
import path from 'path';

import { processPageJob } from './processPage.job';
import {
  persistentApplicationExportFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../config';
import { ProjectPageStructure } from '../../sdk/platform/types';
import { PipelineType } from '../../services/page/page.service';
import {
  pageStructureAboutFixture,
  pageStructureMainFixture,
  pageStructureServiceCDNFixture,
  pageStructureServiceFixture,
  pageStructureServiceUpdateFixture,
} from '../../tests/fixtures/pageStructure.fixture';
import { projectT1CloudFixture } from '../../tests/fixtures/project.fixture';
import { copyOutputFixture, hashFileSync } from '../../tests/helpers';
import {
  nockPlatformComponentSource,
  nockPlatformDesignSystem,
  nockPlatformProjectPage,
  nockPlatformProject,
} from '../../tests/nocks/platform.nock';
import { seedBuild } from '../../tests/seeds/build.seed';
import { seedPage } from '../../tests/seeds/page.seed';
import { Stage, Status } from '../../types';

describe('processPageJob', () => {
  beforeEach(() => {
    copyOutputFixture();
  });

  describe('create', () => {
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

      nockProjectEnvironmentForCreation();

      await processPageJob({
        id: '1',
        name: 'create-page-job',
        data: {
          type: PipelineType.create,
          externalId: pageStructureServiceCDNFixture.id,
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
        processPageJob({
          id: '1',
          name: 'create-page-job',
          data: {
            type: PipelineType.create,
            externalId: pageStructureServiceCDNFixture.id,
            url: pageStructureServiceCDNFixture.url,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
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

      nockProjectEnvironmentForUpdating();

      await processPageJob({
        id: '1',
        name: 'update-page-job',
        data: {
          type: PipelineType.update,
          externalId: updatingServicePage.externalId,
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
        processPageJob({
          id: '1',
          name: 'update-page-job',
          data: {
            type: PipelineType.update,
            externalId: 1,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('removes page', async () => {
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

      nockPlatformProject();

      await processPageJob({
        id: '1',
        name: 'delete-page-job',
        data: {
          type: PipelineType.remove,
          externalId: deletingServicePage.externalId,
        },
      });

      expect(
        readFileSync(
          path.join(temporaryApplicationBuildFolderRootPath, 'application', 'application.jsx'),
          'utf-8',
        ),
      ).toIncludeMultiple([
        '<Route exact path="/" element={<PageMain />} />',
        '<Route exact path="/about-company" element={<PageAboutCompany />} />',
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
          path.join(temporaryApplicationBuildFolderRootPath, 'build/client/pages/service.js'),
        ),
      ).toBeFalse();
      expect(
        existsSync(path.join(persistentApplicationExportFolderRootPath, 'static/pages/service.js')),
      ).toBeFalse();
    });

    it('throws error if current build does not exist', async () => {
      await expect(
        processPageJob({
          id: '1',
          name: 'delete-page-job',
          data: {
            type: PipelineType.remove,
            externalId: 1,
          },
        }),
      ).rejects.toThrow();
    });
  });
});

function nockProjectEnvironmentForCreation() {
  nockPlatformProject();
  nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);

  nockPlatformProjectPage({
    pageId: pageStructureServiceCDNFixture.id,
    body: pageStructureServiceCDNFixture as unknown as ProjectPageStructure,
  });

  nockPlatformComponentSource({
    component: { version: '1.0.3', name: 'card-number' },
    designSystemId: projectT1CloudFixture.settings.designSystemId,
  });
}

function nockProjectEnvironmentForUpdating() {
  nockPlatformProject();
  nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);

  nockPlatformProjectPage({
    pageId: pageStructureServiceUpdateFixture.id,
    body: pageStructureServiceUpdateFixture as unknown as ProjectPageStructure,
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
