import { Job } from 'pg-boss';

import { Page } from '../../models';
import { logger } from '../../lib/logger';
import { runPageUpdate } from '../../services/page/page.service';

export async function createPageJob(payload: Job<{ pageId: number }>) {
  logger.debug(`[createPageJob] start job for page id: ${payload.data.pageId}`);

  const page = await Page.findByPk(payload.data.pageId, {
    rejectOnEmpty: true,
  });

  return runPageUpdate(page);
}
