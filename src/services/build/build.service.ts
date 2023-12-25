import { Stage, Status } from '../../types';
import { Build, BuildAttributes, BuildAttributesNew } from '../../models';
import { Op } from 'sequelize';

type BuildUpdate = Partial<BuildAttributes>;

export function createBuild(values: BuildAttributesNew) {
  return Build.create(values);
}

export function updateBuild(build: Build, values: BuildUpdate) {
  return build.update(values);
}

export function findActiveBuild() {
  return Build.findOne({
    where: {
      status: Status.success,
      deletedAt: null,
    },
    order: [['id', 'desc']],
    paranoid: false,
  });
}

export async function runBuild(build: Build) {
  try {
    await updateBuild(build, {
      stage: Stage.done,
      status: Status.success,
    });
  } catch (error) {
    await updateBuild(build, {
      status: Status.failed,
    });
  } finally {
    // await removeTempNextJsFolder(projectBuildFolderPath);
  }
}
