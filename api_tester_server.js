const http = require('http');
const fs = require('fs');

// Clear log file on startup
fs.writeFileSync('api_test_results.json', '[]');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/test' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const results = JSON.parse(fs.readFileSync('api_test_results.json', 'utf8'));
        results.push(JSON.parse(body));
        fs.writeFileSync('api_test_results.json', JSON.stringify(results, null, 2));
      } catch (e) {
        console.error("Failed to save", e);
      }
      res.writeHead(200);
      res.end('ok');
    });
  } else {
    res.writeHead(200);
    res.end('ok');
  }
});
server.listen(3333, () => console.log('API Tester listening on 3333'));
