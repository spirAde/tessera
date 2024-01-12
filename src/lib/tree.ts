import { ProjectPageStructureComponent } from '../sdk/platform.sdk';

export function traverseComponentsTree(
  node: ProjectPageStructureComponent,
  callback: (component: ProjectPageStructureComponent) => void,
) {
  if (node.result.isHidden) {
    return;
  }

  if (node.componentName) {
    callback(node);
  }

  if (Array.isArray(node.components) && node.components.length > 0) {
    node.components.forEach((childNode) => {
      traverseComponentsTree(childNode, callback);
    });
  }

  if (node.result && Array.isArray(node.result.components) && node.result.components.length > 0) {
    node.result.components.forEach((childNode) => {
      traverseComponentsTree(childNode, callback);
    });
  }
}
