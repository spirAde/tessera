import { matchers } from 'jest-json-schema';
import nock from 'nock';
import 'jest-extended';

import { cleanupOutputFolder } from './helpers';
import { application, runTestApplication } from '../application';
import { sequelize } from '../lib/sequelize';
import { Build, Page } from '../models';
import { pgQueue } from '../services/enqueueJob.service';

jest.setTimeout(20_000);
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
  await Promise.all([Build.truncate(), Page.truncate() /*cleanupOutputFolder()*/]);
});

afterAll(async () => {
  await Promise.all([application.close(), sequelize.close(), pgQueue.stop({ graceful: true })]);
});
