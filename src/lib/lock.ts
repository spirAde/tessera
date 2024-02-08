import Sequelize from 'sequelize';
import { Literal } from 'sequelize/types/utils';

import { logger } from './logger';
import { sequelize } from './sequelize';

export async function advisoryLock(key: string): Promise<void> {
  logger.debug(`[advisoryLock] lock requested: ${key}`);
  await sequelize.query(`SELECT ${advisoryLockLiteral(Sequelize.literal('$key')).val}`, {
    bind: { key },
  });
  logger.debug(`[advisoryLock] lock acquired: ${key}`);
}

export async function advisoryUnlock(key: string): Promise<void> {
  logger.debug(`[advisoryUnlock] unlock requested: ${key}`);
  await sequelize.query(`SELECT ${advisoryUnlockLiteral(Sequelize.literal('$key')).val}`, {
    bind: { key },
  });
  logger.debug(`[advisoryUnlock] unlock successful: ${key}`);
}

function advisoryLockLiteral(key: Literal): Literal {
  return Sequelize.literal(`pg_advisory_lock(('X' || md5(${key.val}))::bit(64)::bigint)`);
}

function advisoryUnlockLiteral(key: Literal): Literal {
  return Sequelize.literal(`pg_advisory_unlock(('X' || md5(${key.val}))::bit(64)::bigint)`);
}
