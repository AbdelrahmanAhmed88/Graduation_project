const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  const html = fs.readFileSync('index.html');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

const wss = new WebSocket.Server({ server });

let browserClient = null;

wss.on('connection', (ws) => {
  console.log('A client connected');

  ws.on('message', (message) => {
  const text = message.toString(); // <-- Add this line

  console.log('Received:', text);

  if (['browser', 'Screen connected'].includes(text)) {
    browserClient = ws;
  }
  if (browserClient){
    browserClient.send(text)
  }
});

});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
