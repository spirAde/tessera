import cls from 'cls-hooked';
import { Sequelize, Transaction } from 'sequelize';

import { pgConnectionString } from '../config';

// Parse decimal type as number (https://github.com/sequelize/sequelize/issues/8019)
(Sequelize as any).postgres.DECIMAL.parse = parseFloat;

export const namespace = cls.createNamespace('sequelize');

export function getTransaction(): Transaction {
  return namespace.get('transaction');
}

export async function afterCommit(handler: () => Promise<void>): Promise<void> {
  const transaction = namespace.get('transaction');

  if (transaction) {
    transaction.afterCommit(handler);
  } else {
    await handler();
  }
}

export const sequelize = new (Sequelize.useCLS(namespace))(pgConnectionString, {
  logging: false,
  minifyAliases: true,
});
