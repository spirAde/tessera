import nock from 'nock';

import { projectT1Fixture, projectT1CloudFixture } from '../fixtures/project.fixture';
import { designSystemFixture } from '../fixtures/designSystem.fixture';
import {
  pageMainFixture,
  pageServiceFixture,
  pageServiceCDNFixture,
} from '../fixtures/page.fixture';
import { componentFixture } from '../fixtures/component.fixture';
import { ComponentLike, StrictProjectPageStructure } from '../../sdk/platform.sdk';

const basePath = process.env.PLATFORM_HOST ?? 'https://admin.t1-academy.ru';

export function nockPlatformProjects(status = 200) {
  return nock(basePath)
    .get('/api/app/project/list')
    .reply(status, [projectT1Fixture, projectT1CloudFixture]);
}

export function nockPlatformDesignSystem(designSystemId: number, status = 200) {
  return nock(basePath)
    .get(`/api/sitepages/components?designSystemId=${designSystemId}`)
    .reply(status, designSystemFixture);
}

export function nockPlatformProjectPages(projectSysName: string, status = 200) {
  return nock(basePath)
    .get(`/api/sitepages/page/list?projectSysName=${projectSysName}`)
    .reply(status, {
      pages: [pageMainFixture, pageServiceFixture, pageServiceCDNFixture],
    });
}

export function nockPlatformProjectPage({
  pageId,
  body,
  status = 200,
}: {
  pageId: number;
  body: StrictProjectPageStructure;
  status?: number;
}) {
  return nock(basePath).get(`/api/sitepages/page/${pageId}/result`).reply(status, body);
}

export function nockPlatformComponentSource({
  component,
  designSystemId,
  status = 200,
}: {
  component: ComponentLike;
  designSystemId: number;
  status?: number;
}) {
  return nock(basePath)
    .get(
      `/api/mediastorage/media-files/system/design-systems/${designSystemId}/${component.name}/${component.name}@${component.version}.js`,
    )
    .reply(status, componentFixture);
}
