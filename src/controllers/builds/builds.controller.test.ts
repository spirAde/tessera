import got from 'got';

import { JobName } from '../../services/enqueueJob.service';
import { expectJobsWereEnqueued, mockEnqueue } from '../../tests/queue.mock';
import { getApplicationUrl } from '../../tests/helpers';

const applicationUrl = getApplicationUrl();

describe('POST /builds', () => {
  it('works', async () => {
    mockEnqueue();

    await got.post(`${applicationUrl}/api/v1/builds`).json();

    expectJobsWereEnqueued([
      {
        jobName: JobName.createBuild,
        body: { parentSpanContext: null },
      },
    ]);
  });
});
