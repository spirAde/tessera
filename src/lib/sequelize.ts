import cls from 'cls-hooked';
import { Sequelize, Transaction } from 'sequelize';

import { pgConnectionString } from '../config';

// Parse decimal type as number (https://github.com/sequelize/sequelize/issues/8019)
(Sequelize as any).postgres.DECIMAL.parse = parseFloat;

export const namespace = cls.createNamespace('sequelize');

export function getTransaction(): Transaction {
  return namespace.get('transaction');
}

export const sequelize = new (Sequelize.useCLS(namespace))(pgConnectionString, {
  logging: true,
  minifyAliases: true,
});
