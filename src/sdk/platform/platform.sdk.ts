/* istanbul ignore file */

import got from 'got';

import {
  ProjectPage,
  DesignSystemComponent,
  ComponentLike,
  Project,
  ProjectPageStructure,
} from './types';
import { isTest, platformHost, projectSysName, projectPagesStatus } from '../../config';
import { designSystemMock } from '../../mocks/designSystem.mock';
import { pagesMock, projectPagesMock } from '../../mocks/pages.mock';
import { projectMock } from '../../mocks/project.mock';

const client = got.extend({
  timeout: {
    request: 10_000,
  },
  retry: 10,
});

export function getProject() {
  const project = isTest
    ? client.get(`${platformHost}/api/v1/project/${projectSysName}`).json<Project>()
    : projectMock;

  if (!project) {
    throw new Error(`fetching error for project with projectSysName = ${projectSysName}`);
  }

  return project;
}

export async function getProjectPages() {
  return isTest
    ? client
        .get(
          `${platformHost}/api/v1/sitepages/page/list/raw?status=${projectPagesStatus}&projectSysName=${projectSysName}`,
        )
        .json<ProjectPage[]>()
    : projectPagesMock;
}

export async function getProjectPageStructure(pageId: number) {
  const projectPage: ProjectPageStructure = isTest
    ? await client.get(`${platformHost}/api/v1/sitepages/page/${pageId}/result`).json()
    : await new Promise((resolve) =>
        // @ts-ignore
        setTimeout(() => resolve(pagesMock[pageId] as unknown as StrictProjectPageStructure), 1000),
      );

  if (!projectPage) {
    throw new Error(`fetching error for page from platform with id = ${pageId}`);
  }

  return projectPage;
}

export function getProjectDesignSystemComponents(
  designSystemId: number,
): Promise<DesignSystemComponent[]> {
  return isTest
    ? client
        .get(`${platformHost}/api/v1/sitepages/design-system/${designSystemId}/components/list`)
        .json()
    : new Promise((resolve) =>
        setTimeout(() => resolve(designSystemMock as unknown as DesignSystemComponent[]), 1000),
      );
}

export function getDesignSystemComponentSource(designSystemId: number, component: ComponentLike) {
  return isTest
    ? client
        .get(
          `${platformHost}/api/v1/mediastorage/media-files/system/design-systems/${designSystemId}/${component.name}/${component.name}@${component.version}.js`,
        )
        .text()
    : client.get(`http://localhost:3025/api/${component.name}@${component.version}.js`).text();
}
