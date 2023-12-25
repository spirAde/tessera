require('dotenv').config();

module.exports = {
  logging: false,
  dialect: 'postgres',
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'tessera-db',
  username: process.env.PG_USER || 'user',
  password: process.env.PG_PASSWORD || 'password',
  pool: {
    idle: 1000,
    max: 1,
    acquire: 2000,
  },
};
