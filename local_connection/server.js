const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  const html = fs.readFileSync('index.html');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let browserClient = null;
let pythonClient = null;

wss.on('connection', (ws) => {
  console.log('A client connected');

  ws.on('message', (message) => {
    const text = message.toString();
    console.log('Received:', text);

    // Identify clients based on initial message
    if (['browser', 'Screen connected'].includes(text)) {
      browserClient = ws;
      console.log('Browser client registered.');
      return;
    }

    if (text === 'python') {
      pythonClient = ws;
      console.log('Python client registered.');
      return;
    }

    // Forward messages to the other party
    if (ws === browserClient && pythonClient) {
      console.log('Forwarding message from browser to Python:', text);
      pythonClient.send(text);
    } else if (ws === pythonClient && browserClient) {
      console.log('Forwarding message from Python to browser:', text);
      browserClient.send(text);
    }
  });

  ws.on('close', () => {
    if (ws === browserClient) {
      console.log('Browser client disconnected');
      browserClient = null;
    }
    if (ws === pythonClient) {
      console.log('Python client disconnected');
      pythonClient = null;
    }
  });
});


server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
