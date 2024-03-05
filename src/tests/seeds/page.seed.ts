import { Page, PageAttributes } from '../../models';

export async function seedPage(overrides: Partial<PageAttributes> = {}) {
  const defaults = {
    url: '/',
    externalId: 1,
  };

  return Page.create({ ...defaults, ...overrides });
}
