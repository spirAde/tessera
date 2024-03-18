import { existsSync, readdirSync, readFileSync, writeFile } from 'fs-extra';
import path from 'path';

import { processPageJob } from './processPage.job';
import {
  persistentApplicationBuildFolderRootPath,
  persistentApplicationExportFolderRootPath,
  temporaryApplicationBuildFolderRootPath,
} from '../../config';
import { Pipeline } from '../../models';
import { ProjectPageStructure } from '../../sdk/platform/types';
import { PipelineType } from '../../services/pipeline/pipeline.service';
import {
  pageStructureAboutFixture,
  pageStructureMainFixture,
  pageStructureServiceCDNFixture,
  pageStructureServiceFixture,
  pageStructureServiceUpdateFixture,
} from '../../tests/fixtures/pageStructure.fixture';
import { projectExampleProjectFixture } from '../../tests/fixtures/project.fixture';
import { copyOutputFixture, hashFileSync } from '../../tests/helpers';
import {
  nockGetPlatformComponentSource,
  nockGetPlatformDesignSystem,
  nockGetPlatformProject,
  nockGetPlatformProjectPage,
} from '../../tests/nocks/platform.nock';
import { seedPage } from '../../tests/seeds/page.seed';
import { seedPageSnapshot } from '../../tests/seeds/pageSnapshot.seed';
import { Stage, Status } from '../../types';

describe('processPageJob', () => {
  beforeEach(() => {
    copyOutputFixture();
  });

  describe('create', () => {
    it('creates new page', async () => {
      await Promise.all(
        [pageStructureMainFixture, pageStructureServiceFixture, pageStructureAboutFixture].map(
          (pageStructure) =>
            seedPage({
              url: pageStructure.url,
              externalId: pageStructure.id,
            }),
        ),
      );

      const creatingServiceCDNPage = await seedPage({
        url: pageStructureServiceCDNFixture.url,
        externalId: pageStructureServiceCDNFixture.id,
      });

      nockGetPlatformProject();
      nockGetPlatformDesignSystem({
        designSystemId: projectExampleProjectFixture.settings.designSystemId,
      });
      nockGetPlatformProjectPage({
        pageId: pageStructureServiceCDNFixture.id,
        body: pageStructureServiceCDNFixture as unknown as ProjectPageStructure,
      });
      nockGetPlatformComponentSource({
        component: { version: '1.0.3', name: 'card-number' },
        designSystemId: projectExampleProjectFixture.settings.designSystemId,
      });

      await processPageJob({
        id: '1',
        name: 'create-page-job',
        data: {
          type: PipelineType.create,
          pageId: creatingServiceCDNPage.id,
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
            pageId: pageStructureServiceCDNFixture.id,
          },
        }),
      ).rejects.toThrow();
    });

    it('rollback', async () => {
      await writeFile(
        path.join(persistentApplicationBuildFolderRootPath, 'application/application.jsx'),
        'fake text',
      );

      await Promise.all(
        [pageStructureMainFixture, pageStructureServiceFixture, pageStructureAboutFixture].map(
          (pageStructure) =>
            seedPage({
              url: pageStructure.url,
              externalId: pageStructure.id,
            }),
        ),
      );

      const creatingServiceCDNPage = await seedPage({
        url: pageStructureServiceCDNFixture.url,
        externalId: pageStructureServiceCDNFixture.id,
      });

      nockGetPlatformProject();
      nockGetPlatformDesignSystem({
        designSystemId: projectExampleProjectFixture.settings.designSystemId,
      });
      nockGetPlatformProjectPage({
        pageId: pageStructureServiceCDNFixture.id,
        body: 'unknown error',
        status: 404,
      });

      await expect(
        processPageJob({
          id: '1',
          name: 'create-page-job',
          data: {
            type: PipelineType.create,
            pageId: creatingServiceCDNPage.id,
          },
        }),
      ).rejects.toThrow();

      const pipeline = await Pipeline.findOne({ rejectOnEmpty: true });
      expect(pipeline.status).toEqual(Status.failed);
      expect(pipeline.stage).toEqual(Stage.generating);

      const snapshots = await pipeline.getPageSnapshots({ paranoid: false });

      expect(snapshots.length).toEqual(1);
      expect(snapshots[0].status).toEqual(Status.failed);
      expect(snapshots[0].isSoftDeleted()).toBeTrue();

      const page = await snapshots[0].getPage({ paranoid: false });

      expect(page.isSoftDeleted()).toBeTrue();

      expect(
        readFileSync(
          path.join(temporaryApplicationBuildFolderRootPath, 'application/application.jsx'),
          'utf8',
        ),
      ).toEqual('fake text');
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

      await Promise.all(
        [pageStructureMainFixture, pageStructureAboutFixture].map((pageStructure) =>
          seedPage({
            url: pageStructure.url,
            externalId: pageStructure.id,
          }),
        ),
      );

      const updatingServicePage = await seedPage({
        url: pageStructureServiceFixture.url,
        externalId: pageStructureServiceFixture.id,
      });

      await seedPageSnapshot({ pageId: updatingServicePage.id, status: Status.success });

      nockGetPlatformProject();
      nockGetPlatformDesignSystem({
        designSystemId: projectExampleProjectFixture.settings.designSystemId,
      });
      nockGetPlatformProjectPage({
        pageId: pageStructureServiceUpdateFixture.id,
        body: pageStructureServiceUpdateFixture as unknown as ProjectPageStructure,
      });
      nockGetPlatformComponentSource({
        component: { version: '1.0.3', name: 'slider-case' },
        designSystemId: projectExampleProjectFixture.settings.designSystemId,
      });
      nockGetPlatformComponentSource({
        component: { version: '1.0.1', name: 'slider-case-card' },
        designSystemId: projectExampleProjectFixture.settings.designSystemId,
      });

      await processPageJob({
        id: '1',
        name: 'update-page-job',
        data: {
          type: PipelineType.update,
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
        processPageJob({
          id: '1',
          name: 'update-page-job',
          data: {
            type: PipelineType.update,
            pageId: 1,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('removes page', async () => {
      await Promise.all(
        [pageStructureMainFixture, pageStructureAboutFixture].map((pageStructure) =>
          seedPage({
            url: pageStructure.url,
            externalId: pageStructure.id,
          }),
        ),
      );

      const deletingServicePage = await seedPage({
        url: pageStructureServiceFixture.url,
        externalId: pageStructureServiceFixture.id,
      });
      await deletingServicePage.destroy();

      await seedPageSnapshot({ pageId: deletingServicePage.id, status: Status.success });

      nockGetPlatformProject();

      await processPageJob({
        id: '1',
        name: 'delete-page-job',
        data: {
          type: PipelineType.remove,
          pageId: deletingServicePage.id,
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
            pageId: 1,
          },
        }),
      ).rejects.toThrow();
    });
  });
});
