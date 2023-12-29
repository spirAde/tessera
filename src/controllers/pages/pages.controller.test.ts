import got from 'got';
import { application } from '../../application';
import { JobName } from '../../services/enqueueJob.service';
import { expectJobsWereEnqueued, mockEnqueue } from '../../tests/queue.mock';
import { getApplicationUrl } from '../../tests/helpers';
import { seedPage } from '../../tests/seeds/page.seed';
import { seedBuild } from '../../tests/seeds/build.seed';
import { Page } from '../../models';
import { Status, UpdatePageRequestBody } from '../../types';

describe('PUT /pages', () => {
  it('works', async () => {
    mockEnqueue();

    const url = '/';
    const build = await seedBuild({ status: Status.success });
    await seedPage({ buildId: build.id, url });

    const applicationUrl = getApplicationUrl(application.server.address()!);
    await got
      .put<UpdatePageRequestBody>(`${applicationUrl}/api/v1/pages`, {
        json: { url },
      })
      .json();

    const pages = await Page.findAll({
      where: {
        url,
        buildId: build.id,
      },
    });

    expect(pages.length).toEqual(2);

    const [newPage, oldPage] = pages;

    expect(newPage?.deletedAt).not.toBeNull();
    expect(oldPage?.deletedAt).toBeNull();

    expectJobsWereEnqueued([
      {
        jobName: JobName.updatePage,
        body: { pageId: newPage?.id },
      },
    ]);
  });
});
