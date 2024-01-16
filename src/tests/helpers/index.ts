import { copy, remove } from 'fs-extra';
import { readFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

import { outputFolderPath, rootFolderPath } from '../../config';

interface TestResponse {
  statusCode: number;
  headers?: {
    [header: string]: boolean | number | string;
  };
  body: any;
}

export function fakeDbId() {
  const maxPostgresInt = 2147483647;
  return Math.floor(Math.random() * maxPostgresInt + 1);
}

export function getApplicationUrl() {
  return `http://${process.env.HOST}:${process.env.PORT}`;
}

export function expectForbidden(response: TestResponse) {
  getExpectToMatchObjectFn(response, { statusCode: 403 });
}

export function expectUnauthorized(response: TestResponse) {
  getExpectToMatchObjectFn(response, { statusCode: 401 });
}

export function expectNotFound(response: TestResponse) {
  getExpectToMatchObjectFn(response, { statusCode: 404 });
}

export function expectValidationError(response: TestResponse, message: string) {
  getExpectToMatchObjectFn(response, { statusCode: 422, body: { message } });
}

export function expectError(response: TestResponse, statusCode: number, message: string) {
  getExpectToMatchObjectFn(response, { statusCode, body: { message } });
}

export function expectFileSystemObjectExist() {}

function getExpectToMatchObjectFn(actual: any, expected: any) {
  return expect(actual).toMatchObject(expected);
}

export async function copyPrebuildProjectFixture() {
  await copy(path.join(rootFolderPath, 'src/tests/fixtures/prebuild'), outputFolderPath);
}

export async function cleanupOutputFolder() {
  await remove(outputFolderPath);
}

export function hashFileSync(filePath: string) {
  const fileContent = readFileSync(filePath);
  const hash = crypto.createHash('sha256');
  return hash.update(fileContent).digest('hex');
}
