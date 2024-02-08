import nock from 'nock';

import { projectT1Fixture, projectT1CloudFixture } from '../fixtures/project.fixture';
import { designSystemFixture } from '../fixtures/designSystem.fixture';
import { componentFixture } from '../fixtures/component.fixture';
import { ComponentLike, StrictProjectPageStructure } from '../../sdk/platform.sdk';

const basePath = process.env.PLATFORM_HOST ?? 'https://admin.t1-academy.ru';

export function nockPlatformProjects(status = 200, times = 1) {
  return nock(basePath)
    .get('/api/app/project/list')
    .times(times)
    .reply(status, [projectT1Fixture, projectT1CloudFixture]);
}

export function nockPlatformDesignSystem(designSystemId: number, status = 200) {
  return nock(basePath)
    .get(`/api/sitepages/components?designSystemId=${designSystemId}`)
    .reply(status, designSystemFixture);
}

export function nockPlatformProjectPages({
  projectSysName,
  status = 200,
  body,
}: {
  projectSysName: string;
  status?: number;
  body: { pages: StrictProjectPageStructure[] };
}) {
  return nock(basePath)
    .get(`/api/sitepages/page/list?projectSysName=${projectSysName}`)
    .reply(status, body);
}

export function nockPlatformProjectPage({
  pageId,
  body,
  status = 200,
}: {
  pageId: number;
  body: string | StrictProjectPageStructure;
  status?: number;
}) {
  const request = nock(basePath).get(`/api/sitepages/page/${pageId}/result`);
  return status === 200 ? request.reply(status, body) : request.replyWithError(body);
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
