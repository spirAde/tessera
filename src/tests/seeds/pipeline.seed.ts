import { Pipeline, PipelineAttributes } from '../../models';
import { Stage, Status } from '../../types';

export async function seedPipeline(overrides: Partial<PipelineAttributes> = {}) {
  const defaults = {
    jobId: '1',
    status: Status.progress,
    stage: Stage.setup,
  };

  return Pipeline.create({ ...defaults, ...overrides });
}
