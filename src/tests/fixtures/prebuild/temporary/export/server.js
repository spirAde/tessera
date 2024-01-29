const path = require('path');
const fs = require('fs');
const fastify = require('fastify')();

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, './static'),
  prefix: '/static/',
});

fastify.get('*', (request, reply) => {
  if (request.url !== '/favicon.ico') {
    console.log('request', request.url);
  }

  const stream = getFileStream(request.url);

  if (!stream) {
    return reply.code(400).send();
  }

  reply.header('Content-Type', 'text/html');
  return reply.send(stream);
});

fastify.listen({ port: 3015 }, () => {
  console.log('Running on http://localhost:3015/');
});

function getFileStream(url) {
  const indexHTMLFilePath = url === '/' ? 'index.html' : `${url}/index.html`;
  const pageFilePath = path.join(__dirname, 'pages', indexHTMLFilePath);

  if (!fs.existsSync(pageFilePath)) {
    return null;
  }

  return fs.createReadStream(pageFilePath, 'utf8');
}
