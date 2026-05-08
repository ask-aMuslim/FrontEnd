const request = require('http');

const req = request.request({
  hostname: 'localhost',
  port: 8000,
  path: '/api/users/aa6310336@gmail.com/threads',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});
req.end();
