import nock from 'nock';

import { ComponentLike, ProjectPageStructure } from '../../sdk/platform/types';
import { componentFixture } from '../fixtures/component.fixture';
import { designSystemFixture } from '../fixtures/designSystem.fixture';
import { projectT1CloudFixture } from '../fixtures/project.fixture';

const basePath = process.env.PLATFORM_HOST ?? 'https://admin.t1-academy.ru';
const projectSysName = process.env.PROJECT_NAME ?? 'T1Cloud';
const projectPagesStatus = process.env.PROJECT_PAGES_STATUS ?? 'published';

export function nockPlatformProject(status = 200, times = 1) {
  return nock(basePath)
    .get(`/api/v1/project/${projectSysName}`)
    .times(times)
    .reply(status, projectT1CloudFixture);
}

export function nockPlatformDesignSystem(designSystemId: number, status = 200) {
  return nock(basePath)
    .get(`/api/v1/sitepages/design-system/${designSystemId}/components/list`)
    .reply(status, designSystemFixture);
}

export function nockPlatformProjectPages({
  status = 200,
  body,
}: {
  status?: number;
  body: ProjectPageStructure[];
}) {
  return nock(basePath)
    .get(
      `/api/v1/sitepages/page/list/raw?status=${projectPagesStatus}&projectSysName=${projectSysName}`,
    )
    .reply(status, body);
}

export function nockPlatformProjectPage({
  pageId,
  body,
  status = 200,
}: {
  pageId: number;
  body: ProjectPageStructure | string;
  status?: number;
}) {
  const request = nock(basePath).get(`/api/v1/sitepages/page/${pageId}/result`);
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
      `/api/v1/mediastorage/media-files/system/design-systems/${designSystemId}/${component.name}/${component.name}@${component.version}.js`,
    )
    .reply(status, componentFixture);
}
