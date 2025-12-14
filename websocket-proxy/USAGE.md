# WebSocket Proxy Usage Guide

## Quick Start

### 1. Start the C TCP Server

First, ensure your C chat server is running on port 8888:

```bash
cd /Users/namu10x/workspace/hust/20251/network\ programming/chat_tcp_socket
./server 8888
```

### 2. Start the WebSocket Proxy

In a new terminal:

```bash
cd /Users/namu10x/workspace/hust/20251/network\ programming/chat_tcp_socket/websocket-proxy

# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm run build
npm start
```

The proxy will start on `ws://localhost:3000` by default.

### 3. Test with HTML Client

Open `test-client.html` in your browser:

```bash
open test-client.html
```

Or use any browser to open the file directly.

## Using the Test Client

### Connection Flow

1. Click **Connect** to establish WebSocket connection
2. Enter username and password
3. Click **Register** to create a new account (or **Login** if already registered)
4. You should see a `MSG_LOGIN_ACK` response with success status

### Testing Features

#### Chat Messages

1. After login, enter a recipient ID (e.g., 2)
2. Type your message in the Message field
3. Click **Send Chat**
4. Watch the log for `MSG_CHAT_ACK` acknowledgment

#### Friend Management

1. Enter a friend's username (e.g., "bob")
2. Click **Send Request** to send a friend request
3. Click **Get List** to fetch your friend list
4. Use **Accept** or **Reject** for incoming requests

#### Monitoring

The message log shows:
- **Blue border**: Sent messages (to server)
- **Green border**: Received messages (from server)
- **Red border**: Errors
- **Orange border**: Info/status messages

## Using from JavaScript

### Basic Example

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected');

  // Login
  ws.send(JSON.stringify({
    type: 'MSG_LOGIN',
    data: {
      username: 'alice',
      password: 'pass123'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);

  // Handle different message types
  switch (message.type) {
    case 'MSG_LOGIN_ACK':
      if (message.success) {
        console.log('Logged in as:', message.username);
        console.log('User ID:', message.userId);
        console.log('Token:', message.token);
      }
      break;

    case 'MSG_CHAT_DELIVER':
      console.log(`Message from ${message.senderName}: ${message.content}`);
      break;

    case 'MSG_FRIEND_NOTIFY':
      console.log(`Friend request from ${message.username}`);
      break;
  }
};
```

### Message Examples

#### Register New User

```javascript
ws.send(JSON.stringify({
  type: 'MSG_REGISTER',
  data: {
    username: 'alice',
    password: 'secret123'
  }
}));

// Response: MSG_REGISTER_ACK
// {
//   "type": "MSG_REGISTER_ACK",
//   "success": true,
//   "userId": 1,
//   "message": "Registration successful"
// }
```

#### Send Chat Message

```javascript
ws.send(JSON.stringify({
  type: 'MSG_CHAT_SEND',
  data: {
    recipientId: 2,
    content: 'Hello, how are you?'
  }
}));

// Response: MSG_CHAT_ACK
// {
//   "type": "MSG_CHAT_ACK",
//   "success": true,
//   "messageId": "12345"
// }
```

#### Get Friend List

```javascript
ws.send(JSON.stringify({
  type: 'MSG_FRIEND_LIST'
}));

// Response: MSG_FRIEND_LIST_RSP
// {
//   "type": "MSG_FRIEND_LIST_RSP",
//   "success": true,
//   "friends": [
//     { "userId": 2, "username": "bob", "status": "online" },
//     { "userId": 3, "username": "charlie", "status": "offline" }
//   ]
// }
```

#### Create Group

```javascript
ws.send(JSON.stringify({
  type: 'MSG_GROUP_CREATE',
  data: {
    groupName: 'Study Group'
  }
}));

// Response: MSG_GROUP_CREATE_ACK
// {
//   "type": "MSG_GROUP_CREATE_ACK",
//   "success": true,
//   "groupId": 10,
//   "message": "Group created"
// }
```

## Environment Configuration

Create a `.env` file in the websocket-proxy directory:

```bash
cp .env.example .env
```

Edit `.env` to customize:

```env
# WebSocket Server
WS_PORT=3000
WS_HOST=0.0.0.0

# TCP Server (C Chat Server)
TCP_HOST=localhost
TCP_PORT=8888

# Connection Settings
HEARTBEAT_INTERVAL=30000
RECONNECT_DELAY=5000
MAX_RECONNECT_ATTEMPTS=5

# Logging
LOG_LEVEL=debug  # error, warn, info, debug
```

## Production Deployment

### Using Node.js

```bash
# Build
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name websocket-proxy

# Or use node directly
node dist/index.js
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t websocket-proxy .
docker run -p 3000:3000 --env-file .env websocket-proxy
```

## Troubleshooting

### Connection Refused

**Problem**: `ECONNREFUSED` error when starting proxy

**Solution**: Ensure C server is running on port 8888:
```bash
ps aux | grep server
netstat -an | grep 8888
```

### WebSocket Connection Failed

**Problem**: Browser can't connect to WebSocket

**Solution**:
1. Check proxy is running: `ps aux | grep node`
2. Verify port 3000 is available: `lsof -i :3000`
3. Check firewall settings

### Message Not Decoded

**Problem**: Binary messages show as `rawPayload` hex

**Solution**:
1. Check C server protocol matches specification
2. Enable debug logging: `LOG_LEVEL=debug`
3. Check message type codes match between client and server

### Heartbeat Timeout

**Problem**: Connection drops after 30 seconds

**Solution**:
1. Ensure C server responds to `MSG_HEARTBEAT` with `MSG_HEARTBEAT_ACK`
2. Adjust `HEARTBEAT_INTERVAL` in `.env`

## Monitoring

### View Logs

Development mode shows all logs in console:
```bash
npm run dev
```

Production mode with structured logging:
```bash
LOG_LEVEL=info npm start
```

### Log Levels

- `error`: Critical errors only
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging information

### Example Log Output

```
[2025-12-15T10:30:45.123Z] [INFO] WebSocket proxy server started {"port":3000,"host":"0.0.0.0"}
[2025-12-15T10:30:50.456Z] [INFO] New WebSocket connection {"clientId":"client_1734260250456_abc123","clientIp":"::1"}
[2025-12-15T10:30:50.789Z] [INFO] TCP connection established for WebSocket client {"clientId":"client_1734260250456_abc123"}
[2025-12-15T10:30:51.012Z] [DEBUG] Received WebSocket message {"clientId":"client_1734260250456_abc123","type":"MSG_LOGIN"}
[2025-12-15T10:30:51.345Z] [DEBUG] Encoding message {"type":"MSG_LOGIN","typeCode":3,"data":{"username":"alice","password":"***"}}
[2025-12-15T10:30:51.678Z] [DEBUG] Received TCP data {"clientId":"client_1734260250456_abc123","bytes":45}
[2025-12-15T10:30:51.901Z] [DEBUG] Extracted message from buffer {"type":"MSG_LOGIN_ACK","typeCode":4,"length":45,"payloadLength":39}
```

## Performance Tips

1. **Connection Pooling**: Each WebSocket connection creates one TCP connection. Consider load balancing for > 1000 concurrent users.

2. **Message Batching**: For high-throughput scenarios, consider batching multiple messages.

3. **Compression**: WebSocket compression is enabled by default (perMessageDeflate).

4. **Heartbeat Tuning**: Adjust `HEARTBEAT_INTERVAL` based on network conditions (30s is typical).

## Security Considerations

1. **TLS/SSL**: For production, use `wss://` (WebSocket Secure):
   - Use a reverse proxy (nginx, HAProxy)
   - Terminate SSL at proxy level

2. **Authentication**: Tokens from `MSG_LOGIN_ACK` should be validated on subsequent requests.

3. **Rate Limiting**: Implement rate limiting at proxy level or load balancer.

4. **Input Validation**: All user inputs are validated before encoding.

## Next Steps

1. Implement authentication token validation
2. Add message persistence/queuing
3. Implement horizontal scaling with Redis pub/sub
4. Add metrics/monitoring (Prometheus, Grafana)
5. Implement request rate limiting
