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

  if (node.components) {
    node.components.forEach((childNode) => {
      traverseComponentsTree(childNode, callback);
    });
  }

  if (node.result && node.result.components) {
    node.result.components.forEach((childNode) => {
      traverseComponentsTree(childNode, callback);
    });
  }
}
