import got from 'got';

import { Page } from '../../models';
import { JobName } from '../../services/enqueueJob.service';
import { expectJobsWereEnqueued, mockEnqueue } from '../../tests/queue.mock';
import { getApplicationUrl } from '../../tests/helpers';
import { seedPage } from '../../tests/seeds/page.seed';
import { seedBuild } from '../../tests/seeds/build.seed';
import {
  Stage,
  Status,
  UpdatePageRequestBody,
  CreatePageRequestBody,
  DeletePageRequestBody,
} from '../../types';

const applicationUrl = getApplicationUrl();

describe('POST /pages', () => {
  it('works', async () => {
    mockEnqueue();

    const externalId = 1;
    const url = '/';

    const build = await seedBuild({ status: Status.success, stage: Stage.commit });

    await got
      .post<CreatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: externalId, url },
      })
      .json();

    const pages = await Page.findAll({
      where: {
        externalId,
        buildId: build.id,
      },
    });

    expect(pages.length).toEqual(0);

    expectJobsWereEnqueued([
      {
        jobName: JobName.createPage,
        body: { externalId, url, parentSpanContext: null },
      },
    ]);
  });

  it('throws error if build does not exist', async () => {
    mockEnqueue();

    await expect(
      got.post<CreatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: 1, url: '/' },
      }),
    ).rejects.toThrow();
  });
});

describe('PUT /pages', () => {
  it('works', async () => {
    mockEnqueue();

    const externalId = 1;
    const build = await seedBuild({ status: Status.success, stage: Stage.commit });
    await seedPage({ buildId: build.id, url: '/', externalId });

    await got
      .put<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: externalId },
      })
      .json();

    const pages = await Page.findAll({
      where: {
        externalId,
        buildId: build.id,
      },
    });

    expect(pages.length).toEqual(1);

    expectJobsWereEnqueued([
      {
        jobName: JobName.updatePage,
        body: { pageId: pages[0].id, parentSpanContext: null },
      },
    ]);
  });

  it('throws error if page does not exist', async () => {
    mockEnqueue();

    const externalId = 1;
    await seedBuild({ status: Status.success, stage: Stage.commit });

    await expect(
      got.put<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: externalId },
      }),
    ).rejects.toThrow();
  });

  it('throws error if build does not exist', async () => {
    mockEnqueue();

    await expect(
      got.put<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: 1 },
      }),
    ).rejects.toThrow();
  });
});

describe('DELETE /pages', () => {
  it('works', async () => {
    mockEnqueue();

    const externalId = 1;
    const build = await seedBuild({ status: Status.success, stage: Stage.commit });
    await seedPage({ buildId: build.id, url: '/', externalId });

    await got
      .delete<DeletePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: externalId },
      })
      .json();

    const pages = await Page.findAll({
      where: {
        externalId,
        buildId: build.id,
      },
    });

    expect(pages.length).toEqual(1);

    expectJobsWereEnqueued([
      {
        jobName: JobName.deletePage,
        body: { pageId: pages[0].id, parentSpanContext: null },
      },
    ]);
  });

  it('throws error if page does not exist', async () => {
    mockEnqueue();

    const externalId = 1;
    await seedBuild({ status: Status.success, stage: Stage.commit });

    await expect(
      got.delete<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: externalId },
      }),
    ).rejects.toThrow();
  });

  it('throws error if build does not exist', async () => {
    mockEnqueue();

    await expect(
      got.delete<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { id: 1 },
      }),
    ).rejects.toThrow();
  });
});
