import { mkdir } from 'fs-extra';

import { ensureApplicationIsReadyToLaunch } from './application.service';
import { persistentApplicationExportFolderRootPath } from '../../config';
import { projectT1CloudFixture } from '../../tests/fixtures/project.fixture';
import {
  nockPlatformProject,
  nockPlatformProjectPages,
  nockPlatformDesignSystem,
  nockPlatformComponentSource,
} from '../../tests/nocks/platform.nock';
import {
  expectJobsWereEnqueued,
  expectJobsWereNotEnqueued,
  mockEnqueue,
} from '../../tests/queue.mock';
import { JobName, pgQueue } from '../enqueueJob.service';
import * as enqueueJob from '../enqueueJob.service';

describe('ensureApplicationIsReadyToLaunch', () => {
  it('waits completion of running create build job if no persistent folder and there is running job', async () => {
    nockPlatformProject();
    nockPlatformProjectPages({ body: [] });
    nockPlatformDesignSystem(projectT1CloudFixture.settings.designSystemId);
    nockPlatformComponentSource({
      component: { name: 'foundation-kit', version: '1.0.18' },
      designSystemId: projectT1CloudFixture.settings.designSystemId,
    });

    const spyOnPgQueueOnComplete = jest.spyOn(pgQueue, 'onComplete');
    const spyOnPgQueueOffComplete = jest.spyOn(pgQueue, 'offComplete');

    await pgQueue.send(JobName.createBuild, {});

    await ensureApplicationIsReadyToLaunch();

    expect(spyOnPgQueueOnComplete).toHaveBeenCalledTimes(1);
    expect(spyOnPgQueueOffComplete).toHaveBeenCalledTimes(1);
  }, 20_000);

  it('does nothing if persistent folder exists and no running create build job', async () => {
    mockEnqueue();

    await mkdir(persistentApplicationExportFolderRootPath, { recursive: true });

    await ensureApplicationIsReadyToLaunch();

    expectJobsWereNotEnqueued([
      {
        jobName: JobName.createBuild,
      },
    ]);
  });

  it('enqueues create build job if persistent folder does not exist and no running create build job', async () => {
    mockEnqueue();

    jest.spyOn(enqueueJob, 'waitJobCompletion').mockReturnValue(Promise.resolve());

    await ensureApplicationIsReadyToLaunch();

    expectJobsWereEnqueued([
      {
        jobName: JobName.createBuild,
      },
    ]);
  });
});
