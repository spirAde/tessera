import { AddressInfo } from 'net';

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

export function getApplicationUrl(address: AddressInfo | string) {
  if (typeof address === 'string') {
    return address;
  }

  return `http://${address.address}:${address.port}`;
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
