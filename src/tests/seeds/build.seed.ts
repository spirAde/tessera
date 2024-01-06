import { Build, BuildAttributes } from '../../models';
import { Stage, Status } from '../../types';

export function seedBuild(overrides: Partial<BuildAttributes> = {}) {
  const defaults = {
    stage: null,
    status: null,
  };

  return Build.create({ ...defaults, ...overrides });
}
