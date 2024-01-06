import got from 'got';
import { application } from '../../application';
import { JobName } from '../../services/enqueueJob.service';
import { expectJobsWereEnqueued, mockEnqueue } from '../../tests/queue.mock';
import { getApplicationUrl } from '../../tests/helpers';
import { Build } from '../../models';

describe('POST /builds', () => {
  it('works', async () => {
    mockEnqueue();

    const applicationUrl = getApplicationUrl(application.server.address()!);
    await got.post(`${applicationUrl}/api/v1/builds`).json();

    const createdBuild = await Build.findOne({
      order: [['id', 'DESC']],
      limit: 1,
      rejectOnEmpty: true,
    });

    expectJobsWereEnqueued([
      {
        jobName: JobName.createBuild,
        body: { buildId: createdBuild.id },
      },
    ]);
  });
});
