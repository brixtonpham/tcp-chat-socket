/**
 * Manual test script to debug WebSocket proxy communication
 */

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3000';

async function test() {
  console.log('Connecting to WebSocket proxy...');

  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('Connected to WebSocket proxy');

    // Wait a moment then send a register message
    setTimeout(() => {
      const message = {
        type: 'MSG_REGISTER',
        data: {
          username: 'testuser_' + Date.now(),
          password: 'testpass123'
        }
      };

      console.log('Sending message:', JSON.stringify(message));
      ws.send(JSON.stringify(message));
    }, 500);
  });

  ws.on('message', (data) => {
    console.log('Received message:', data.toString());
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', (code, reason) => {
    console.log('WebSocket closed:', code, reason.toString());
  });

  // Keep running for 10 seconds
  setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
    process.exit(0);
  }, 10000);
}

test();
