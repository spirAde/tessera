import { Job } from 'pg-boss';

import { Page } from '../models';
import { logger } from '../lib/logger';

export async function updatePageJob(payload: Job<{ pageId: number }>) {
  logger.debug(`[updatePageJob] start job for page id: ${payload.data.pageId}`);

  const page = await Page.findByPk(payload.data.pageId, {
    rejectOnEmpty: true,
  });
}
