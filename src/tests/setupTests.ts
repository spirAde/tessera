import { matchers } from 'jest-json-schema';
import nock from 'nock';
import 'jest-extended';

import { application, runTestApplication } from '../application';
import { sequelize } from '../lib/sequelize';

jest.setTimeout(10_000);
expect.extend(matchers);

beforeAll(async () => {
  await runTestApplication();
});

beforeEach(() => {
  nock.cleanAll();
  nock.disableNetConnect();
  jest.resetAllMocks();
});

afterEach(() => {
  expect(nock.pendingMocks()).toEqual([]);
});

afterAll(async () => {
  await sequelize.close();
  await application.close();
});
