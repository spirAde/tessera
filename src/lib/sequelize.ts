import cls from 'cls-hooked';
import { ConnectionError, ConnectionTimedOutError, Sequelize, TimeoutError } from 'sequelize';

import { pgConnectionString } from '../config';

const namespace = cls.createNamespace('sequelize');

export const sequelize = new (Sequelize.useCLS(namespace))(pgConnectionString, {
  logging: false,
  minifyAliases: true,
  retry: {
    match: [/deadlock detected/i, ConnectionError, ConnectionTimedOutError, TimeoutError],
    max: 5,
    backoffBase: 1500,
    backoffExponent: 1.5,
  },
});
