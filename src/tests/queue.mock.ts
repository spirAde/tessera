import * as enqueueService from '../services/enqueueJob.service';

let spyOnEnqueue: jest.SpyInstance | null = null;

export function mockEnqueue() {
  spyOnEnqueue?.mockReset();
  spyOnEnqueue = jest.spyOn(enqueueService, 'enqueue').mockImplementation(jest.fn());
}

type JobEnqueueExpect = {
  jobName: enqueueService.JobName;
  body?: unknown;
  options?: Record<string, unknown>;
};

export function expectJobsWereEnqueued(jobs: JobEnqueueExpect[]) {
  expect(getEnqueueCalls()).toIncludeAllMembers(jobs.map(prepareExpectedArgs));
}

export function expectJobsWereNotEnqueued(jobs: JobEnqueueExpect[]) {
  expect(getEnqueueCalls()).not.toIncludeAnyMembers(jobs.map(prepareExpectedArgs));
}

function getEnqueueCalls() {
  if (!spyOnEnqueue) {
    throw new Error('Call mockEnqueue() before calling expectEnqueueToBeCalledWith()');
  }

  return spyOnEnqueue.mock.calls.map((call) => {
    if (call.length === 3) {
      call.pop();
    }

    return call;
  });
}

function prepareExpectedArgs(job: JobEnqueueExpect) {
  return [job.jobName, job.body];
}
