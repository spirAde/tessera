import { Build } from './Build.model';
import { Page } from './Page.model';

function initAssociations() {
  Build.hasMany(Page);
  Page.belongsTo(Build);
}

initAssociations();

export * from './Build.model';
export * from './Page.model';
