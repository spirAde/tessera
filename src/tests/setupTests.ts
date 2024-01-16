import { matchers } from 'jest-json-schema';
import nock from 'nock';
import 'jest-extended';

import { Build, Page } from '../models';
import { sequelize } from '../lib/sequelize';
import { application, runTestApplication } from '../application';
import { cleanupOutputFolder } from './helpers';

jest.setTimeout(10_000);
expect.extend(matchers);

beforeAll(async () => {
  await runTestApplication();
});

beforeEach(() => {
  nock.cleanAll();
  jest.resetAllMocks();
});

afterEach(async () => {
  expect(nock.pendingMocks()).toEqual([]);

  await Build.truncate();
  await Page.truncate();
  await cleanupOutputFolder();
});

afterAll(async () => {
  await application.close();
  await sequelize.close();
});
