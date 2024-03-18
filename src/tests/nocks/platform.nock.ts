import nock from 'nock';

import { DesignSystemComponent, ProjectPageStructure } from '../../sdk/platform/types';
import { ComponentLike } from '../../services/component/component.service';
import { componentFixture } from '../fixtures/component.fixture';
import { designSystemFixture } from '../fixtures/designSystem.fixture';
import { projectExampleProjectFixture } from '../fixtures/project.fixture';

const basePath = process.env.PLATFORM_HOST ?? 'https://admin.t1-academy.ru';
const projectSysName = process.env.PROJECT_NAME ?? 'ExampleProject';
const projectPagesStatus = process.env.PROJECT_PAGES_STATUS ?? 'published';

export function nockGetPlatformProject(status = 200, times = 1) {
  return nock(basePath)
    .get(`/api/v1/project/${projectSysName}`)
    .times(times)
    .reply(status, projectExampleProjectFixture);
}

export function nockGetPlatformDesignSystem({
  designSystemId,
  body = designSystemFixture,
  status = 200,
}: {
  designSystemId: number;
  body?: DesignSystemComponent[];
  status?: number;
}) {
  return nock(basePath)
    .get(`/api/v1/sitepages/design-system/${designSystemId}/components/list`)
    .reply(status, body);
}

export function nockGetPlatformProjectPages({
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

export function nockGetPlatformProjectPage({
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

export function nockGetPlatformComponentSource({
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

export function nockGetPageIdsUsingComponent({
  component,
  designSystemId,
  body = [],
  status = 200,
}: {
  component: ComponentLike;
  designSystemId: number;
  body?: number[];
  status?: number;
}) {
  return nock(basePath)
    .get(
      `/api/v1/sitepages/page/list-by-component?designSystemId=${designSystemId}&componentName=${component.name}`,
    )
    .reply(status, body);
}
