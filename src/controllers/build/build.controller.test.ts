import axios from 'axios';

import { JobName } from '../../services/enqueueJob.service';
import { getApplicationUrl } from '../../tests/helpers';
import { expectJobsWereEnqueued, mockEnqueue } from '../../tests/queue.mock';

const applicationUrl = getApplicationUrl();

describe('POST /builds', () => {
  it('works', async () => {
    mockEnqueue();

    await axios.post(`${applicationUrl}/api/v1/builds`);

    expectJobsWereEnqueued([
      {
        jobName: JobName.createBuild,
        body: { parentSpanContext: null },
      },
    ]);
  });
});
