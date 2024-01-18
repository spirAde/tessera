import cls from 'cls-hooked';
import { Sequelize } from 'sequelize';

import { pgConnectionString } from '../config';

(Sequelize as any).postgres.DECIMAL.parse = parseFloat;

const namespace = cls.createNamespace('sequelize');

export const sequelize = new (Sequelize.useCLS(namespace))(pgConnectionString, {
  logging: false,
  minifyAliases: true,
});
