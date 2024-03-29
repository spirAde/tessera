import axios from 'axios';

import { Page } from '../../models';
import { JobName } from '../../services/enqueueJob.service';
import { PipelineType } from '../../services/pipeline/pipeline.service';
import { getApplicationUrl } from '../../tests/helpers';
import { expectJobsWereEnqueued, mockEnqueue } from '../../tests/queue.mock';
import { seedPage } from '../../tests/seeds/page.seed';
import { UpdatePageRequestBody, CreatePageRequestBody, DeletePageRequestBody } from '../../types';

const applicationUrl = getApplicationUrl();

describe('POST /pages', () => {
  it('works', async () => {
    mockEnqueue();

    const externalId = 1;
    const url = '/';

    await axios.post<CreatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
      id: externalId,
      url,
    });

    const pages = await Page.findAll({
      where: { externalId },
    });

    expect(pages.length).toEqual(1);

    expectJobsWereEnqueued([
      {
        jobName: JobName.processPage,
        body: { pageId: pages[0].id, type: PipelineType.create, parentSpanContext: null },
      },
    ]);
  });

  it('throws error if page already exists', async () => {
    mockEnqueue();

    const externalId = 1;
    const url = '/';

    await seedPage({ externalId, url });

    await expect(
      axios.post<CreatePageRequestBody>(`${applicationUrl}/api/v1/pages`, { id: externalId, url }),
    ).rejects.toThrow();
  });
});

describe('PUT /pages', () => {
  it('works', async () => {
    mockEnqueue();

    const externalId = 1;
    await seedPage({ url: '/', externalId });

    await axios.put<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, { id: externalId });

    const pages = await Page.findAll({
      where: { externalId },
    });

    expect(pages.length).toEqual(1);

    expectJobsWereEnqueued([
      {
        jobName: JobName.processPage,
        body: { pageId: pages[0].id, type: PipelineType.update, parentSpanContext: null },
      },
    ]);
  });

  it('throws error if page does not exist', async () => {
    mockEnqueue();

    const externalId = 1;

    await expect(
      axios.put<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        id: externalId,
      }),
    ).rejects.toThrow();
  });
});

describe('DELETE /pages', () => {
  it('works', async () => {
    mockEnqueue();

    const externalId = 1;
    const page = await seedPage({ url: '/', externalId });

    await axios.delete<DeletePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
      data: {
        id: externalId,
      },
    });

    const pages = await Page.findAll({
      where: { externalId },
    });

    expect(pages.length).toEqual(0);

    expectJobsWereEnqueued([
      {
        jobName: JobName.processPage,
        body: { pageId: page.id, type: PipelineType.remove, parentSpanContext: null },
      },
    ]);
  });

  it('throws error if page does not exist', async () => {
    mockEnqueue();

    const externalId = 1;

    await expect(
      axios.delete<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        data: { id: externalId },
      }),
    ).rejects.toThrow();
  });
});
