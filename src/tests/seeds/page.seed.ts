import { Page, PageAttributes } from '../../models';
import { Status, Stage } from '../../types';
import { seedBuild } from './build.seed';

export async function seedPage(overrides: Partial<PageAttributes> = {}) {
  let { buildId } = overrides;

  if (!buildId) {
    const build = await seedBuild();
    buildId = build.id;
  }

  const defaults = {
    buildId,
    url: '/',
    stage: null,
    status: null,
    externalId: 1,
  };

  return Page.create({ ...defaults, ...overrides });
}
