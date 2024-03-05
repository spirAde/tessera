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
  
      CREATE TABLE "pipelines" (
        "id" SERIAL PRIMARY KEY,
  
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
  
        "jobId" VARCHAR NOT NULL,
        "stage" "stage" NOT NULL,
        "status" "status" NOT NULL
      );
  
      CREATE TABLE "pages" (
        "id" SERIAL PRIMARY KEY,
        
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        
        "url" VARCHAR NOT NULL,
        "externalId" INTEGER NOT NULL
      );

      CREATE TABLE "pageSnapshots" (
        "id" SERIAL PRIMARY KEY,
  
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
  
        "pipelineId" INTEGER NOT NULL REFERENCES "pipelines" ("id") ON DELETE CASCADE,
        "pageId" INTEGER NOT NULL REFERENCES "pages" ("id"),
  
        "status" "status" NOT NULL
      );
  
      CREATE INDEX ON "pageSnapshots" ("pipelineId") WHERE ("deletedAt" IS NULL);
      CREATE INDEX ON "pageSnapshots" ("pageId") WHERE ("deletedAt" IS NULL);
      
      CREATE UNIQUE INDEX ON "pageSnapshots" ("pipelineId", "pageId") WHERE "deletedAt" IS NULL;
    `);
  },

  down: async () => {},
};
