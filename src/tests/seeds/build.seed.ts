import { Build, BuildAttributes } from '../../models';
import { Stage, Status } from '../../types';

export function seedBuild(overrides: Partial<BuildAttributes> = {}) {
  const defaults = {
    stage: Stage.idle,
    status: Status.idle,
  };

  return Build.create({ ...defaults, ...overrides });
}
