import uniqBy from 'lodash/uniqBy';

import {
  ProjectPageStructureComponent,
  StrictProjectPageStructure,
  ComponentLike,
} from '../../sdk/platform/types';

export function parsePageStructureComponentsList(pageStructure: StrictProjectPageStructure) {
  const components: ProjectPageStructureComponent[] = [];

  pageStructure.template.forEach((node) => {
    traverseComponentsTree(node, (component) => components.push(component));
  });

  return uniqBy(components, 'componentName');
}

export function normalizePageComponentsVersionsGivenDesignSystem(
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

function traverseComponentsTree(
  node: ProjectPageStructureComponent,
  callback: (component: ProjectPageStructureComponent) => void,
) {
  if (node.result.isHidden) {
    return;
  }

  if (node.componentName) {
    callback(node);
  }

  traverseNodeComponents(node, callback);
}

function traverseNodeComponents(
  node: ProjectPageStructureComponent,
  callback: (component: ProjectPageStructureComponent) => void,
) {
  if (Array.isArray(node.components) && node.components.length > 0) {
    node.components.forEach((childNode) => {
      traverseComponentsTree(childNode, callback);
    });
  }

  if (Array.isArray(node.result?.components) && node.result.components.length > 0) {
    node.result.components.forEach((childNode) => {
      traverseComponentsTree(childNode, callback);
    });
  }
}
