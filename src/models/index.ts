import { Page } from './Page.model';
import { PageSnapshot } from './PageSnapshot.model';
import { Pipeline } from './Pipeline.model';

function initAssociations() {
  Pipeline.associate();
  Page.associate();
  PageSnapshot.associate();
}

initAssociations();

export * from './Pipeline.model';
export * from './Page.model';
export * from './PageSnapshot.model';
