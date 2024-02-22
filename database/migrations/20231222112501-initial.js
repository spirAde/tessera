module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.query(`
      CREATE EXTENSION pgcrypto;

      CREATE TYPE "stage" AS ENUM (
        'setup',
        'fetching',
        'generating',
        'preparing',
        'compilation',
        'export',
        'commit',
        'teardown'
      );
  
      CREATE TYPE "status" AS ENUM (
        'success',
        'failed',
        'progress'
      );
  
      CREATE TABLE "builds" (
        "id" SERIAL PRIMARY KEY,
  
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
  
        "stage" "stage",
        "status" "status"
      );
  
      CREATE TABLE "pages" (
        "id" SERIAL PRIMARY KEY,
  
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
  
        "buildId" INTEGER NOT NULL REFERENCES "builds" ("id") ON DELETE CASCADE,
  
        "stage" "stage",
        "status" "status",
        "url" VARCHAR NOT NULL,
        "externalId" INTEGER NOT NULL
      );
  
      CREATE INDEX ON "pages" ("buildId") WHERE ("deletedAt" IS NULL);
      
      CREATE UNIQUE INDEX ON "pages" ("buildId", "externalId") WHERE "deletedAt" IS NULL;
    `);
  },

  down: async () => {},
};
