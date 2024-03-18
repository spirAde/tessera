import uniq from 'lodash/uniq';

import { logger } from '../../lib/logger';
import { isFulfilled } from '../../lib/promise';
import { PageSnapshot } from '../../models';
import { fetchPageIdsUsingComponent } from '../../sdk/platform/platform.sdk';
import {
  ComponentLike,
  getSameComponentsButDifferentVersion,
  getUniqueComponents,
} from '../component/component.service';
import { enqueue, JobName } from '../enqueueJob.service';

export async function teardown({
  snapshot,
  designSystemId,
  components,
}: {
  snapshot: EagerLoaded<PageSnapshot, 'page'>;
  designSystemId: number;
  components: ComponentLike[];
}): Promise<void> {
  const expiredComponents = getUniqueComponents(
    components.flatMap((component) => getSameComponentsButDifferentVersion(component)),
  );

  logger.debug(expiredComponents, '[teardown] found expired components');

  const affectedPageExternalIds = await getAffectedPageIdsWithExpiredComponents({
    excludeExternalIds: [snapshot.page.externalId],
    expiredComponents,
    designSystemId,
  });

  if (affectedPageExternalIds.length > 0) {
    logger.debug(affectedPageExternalIds, '[teardown] found affected pages}');
    await enqueue(JobName.reexportPages, {
      externalIds: affectedPageExternalIds,
      expiredComponents,
    });
  }
}

async function getAffectedPageIdsWithExpiredComponents({
  excludeExternalIds,
  designSystemId,
  expiredComponents,
}: {
  excludeExternalIds: number[];
  designSystemId: number;
  expiredComponents: ComponentLike[];
}) {
  const promises = expiredComponents.map((expiredComponent) =>
    fetchPageIdsUsingComponent(designSystemId, expiredComponent),
  );

  const tasksOutput = await Promise.allSettled(promises);

  return uniq(
    tasksOutput.reduce<number[]>(
      (externalPageIds, taskOutput) =>
        isFulfilled(taskOutput) ? [...externalPageIds, ...taskOutput.value] : externalPageIds,
      [],
    ),
  ).filter((externalPageId) => !excludeExternalIds.includes(externalPageId));
}
