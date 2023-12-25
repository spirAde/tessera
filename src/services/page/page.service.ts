import { Page, PageAttributesNew, PageAttributes } from '../../models';

export function createPage(values: PageAttributesNew) {
  return Page.create(values);
}

export function updatePage(page: Page, values: PageAttributes) {
  return page.update(values);
}
