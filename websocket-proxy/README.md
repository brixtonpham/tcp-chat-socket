# WebSocket Proxy Server

A production-ready WebSocket proxy server that bridges browser clients to a C TCP chat server.

## Architecture

```
Browser (WebSocket JSON) ← → Node.js Proxy ← → C Server (TCP Binary on port 8888)
```

## Features

- **Protocol Translation**: Converts between WebSocket JSON and C server binary protocol
- **Connection Management**: Automatic reconnection with exponential backoff
- **Message Buffering**: Handles TCP stream fragmentation
- **Heartbeat**: Keep-alive mechanism every 30 seconds
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript implementation with strict mode

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Configuration options:

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_PORT` | 3000 | WebSocket server port |
| `WS_HOST` | 0.0.0.0 | WebSocket server host |
| `TCP_HOST` | localhost | C server host |
| `TCP_PORT` | 8888 | C server port |
| `HEARTBEAT_INTERVAL` | 30000 | Heartbeat interval (ms) |
| `RECONNECT_DELAY` | 5000 | Base reconnect delay (ms) |
| `MAX_RECONNECT_ATTEMPTS` | 5 | Max reconnection attempts |
| `TCP_TIMEOUT` | 60000 | TCP socket timeout (ms) |
| `LOG_LEVEL` | info | Logging level (error/warn/info/debug) |

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

## Protocol

### Message Format

**WebSocket (JSON):**
```json
{
  "type": "MSG_LOGIN",
  "data": {
    "username": "alice",
    "password": "pass123"
  }
}
```

**TCP Binary:**
- Header: 4-byte length (big-endian) + 2-byte type
- Payload: Pipe-separated or null-terminated strings

### Message Types

#### Authentication
- `MSG_REGISTER` (0x01) / `MSG_REGISTER_ACK` (0x02)
- `MSG_LOGIN` (0x03) / `MSG_LOGIN_ACK` (0x04)
- `MSG_LOGOUT` (0x05) / `MSG_LOGOUT_ACK` (0x06)

#### Friends
- `MSG_FRIEND_REQUEST` (0x20) / `MSG_FRIEND_REQUEST_ACK` (0x21)
- `MSG_FRIEND_ACCEPT` (0x22) / `MSG_FRIEND_ACCEPT_ACK` (0x23)
- `MSG_FRIEND_REJECT` (0x24) / `MSG_FRIEND_REJECT_ACK` (0x25)
- `MSG_FRIEND_REMOVE` (0x26) / `MSG_FRIEND_REMOVE_ACK` (0x27)
- `MSG_FRIEND_LIST` (0x28) / `MSG_FRIEND_LIST_RSP` (0x29)
- `MSG_FRIEND_NOTIFY` (0x2A)
- `MSG_STATUS_NOTIFY` (0x2B)

#### Chat
- `MSG_CHAT_SEND` (0x30)
- `MSG_CHAT_DELIVER` (0x31)
- `MSG_CHAT_ACK` (0x32)

#### Groups
- `MSG_GROUP_CREATE` (0x40) / `MSG_GROUP_CREATE_ACK` (0x41)
- `MSG_GROUP_INVITE` (0x42) / `MSG_GROUP_INVITE_ACK` (0x43)
- `MSG_GROUP_JOIN` (0x44) / `MSG_GROUP_JOIN_ACK` (0x45)
- `MSG_GROUP_LEAVE` (0x46) / `MSG_GROUP_LEAVE_ACK` (0x47)
- `MSG_GROUP_REMOVE_USER` (0x48) / `MSG_GROUP_REMOVE_ACK` (0x49)
- `MSG_GROUP_MSG` (0x4A) / `MSG_GROUP_MSG_DELIVER` (0x4B)
- `MSG_GROUP_LIST` (0x4C) / `MSG_GROUP_LIST_RSP` (0x4D)

#### System
- `MSG_ERROR` (0xF0)
- `MSG_HEARTBEAT` (0xFE) / `MSG_HEARTBEAT_ACK` (0xFF)

## Example: Browser Client

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
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

  if (message.type === 'MSG_LOGIN_ACK' && message.success) {
    console.log('Logged in as:', message.username);

    // Send chat message
    ws.send(JSON.stringify({
      type: 'MSG_CHAT_SEND',
      data: {
        recipientId: 2,
        content: 'Hello!'
      }
    }));
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

## Project Structure

```
websocket-proxy/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # WebSocket server
│   ├── tcpClient.ts          # TCP connection manager
│   ├── protocol/
│   │   ├── types.ts          # Message type constants
│   │   ├── encoder.ts        # JSON → Binary encoding
│   │   └── decoder.ts        # Binary → JSON decoding
│   └── utils/
│       ├── logger.ts         # Structured logging
│       └── config.ts         # Configuration management
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

The proxy handles various error scenarios:

- **TCP Connection Failures**: Automatic reconnection with exponential backoff
- **Message Parsing Errors**: Graceful error responses to clients
- **Invalid Protocols**: Validation and error messages
- **Client Disconnections**: Automatic cleanup

## Logging

Structured JSON logging with levels:
- `error`: Critical errors
- `warn`: Warning conditions
- `info`: Informational messages (default)
- `debug`: Detailed debugging information

Example log output:
```
[2025-12-15T10:30:45.123Z] [INFO] WebSocket proxy server started {"port":3000,"host":"0.0.0.0"}
[2025-12-15T10:30:50.456Z] [INFO] New WebSocket connection {"clientId":"client_1734260250456_abc123","clientIp":"::1"}
[2025-12-15T10:30:50.789Z] [DEBUG] Received WebSocket message {"clientId":"client_1734260250456_abc123","type":"MSG_LOGIN"}
```

## License

ISC
