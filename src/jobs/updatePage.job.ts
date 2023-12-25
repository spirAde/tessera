import { Job } from 'pg-boss';

import { Page } from '../models';

export async function updatePageJob(payload: Job<{ pageId: number }>) {
  console.log(`[updatePageJob] start job for page id: ${payload.data.pageId}`);

  const page = await Page.findByPk(payload.data.pageId, {
    rejectOnEmpty: true,
  });
}
