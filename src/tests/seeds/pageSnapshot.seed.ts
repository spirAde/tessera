import { seedPage } from './page.seed';
import { seedPipeline } from './pipeline.seed';
import { PageSnapshot, PageSnapshotAttributes } from '../../models';
import { Status } from '../../types';

export async function seedPageSnapshot(overrides: Partial<PageSnapshotAttributes> = {}) {
  let { pipelineId, pageId } = overrides;

  if (!pipelineId) {
    const pipeline = await seedPipeline();
    pipelineId = pipeline.id;
  }

  if (!pageId) {
    const page = await seedPage();
    pageId = page.id;
  }

  const defaults = {
    pipelineId,
    pageId,
    status: Status.progress,
  };

  return PageSnapshot.create({ ...defaults, ...overrides });
}
