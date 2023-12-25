export function isTest() {
  return process.env.STAGE === 'test';
}
