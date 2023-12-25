module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.query(`
      CREATE EXTENSION pgcrypto;

      CREATE TYPE "stage" AS ENUM (
        'idle',
        'setup',
        'fetching',
        'generating',
        'preparing',
        'compilation',
        'export',
        'done'
      );
  
      CREATE TYPE "status" AS ENUM (
        'idle',
        'success',
        'failed',
        'progress'
      );
  
      CREATE TABLE "builds" (
        "id" SERIAL PRIMARY KEY,
  
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
  
        "stage" "stage" NOT NULL,
        "status" "status" NOT NULL
      );
  
      CREATE TABLE "pages" (
        "id" SERIAL PRIMARY KEY,
  
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
  
        "buildId" INTEGER NOT NULL REFERENCES "builds" ("id") ON DELETE CASCADE,
  
        "stage" "stage" NOT NULL,
        "status" "status" NOT NULL,
        "url" VARCHAR NOT NULL
      );
  
      CREATE INDEX ON "pages" ("buildId") WHERE ("deletedAt" IS NULL);
    `);
  },

  down: async () => {},
};
