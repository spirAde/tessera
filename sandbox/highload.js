const got = require('got');

const baseUrl = 'http://localhost:3003';

const urls = {
  111275: '/',
  111331: '/service',
  111365: '/solutions',
  111393: '/about-company',
};

const config = [
  // { endpoint: '/api/v1/pages', method: 'post', body: { id: 111275, url: '/' }, delay: 0 },
  // {
  //   endpoint: '/api/v1/pages',
  //   method: 'post',
  //   body: { id: 111331, url: '/service' },
  //   delay: 0,
  // },
  // { endpoint: '/api/v1/pages', method: 'put', body: { id: 111506 }, delay: 0 },
  // { endpoint: '/api/v1/pages', method: 'put', body: { id: 111536 }, delay: 0 },
  //
  // {
  //   endpoint: '/api/v1/pages',
  //   method: 'post',
  //   body: { id: 111365, url: '/solutions' },
  //   delay: 0,
  // },
  // {
  //   endpoint: '/api/v1/pages',
  //   method: 'post',
  //   body: { id: 111393, url: '/about-company' },
  //   delay: 20_000,
  // },
  //
  { endpoint: '/api/v1/pages', method: 'put', body: { id: 111365 }, delay: 0 },
  // { endpoint: '/api/v1/pages', method: 'put', body: { id: 111596 }, delay: 0 },
  // { endpoint: '/api/v1/pages', method: 'put', body: { id: 111632 }, delay: 30_000 },
  //
  // { endpoint: '/api/v1/pages', method: 'delete', body: { id: 111275 }, delay: 0 },
  // { endpoint: '/api/v1/pages', method: 'delete', body: { id: 111568 }, delay: 0 },
  // { endpoint: '/api/v1/pages', method: 'delete', body: { id: 111596 }, delay: 0 },
  // { endpoint: '/api/v1/pages', method: 'delete', body: { id: 111632 }, delay: 0 },
];

function delay(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  for (const line of config) {
    try {
      console.log(`
        - endpoint: ${line.endpoint}
        - method: ${line.method}
        - url: ${urls[line.body.id]}`);
      got(`${baseUrl}${line.endpoint}`, {
        method: line.method,
        json: line.body,
      });
      await delay(line.delay ?? 1000);
    } catch (error) {
      console.log('error', error);
    }
  }
})();
