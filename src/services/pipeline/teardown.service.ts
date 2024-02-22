import uniq from 'lodash/uniq';

import { logger } from '../../lib/logger';
import { isFulfilled } from '../../lib/promise';
import { Page } from '../../models';
import { getPageIdsUsingComponent } from '../../sdk/platform/platform.sdk';
import {
  ComponentLike,
  getSameComponentsButDifferentVersion,
  getUniqueComponents,
} from '../component/component.service';
import { enqueue, JobName } from '../enqueueJob.service';

export async function teardown({
  workInProgressPage,
  designSystemId,
  components,
}: {
  workInProgressPage: Page;
  designSystemId: number;
  components: ComponentLike[];
}): Promise<void> {
  const expiredComponents = getUniqueComponents(
    components.flatMap((component) => getSameComponentsButDifferentVersion(component)),
  );

  logger.debug(
    `[teardown] found expired components: ${JSON.stringify(expiredComponents, null, 2)}`,
  );

  const affectedPageExternalIds = await getAffectedPageIdsWithExpiredComponents({
    workInProgressPage,
    expiredComponents,
    designSystemId,
  });

  if (affectedPageExternalIds.length > 0) {
    logger.debug(`[teardown] found affected pages: ${affectedPageExternalIds}`);
    await enqueue(JobName.reexportPages, {
      externalIds: affectedPageExternalIds,
      expiredComponents,
    });
  }
}

async function getAffectedPageIdsWithExpiredComponents({
  workInProgressPage,
  designSystemId,
  expiredComponents,
}: {
  workInProgressPage: Page;
  designSystemId: number;
  expiredComponents: ComponentLike[];
}) {
  const promises = expiredComponents.map((expiredComponent) =>
    getPageIdsUsingComponent(designSystemId, expiredComponent),
  );

  const tasksOutput = await Promise.allSettled(promises);

  return uniq(
    tasksOutput.reduce<number[]>(
      (externalPageIds, taskOutput) =>
        isFulfilled(taskOutput) ? [...externalPageIds, ...taskOutput.value] : externalPageIds,
      [],
    ),
  ).filter((externalPageId) => externalPageId !== workInProgressPage.externalId);
}
