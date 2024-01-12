const path = require('path');
const fs = require('fs');
const express = require('express');

const application = express();

application.use('/static', express.static(path.join(__dirname, './static')));
application.use('/favicon.ico', () => {});

application.get('*', (request, response) => {
  const filePath = path.join(
    __dirname,
    'pages',
    request.url === '/' ? 'index.html' : `${request.url}/index.html`,
  );

  response.writeHead(200);

  fs.createReadStream(filePath).pipe(response);
});

application.listen(3015, () => {
  console.log('Running on http://localhost:3015/');
});
