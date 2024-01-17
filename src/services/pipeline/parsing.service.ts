import uniqBy from 'lodash/uniqBy';

import {
  ProjectPageStructureComponent,
  StrictProjectPageStructure,
  ComponentLike,
} from '../../sdk/platform.sdk';
import { traverseComponentsTree } from '../../lib/tree';

export async function parseProjectPage(
  page: StrictProjectPageStructure,
  designSystemComponentsMap: Map<string, string>,
) {
  const pageMetadata = parsePageMetadata(page);
  const pageComponentsList = normalizePageComponentsVersionsGivenDesignSystem(
    designSystemComponentsMap,
    parsePageStructureComponentsList(page),
  );

  return { pageMetadata, pageComponentsList };
}

function parsePageMetadata(pageStructure: StrictProjectPageStructure) {
  return {
    footerId: pageStructure.result?.footerId,
    pageCode: pageStructure.code,
    canonical: pageStructure.url,
    breadcrumbs: pageStructure.breadcrumbs,
    seo: pageStructure.seo?.result,
    meta: pageStructure.meta?.result?.items,
  };
}

function parsePageStructureComponentsList(pageStructure: StrictProjectPageStructure) {
  const components: ProjectPageStructureComponent[] = [];

  pageStructure.template.forEach((node) => {
    traverseComponentsTree(node, (component) => components.push(component));
  });

  return uniqBy(components, 'componentName');
}

function normalizePageComponentsVersionsGivenDesignSystem(
  designSystemComponentsMap: Map<string, string>,
  pageComponentsList: ProjectPageStructureComponent[],
): ComponentLike[] {
  return pageComponentsList.map((component) => ({
    name: component.componentName,
    version:
      designSystemComponentsMap.get(component.componentName) /* istanbul ignore next */ ??
      component.version,
  }));
}
