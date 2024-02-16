/* istanbul ignore file */

import got from 'got';

import {
  ProjectPage,
  RawProjectPageStructure,
  StrictProjectPageStructure,
  DesignSystemComponent,
  ComponentLike,
  Project,
} from './types';
import { isTest } from '../../config';
import { designSystemMock } from '../../mocks/designSystem.mock';
import { pagesMock, projectPagesMock } from '../../mocks/pages.mock';
import { projectsMock } from '../../mocks/projects.mock';

const client = got.extend({
  timeout: {
    request: 10_000,
  },
  retry: 10,
});

export async function getProjectPages(projectSysName: string) {
  const response = isTest
    ? await client
        .get(
          `${process.env.PLATFORM_HOST}/api/sitepages/page/list?projectSysName=${projectSysName}`,
        )
        .json<{ pages: ProjectPage[] }>()
    : projectPagesMock;

  return response.pages;
  // return new Promise((resolve) => setTimeout(() => resolve(projectPagesMock), 1000));
}

export async function getProjectPageStructure(pageId: number) {
  const projectPage: RawProjectPageStructure | StrictProjectPageStructure = isTest
    ? await client.get(`${process.env.PLATFORM_HOST}/api/sitepages/page/${pageId}/result`).json()
    : await new Promise((resolve) =>
        // @ts-ignore
        setTimeout(() => resolve(pagesMock[pageId] as unknown as StrictProjectPageStructure), 1000),
      );

  if (!projectPage) {
    throw new Error(`error: ${pageId}`);
  }

  if (isStrictProjectPageStructure(projectPage)) {
    return projectPage;
  }

  return JSON.parse(projectPage.Data) as StrictProjectPageStructure;
}

export function getProjectDesignSystemComponents(
  designSystemId: number,
): Promise<DesignSystemComponent[]> {
  return isTest
    ? client
        .get(
          `${process.env.PLATFORM_HOST}/api/sitepages/components?designSystemId=${designSystemId}`,
        )
        .json()
    : new Promise((resolve) =>
        setTimeout(() => resolve(designSystemMock as unknown as DesignSystemComponent[]), 1000),
      );
}

export function getDesignSystemComponentSource(designSystemId: number, component: ComponentLike) {
  return isTest
    ? client
        .get(
          `${process.env.PLATFORM_HOST}/api/mediastorage/media-files/system/design-systems/${designSystemId}/${component.name}/${component.name}@${component.version}.js`,
        )
        .text()
    : client.get(`http://localhost:3025/api/${component.name}@${component.version}.js`).text();
}

export function getProjects(): Promise<Project[]> {
  return isTest
    ? client.get(`${process.env.PLATFORM_HOST}/api/app/project/list`).json()
    : new Promise((resolve) =>
        setTimeout(() => resolve(projectsMock as unknown as Project[]), 1000),
      );
}

function isStrictProjectPageStructure(
  projectPage: RawProjectPageStructure | StrictProjectPageStructure,
): projectPage is StrictProjectPageStructure {
  return (
    !('Data' in projectPage) &&
    Object.keys(projectPage).some((structureKey) => ['template', 'result'].includes(structureKey))
  );
}
