const http = require('http');
const fs = require('fs');
const server = http.createServer((req, res) => {
  // Add CORS headers so web clients don't complain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/log' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => {
      fs.appendFileSync('api_logs.txt', body + '\n---\n');
      res.writeHead(200);
      res.end('ok');
    });
  } else {
    res.writeHead(200);
    res.end('ok');
  }
});
server.listen(3333, () => console.log('Logger listening on 3333'));
