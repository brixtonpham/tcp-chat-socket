# TCP Chat Application - UI Implementation Plan

## Executive Summary

Comprehensive plan for adding modern UI to existing C-based TCP chat socket application. Current system uses pure C with POSIX sockets, select() I/O multiplexing, and custom binary protocol (6-byte header). Application includes full chat features: auth, friends, DM, groups, offline messages, status notifications.

---

## 1. Technology Stack Analysis

### 1.1 Web-Based UI (Recommended Primary Option)

**Stack:** React/Vue.js + WebSocket Bridge + Node.js Proxy

**Architecture:**
```
Browser (React/Vue) <--WebSocket--> Node.js Proxy <--TCP Binary Protocol--> C Server (Port 8888)
```

**Pros:**
- Cross-platform (works on any device with browser)
- Rich UI libraries (Material-UI, Tailwind CSS, shadcn/ui)
- Easy deployment (host static files anywhere)
- Best developer experience (hot reload, debugging)
- Large community and resources
- Progressive Web App (PWA) support for mobile-like experience
- No installation required for end users

**Cons:**
- Requires WebSocket proxy layer (adds complexity)
- Protocol translation overhead
- Cannot directly use binary TCP protocol from browser
- Network latency through proxy

**Implementation Complexity:** Medium
**Time Estimate:** 3-4 weeks full implementation

---

### 1.2 Desktop GUI - Electron (Web Tech + Native)

**Stack:** Electron + React/Vue + Node.js TCP Client

**Architecture:**
```
Electron App [Renderer: React/Vue | Main: Node.js TCP Client] <--TCP--> C Server
```

**Pros:**
- Native application packaging (Windows, macOS, Linux)
- Can use Node.js net module for direct TCP connection
- No proxy needed - direct binary protocol implementation
- Offline capabilities
- System tray integration
- Auto-updates support
- Web technologies with native benefits

**Cons:**
- Large binary size (~100-200MB)
- Higher memory usage
- Requires installation
- More complex build/distribution pipeline

**Implementation Complexity:** Medium-High
**Time Estimate:** 4-5 weeks full implementation

---

### 1.3 Desktop GUI - Qt (Native C++)

**Stack:** Qt 6 (C++ or Python bindings) + Direct TCP

**Architecture:**
```
Qt Application (C++/Python) <--TCP Binary Protocol--> C Server
```

**Pros:**
- Native performance and appearance
- Direct TCP socket support (QTcpSocket)
- Can directly implement binary protocol
- Small binary size (~10-30MB)
- Low memory footprint
- Excellent for desktop applications
- Cross-platform (Windows, macOS, Linux)
- Professional appearance

**Cons:**
- Steeper learning curve (C++ or PyQt)
- Less modern UI components compared to web
- Slower development for complex UIs
- Limited community compared to web frameworks
- Requires Qt installation or static linking

**Implementation Complexity:** High
**Time Estimate:** 5-6 weeks full implementation

---

### 1.4 Cross-Platform Mobile - Flutter

**Stack:** Flutter (Dart) + Socket Package

**Architecture:**
```
Flutter App (Dart) <--TCP Sockets--> C Server
```

**Pros:**
- Single codebase for iOS, Android, Desktop, Web
- Beautiful, modern UI out of the box
- Native performance
- Direct TCP socket support (dart:io)
- Hot reload for fast development
- Growing ecosystem
- Good for mobile-first approach

**Cons:**
- Dart language learning curve
- Larger app size than native
- Less mature desktop support
- Binary protocol implementation in Dart
- Mobile-focused (desktop is secondary)

**Implementation Complexity:** Medium-High
**Time Estimate:** 4-6 weeks full implementation

---

### 1.5 Enhanced Terminal UI - ncurses/TUI

**Stack:** C with ncurses or Rust with tui-rs

**Architecture:**
```
Terminal App (ncurses/tui) <--Existing TCP Client--> C Server
```

**Pros:**
- Minimal changes to existing codebase
- Works over SSH/remote connections
- Very lightweight
- Fast implementation
- No dependencies beyond ncurses
- Professional sysadmin-like experience
- Can reuse existing C client code

**Cons:**
- Limited UI capabilities
- No images/rich media
- Terminal-only
- Steeper learning curve for ncurses
- Less modern appearance
- Limited accessibility features

**Implementation Complexity:** Low-Medium
**Time Estimate:** 1-2 weeks full implementation

---

## 2. Recommended Implementation Strategy

### Phase 1: WebSocket Bridge + Basic Web UI (Week 1-2)
**Goal:** Proof of concept with minimal viable UI

**Tasks:**
1. **WebSocket Proxy Server (Node.js)**
   - Create Node.js server that accepts WebSocket connections
   - Implement TCP client to C server (port 8888)
   - Protocol translation layer:
     - WebSocket JSON messages → Binary protocol
     - Binary protocol → WebSocket JSON messages
   - Message type mapping (0x01-0xFF to JSON)
   - Connection pooling and session management

2. **Basic Web Frontend**
   - React/Vite setup with TypeScript
   - WebSocket client connection
   - Login/Register forms
   - Simple chat interface
   - Basic error handling

**Deliverables:**
- Functional WebSocket proxy
- Working login/registration UI
- Ability to send/receive messages
- Basic connection handling

---

### Phase 2: Core Features Implementation (Week 3-4)

**Tasks:**
1. **Friend Management UI**
   - Friend list component with online/offline status
   - Add friend dialog
   - Friend request notifications
   - Accept/reject request buttons
   - Remove friend confirmation

2. **Chat Interface**
   - Message history display
   - Real-time message delivery
   - Typing indicators (future enhancement)
   - Message timestamps
   - Offline message delivery on login

3. **Group Chat UI**
   - Group list panel
   - Create group dialog
   - Group member list
   - Invite to group functionality
   - Group message interface
   - Leave group action

4. **Real-time Notifications**
   - Status change notifications (friend online/offline)
   - New message notifications
   - Friend request notifications
   - Browser notifications API integration

**Deliverables:**
- Complete friend management
- Full DM functionality
- Group chat features
- Real-time notification system

---

### Phase 3: Polish & Production Features (Week 5-6)

**Tasks:**
1. **UI/UX Enhancements**
   - Responsive design (mobile, tablet, desktop)
   - Dark/light theme toggle
   - User preferences persistence (localStorage)
   - Loading states and skeletons
   - Error boundaries and graceful degradation
   - Accessibility improvements (ARIA labels, keyboard navigation)

2. **Advanced Features**
   - Message search functionality
   - User profile management
   - Avatar support (if backend extended)
   - Emoji picker
   - Markdown support in messages
   - File upload preparation (UI only, backend TBD)

3. **Production Readiness**
   - Reconnection logic (exponential backoff)
   - Session persistence across page reloads
   - Performance optimization (virtual scrolling for messages)
   - Build optimization (code splitting, lazy loading)
   - Docker containerization for proxy
   - Environment configuration (.env files)

**Deliverables:**
- Production-ready web application
- Deployment documentation
- User guide
- Admin documentation

---

## 3. Detailed Technical Architecture

### 3.1 WebSocket Proxy Design

**File Structure:**
```
websocket-proxy/
├── package.json
├── src/
│   ├── server.js              # WebSocket server
│   ├── tcpClient.js           # TCP connection to C server
│   ├── protocol/
│   │   ├── messageTypes.js    # Protocol constants (0x01-0xFF)
│   │   ├── encoder.js         # JSON → Binary encoding
│   │   └── decoder.js         # Binary → JSON decoding
│   ├── session.js             # Session management
│   └── utils/
│       ├── logger.js
│       └── config.js
├── Dockerfile
└── README.md
```

**Protocol Translation Example:**
```javascript
// WebSocket receives:
{
  "type": "MSG_LOGIN",
  "data": {
    "username": "alice",
    "password": "password123"
  }
}

// Proxy converts to binary:
[4-byte length][0x03 type][username\0password\0]

// Server responds with binary:
[4-byte length][0x04 type][user_id|token|username]

// Proxy converts to WebSocket:
{
  "type": "MSG_LOGIN_ACK",
  "data": {
    "success": true,
    "userId": 1,
    "token": "abc123...",
    "username": "alice"
  }
}
```

**Session Management:**
- Map WebSocket connection to TCP socket
- Handle disconnection/reconnection
- Session token validation
- Heartbeat mechanism (MSG_HEARTBEAT 0xFE)

---

### 3.2 Web Frontend Architecture

**File Structure:**
```
web-client/
├── package.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Root component
│   ├── api/
│   │   ├── websocket.ts       # WebSocket client
│   │   └── protocol.ts        # Message definitions
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Friends/
│   │   │   ├── FriendList.tsx
│   │   │   ├── FriendRequest.tsx
│   │   │   └── AddFriend.tsx
│   │   ├── Chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── ChatHeader.tsx
│   │   ├── Groups/
│   │   │   ├── GroupList.tsx
│   │   │   ├── GroupChat.tsx
│   │   │   ├── CreateGroup.tsx
│   │   │   └── GroupMembers.tsx
│   │   ├── Notifications/
│   │   │   └── NotificationPanel.tsx
│   │   └── Common/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── StatusIndicator.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useAuth.ts
│   │   ├── useFriends.ts
│   │   └── useMessages.ts
│   ├── store/
│   │   ├── authSlice.ts       # Redux/Zustand state
│   │   ├── friendsSlice.ts
│   │   ├── messagesSlice.ts
│   │   └── groupsSlice.ts
│   ├── types/
│   │   └── protocol.ts        # TypeScript interfaces
│   └── utils/
│       ├── storage.ts         # localStorage wrapper
│       └── format.ts          # Date/time formatting
├── public/
│   └── assets/
└── README.md
```

**State Management:**
- Use Zustand or Redux Toolkit for global state
- WebSocket connection state
- User session (token, userId, username)
- Friends list with online status
- Message history (keyed by userId or groupId)
- Active notifications

**Key React Hooks:**
```typescript
// useWebSocket.ts - Manages WebSocket connection
const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3000');
    ws.current.onopen = () => setConnected(true);
    ws.current.onmessage = handleMessage;
    ws.current.onclose = handleReconnect;

    return () => ws.current?.close();
  }, []);

  const send = (type: string, data: any) => {
    ws.current?.send(JSON.stringify({ type, data }));
  };

  return { connected, send };
};
```

---

### 3.3 Message Protocol Mapping

| C Protocol Constant | Hex Value | WebSocket Type String | Direction |
|---------------------|-----------|----------------------|-----------|
| MSG_REGISTER | 0x01 | "MSG_REGISTER" | Client→Server |
| MSG_REGISTER_ACK | 0x02 | "MSG_REGISTER_ACK" | Server→Client |
| MSG_LOGIN | 0x03 | "MSG_LOGIN" | Client→Server |
| MSG_LOGIN_ACK | 0x04 | "MSG_LOGIN_ACK" | Server→Client |
| MSG_LOGOUT | 0x05 | "MSG_LOGOUT" | Client→Server |
| MSG_LOGOUT_ACK | 0x06 | "MSG_LOGOUT_ACK" | Server→Client |
| MSG_FRIEND_REQUEST | 0x20 | "MSG_FRIEND_REQUEST" | Client→Server |
| MSG_FRIEND_REQUEST_ACK | 0x21 | "MSG_FRIEND_REQUEST_ACK" | Server→Client |
| MSG_FRIEND_ACCEPT | 0x22 | "MSG_FRIEND_ACCEPT" | Client→Server |
| MSG_FRIEND_ACCEPT_ACK | 0x23 | "MSG_FRIEND_ACCEPT_ACK" | Server→Client |
| MSG_FRIEND_REJECT | 0x24 | "MSG_FRIEND_REJECT" | Client→Server |
| MSG_FRIEND_REJECT_ACK | 0x25 | "MSG_FRIEND_REJECT_ACK" | Server→Client |
| MSG_FRIEND_REMOVE | 0x26 | "MSG_FRIEND_REMOVE" | Client→Server |
| MSG_FRIEND_REMOVE_ACK | 0x27 | "MSG_FRIEND_REMOVE_ACK" | Server→Client |
| MSG_FRIEND_LIST | 0x28 | "MSG_FRIEND_LIST" | Client→Server |
| MSG_FRIEND_LIST_RSP | 0x29 | "MSG_FRIEND_LIST_RSP" | Server→Client |
| MSG_FRIEND_NOTIFY | 0x2A | "MSG_FRIEND_NOTIFY" | Server→Client |
| MSG_STATUS_NOTIFY | 0x2B | "MSG_STATUS_NOTIFY" | Server→Client |
| MSG_CHAT_SEND | 0x30 | "MSG_CHAT_SEND" | Client→Server |
| MSG_CHAT_DELIVER | 0x31 | "MSG_CHAT_DELIVER" | Server→Client |
| MSG_CHAT_ACK | 0x32 | "MSG_CHAT_ACK" | Client→Server |
| MSG_GROUP_CREATE | 0x40 | "MSG_GROUP_CREATE" | Client→Server |
| MSG_GROUP_CREATE_ACK | 0x41 | "MSG_GROUP_CREATE_ACK" | Server→Client |
| MSG_GROUP_INVITE | 0x42 | "MSG_GROUP_INVITE" | Client→Server |
| MSG_GROUP_INVITE_ACK | 0x43 | "MSG_GROUP_INVITE_ACK" | Server→Client |
| MSG_GROUP_JOIN | 0x44 | "MSG_GROUP_JOIN" | Client→Server |
| MSG_GROUP_JOIN_ACK | 0x45 | "MSG_GROUP_JOIN_ACK" | Server→Client |
| MSG_GROUP_LEAVE | 0x46 | "MSG_GROUP_LEAVE" | Client→Server |
| MSG_GROUP_LEAVE_ACK | 0x47 | "MSG_GROUP_LEAVE_ACK" | Server→Client |
| MSG_GROUP_REMOVE_USER | 0x48 | "MSG_GROUP_REMOVE_USER" | Client→Server |
| MSG_GROUP_REMOVE_ACK | 0x49 | "MSG_GROUP_REMOVE_ACK" | Server→Client |
| MSG_GROUP_MSG | 0x4A | "MSG_GROUP_MSG" | Client→Server |
| MSG_GROUP_MSG_DELIVER | 0x4B | "MSG_GROUP_MSG_DELIVER" | Server→Client |
| MSG_GROUP_LIST | 0x4C | "MSG_GROUP_LIST" | Client→Server |
| MSG_GROUP_LIST_RSP | 0x4D | "MSG_GROUP_LIST_RSP" | Server→Client |
| MSG_ERROR | 0xF0 | "MSG_ERROR" | Server→Client |
| MSG_HEARTBEAT | 0xFE | "MSG_HEARTBEAT" | Bidirectional |
| MSG_HEARTBEAT_ACK | 0xFF | "MSG_HEARTBEAT_ACK" | Bidirectional |

---

## 4. UI Component Specifications

### 4.1 Login/Register Screen

**Components:**
- Login form (username, password)
- Register form (username, password, email)
- Tab switcher between login/register
- Error message display
- Loading state during authentication

**Features:**
- Input validation (email format, password strength)
- Remember me checkbox (persist token in localStorage)
- Form submission on Enter key
- Password visibility toggle
- Clear error messages

**Layout:**
```
┌─────────────────────────────────────┐
│         TCP Chat Application        │
│                                     │
│  ┌───────────┬───────────┐          │
│  │   Login   │  Register │          │
│  └───────────┴───────────┘          │
│                                     │
│  Username: [_______________]        │
│  Password: [_______________] [👁]   │
│                                     │
│  ☐ Remember me                      │
│                                     │
│  [     Login     ]                  │
│                                     │
│  Error: Invalid credentials         │
└─────────────────────────────────────┘
```

---

### 4.2 Main Chat Interface

**Layout (3-column):**
```
┌─────────────────────────────────────────────────────────────┐
│ TCP Chat - alice                                    [⚙] [≡] │
├─────────────┬─────────────────────────┬─────────────────────┤
│             │                         │                     │
│  Friends    │   Chat: bob             │   User Info         │
│  ────────   │   ────────────          │   ─────────         │
│             │                         │                     │
│ ● bob       │  [bob]: Hello!          │   👤 bob            │
│ ○ charlie   │       10:30 AM          │                     │
│ ● diana     │                         │   Status: Online    │
│             │  [You]: Hi there!       │   Email: bob@...    │
│  Groups     │       10:31 AM          │                     │
│  ──────     │                         │   Actions:          │
│             │  [bob]: How are you?    │   • View Profile    │
│ 📁 Study    │       10:32 AM          │   • Remove Friend   │
│ 📁 Work     │                         │   • Block User      │
│             │                         │                     │
│  [+ Friend] │                         │                     │
│  [+ Group]  │ [Type message...  ] [→] │                     │
└─────────────┴─────────────────────────┴─────────────────────┘
```

**Left Sidebar - Friends & Groups:**
- Friend list with online status (● green, ○ gray)
- Group list
- Search/filter bar
- Add friend button
- Create group button
- Friend request badge (red dot)

**Center Panel - Chat Window:**
- Chat header (contact name, status)
- Message history (virtualized for performance)
- Message input box
- Send button
- Emoji picker
- File attachment button (future)

**Right Sidebar - Context Panel:**
- User profile info
- Shared media (future)
- Action buttons (mute, block, etc.)
- Group members list (when in group chat)

---

### 4.3 Friend List Component

**Features:**
- Real-time online/offline status updates
- Last message preview
- Unread message count badge
- Context menu (right-click):
  - Send message
  - View profile
  - Remove friend
  - Block user

**Friend Item Layout:**
```
┌─────────────────────────────────┐
│ ● bob                      [3]  │
│   Hey, are you there?           │
│   2 minutes ago                 │
├─────────────────────────────────┤
│ ○ charlie                       │
│   Thanks!                       │
│   1 hour ago                    │
└─────────────────────────────────┘
```

---

### 4.4 Group Chat Component

**Features:**
- Group member list
- Admin controls (invite, remove members)
- Group info editing (name, description)
- Leave group option
- Member typing indicators

**Group Item Layout:**
```
┌─────────────────────────────────┐
│ 📁 Study Group            [12]  │
│    alice: See you tomorrow      │
│    5 minutes ago                │
│                                 │
│    Members: 5 online / 12 total │
└─────────────────────────────────┘
```

---

### 4.5 Notification System

**Types:**
1. **Friend Request**
   - "bob wants to be your friend"
   - [Accept] [Reject] buttons

2. **Status Change**
   - "charlie is now online"
   - Click to open chat

3. **New Message**
   - "New message from diana"
   - Message preview
   - Click to open chat

4. **Group Invitation**
   - "alice invited you to Study Group"
   - [Accept] [Decline] buttons

**Display:**
- Toast notifications (bottom-right)
- Notification panel (top-right bell icon)
- Browser notifications (when tab not focused)
- Sound notification option

---

## 5. Implementation Details

### 5.1 WebSocket Proxy - Binary Protocol Encoding

**Example: Login Message Encoding**

```javascript
// encoder.js
const encodeLoginMessage = (username, password) => {
  const payload = `${username}\0${password}\0`;
  const payloadBuffer = Buffer.from(payload, 'utf8');

  const totalLen = 6 + payloadBuffer.length; // 4 (length) + 2 (type) + payload
  const buffer = Buffer.alloc(totalLen);

  // Write length (4 bytes, network byte order)
  buffer.writeUInt32BE(totalLen, 0);

  // Write type (2 bytes, network byte order)
  buffer.writeUInt16BE(0x03, 4); // MSG_LOGIN

  // Write payload
  payloadBuffer.copy(buffer, 6);

  return buffer;
};
```

**Example: Response Decoding**

```javascript
// decoder.js
const decodeLoginAck = (buffer) => {
  // Skip header (6 bytes)
  const payload = buffer.slice(6).toString('utf8');
  const parts = payload.split('|');

  if (parts.length >= 3) {
    return {
      type: 'MSG_LOGIN_ACK',
      data: {
        success: true,
        userId: parseInt(parts[0]),
        token: parts[1],
        username: parts[2]
      }
    };
  }

  return {
    type: 'MSG_LOGIN_ACK',
    data: { success: false }
  };
};
```

---

### 5.2 WebSocket Proxy - Connection Management

```javascript
// server.js
const WebSocket = require('ws');
const net = require('net');

const wss = new WebSocket.Server({ port: 3000 });

// Store WebSocket → TCP socket mappings
const connections = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  // Create TCP connection to C server
  const tcpSocket = net.createConnection({
    host: 'localhost',
    port: 8888
  });

  connections.set(ws, tcpSocket);

  // WebSocket → TCP
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    const binaryMsg = encodeMessage(msg);
    tcpSocket.write(binaryMsg);
  });

  // TCP → WebSocket
  let buffer = Buffer.alloc(0);
  tcpSocket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    // Process complete messages
    while (buffer.length >= 6) {
      const msgLen = buffer.readUInt32BE(0);

      if (buffer.length >= msgLen) {
        const msgBuffer = buffer.slice(0, msgLen);
        const jsonMsg = decodeMessage(msgBuffer);

        ws.send(JSON.stringify(jsonMsg));
        buffer = buffer.slice(msgLen);
      } else {
        break;
      }
    }
  });

  // Cleanup
  ws.on('close', () => {
    tcpSocket.end();
    connections.delete(ws);
  });

  tcpSocket.on('close', () => {
    ws.close();
  });
});
```

---

### 5.3 React Frontend - WebSocket Hook

```typescript
// useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authSlice';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket('ws://localhost:3000');

      ws.current.onopen = () => {
        console.log('Connected to server');
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      };

      ws.current.onclose = () => {
        console.log('Disconnected from server');
        setConnected(false);

        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, []);

  const send = (type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data }));
    }
  };

  const handleMessage = (msg: any) => {
    switch (msg.type) {
      case 'MSG_LOGIN_ACK':
        if (msg.data.success) {
          setUser({
            userId: msg.data.userId,
            username: msg.data.username,
            token: msg.data.token
          });
        }
        break;

      case 'MSG_CHAT_DELIVER':
        // Handle incoming message
        // Dispatch to messages store
        break;

      case 'MSG_STATUS_NOTIFY':
        // Update friend status
        break;

      // ... other message types
    }
  };

  return { connected, send };
};
```

---

### 5.4 State Management - Zustand Store

```typescript
// store/authSlice.ts
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: number;
  username: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: true
      }),

      clearUser: () => set({
        user: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user
      })
    }
  )
);
```

```typescript
// store/messagesSlice.ts
import create from 'zustand';

interface Message {
  id: string;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: Date;
}

interface MessagesState {
  conversations: Record<number, Message[]>;
  addMessage: (userId: number, message: Message) => void;
  clearConversation: (userId: number) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  conversations: {},

  addMessage: (userId, message) => set((state) => ({
    conversations: {
      ...state.conversations,
      [userId]: [...(state.conversations[userId] || []), message]
    }
  })),

  clearConversation: (userId) => set((state) => {
    const { [userId]: _, ...rest } = state.conversations;
    return { conversations: rest };
  })
}));
```

---

## 6. Deployment Strategy

### 6.1 Development Environment

**Docker Compose Setup:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  c_server:
    build: ./
    ports:
      - "8888:8888"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    command: ./bin/server

  websocket_proxy:
    build: ./websocket-proxy
    ports:
      - "3000:3000"
    depends_on:
      - c_server
    environment:
      - TCP_HOST=c_server
      - TCP_PORT=8888
      - WS_PORT=3000

  web_client:
    build: ./web-client
    ports:
      - "5173:5173"
    depends_on:
      - websocket_proxy
    environment:
      - VITE_WS_URL=ws://localhost:3000
    volumes:
      - ./web-client:/app
      - /app/node_modules
    command: npm run dev
```

---

### 6.2 Production Deployment

**Architecture:**
```
Internet
    │
    ├─→ Nginx (Reverse Proxy)
    │       │
    │       ├─→ Static Files (React build) → CDN
    │       │
    │       ├─→ WebSocket Proxy (ws://chat.example.com/ws)
    │       │       │
    │       │       └─→ C Server (localhost:8888)
    │       │
    │       └─→ Health Check Endpoint
    │
```

**Nginx Configuration:**
```nginx
# /etc/nginx/sites-available/chat
upstream websocket_proxy {
    server localhost:3000;
}

upstream tcp_server {
    server localhost:8888;
}

server {
    listen 80;
    server_name chat.example.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    # Static files (React app)
    location / {
        root /var/www/chat-client/dist;
        try_files $uri /index.html;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://websocket_proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket timeout
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

**Systemd Service (C Server):**
```ini
# /etc/systemd/system/chat-server.service
[Unit]
Description=TCP Chat Server
After=network.target

[Service]
Type=simple
User=chat
WorkingDirectory=/opt/chat_tcp_socket
ExecStart=/opt/chat_tcp_socket/bin/server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Systemd Service (WebSocket Proxy):**
```ini
# /etc/systemd/system/chat-websocket.service
[Unit]
Description=Chat WebSocket Proxy
After=network.target chat-server.service

[Service]
Type=simple
User=chat
WorkingDirectory=/opt/chat_websocket_proxy
ExecStart=/usr/bin/node /opt/chat_websocket_proxy/src/server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="TCP_HOST=localhost"
Environment="TCP_PORT=8888"
Environment="WS_PORT=3000"

[Install]
WantedBy=multi-user.target
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**WebSocket Proxy:**
- Protocol encoding/decoding tests
- Message type mapping tests
- Error handling tests

**React Components:**
- Component rendering tests (React Testing Library)
- User interaction tests
- State management tests

**Example Test:**
```typescript
// MessageInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  it('sends message on Enter key', () => {
    const onSend = jest.fn();
    render(<MessageInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Type message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Hello');
  });
});
```

---

### 7.2 Integration Tests

**End-to-End Scenarios:**
1. User registration → Login → Send message
2. Friend request → Accept → Chat
3. Group creation → Invite → Group message
4. Offline message delivery
5. Reconnection after disconnect

**Tools:**
- Playwright or Cypress for E2E tests
- Mock WebSocket server for isolated tests

---

### 7.3 Performance Tests

**Metrics:**
- WebSocket latency (should be < 50ms)
- Message throughput (messages/second)
- UI responsiveness (React DevTools Profiler)
- Memory usage (browser dev tools)

**Load Testing:**
- Simulate 100+ concurrent connections
- Measure proxy resource usage
- Test message delivery under load

---

## 8. Migration Path (Existing to New UI)

### 8.1 Parallel Deployment

**Option 1: Run both UIs simultaneously**
- Keep existing C client for CLI users
- Deploy web UI for new users
- Both connect to same server
- No server changes required

**Option 2: Feature flag**
- Add server capability detection
- New features only in web UI initially
- Gradual migration of features

---

### 8.2 User Migration Strategy

**Phase 1: Beta Testing (Week 1-2)**
- Internal testing with small group
- Collect feedback on UX
- Bug fixes and polish

**Phase 2: Soft Launch (Week 3-4)**
- Make web UI available alongside CLI
- User documentation and tutorials
- Monitor server performance

**Phase 3: Full Rollout (Week 5+)**
- Promote web UI as primary interface
- Keep CLI for power users
- Deprecation notice for old client (if needed)

---

## 9. Security Considerations

### 9.1 Authentication & Session Management

**Current Implementation:**
- Session tokens generated on login
- Tokens stored server-side
- 5-minute inactivity timeout

**Web UI Enhancements:**
- Store token in httpOnly cookie (if using HTTP API) or sessionStorage (WebSocket)
- CSRF protection
- Token refresh mechanism
- Secure session storage

---

### 9.2 WebSocket Security

**Measures:**
- Origin checking on proxy
- Rate limiting (prevent message spam)
- Input validation on proxy layer
- Message size limits
- Connection timeout enforcement

**Example:**
```javascript
// Origin validation
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;

  if (!isAllowedOrigin(origin)) {
    ws.close(1008, 'Invalid origin');
    return;
  }

  // Continue...
});
```

---

### 9.3 Transport Security

**Development:**
- ws:// (unencrypted WebSocket)
- http:// (unencrypted web)

**Production:**
- wss:// (encrypted WebSocket over TLS)
- https:// (encrypted web over TLS)
- TLS 1.3
- Valid SSL certificates (Let's Encrypt)

---

## 10. Alternative Implementations (Quick Reference)

### 10.1 Electron Desktop App

**Pros:** Direct TCP, no proxy needed, native feel
**Cons:** Large bundle size, more complex deployment
**Time:** 4-5 weeks

**Key Difference:**
```javascript
// Main process - Direct TCP connection
const net = require('net');
const client = net.createConnection({ port: 8888, host: 'localhost' });

// No WebSocket needed, direct binary protocol
client.write(encodeLoginMessage('alice', 'password123'));
```

---

### 10.2 Enhanced Terminal UI (ncurses)

**Pros:** Fast implementation, minimal changes, lightweight
**Cons:** Limited UI, terminal-only
**Time:** 1-2 weeks

**Layout Preview:**
```
╔════════════════════════════════════════════════════════════╗
║ TCP Chat - alice                                           ║
╠══════════════╦═════════════════════════════════════════════╣
║ Friends (3)  ║ Chat: bob                                   ║
║──────────────║─────────────────────────────────────────────║
║ ● bob        ║ [10:30] bob: Hello!                         ║
║ ○ charlie    ║ [10:31] You: Hi there!                      ║
║ ● diana      ║ [10:32] bob: How are you?                   ║
║              ║                                             ║
║ Groups (2)   ║                                             ║
║──────────────║                                             ║
║ 📁 Study     ║                                             ║
║ 📁 Work      ║                                             ║
║              ║                                             ║
║ [Commands]   ║─────────────────────────────────────────────║
║ 1) Friend    ║ > Type message here...                      ║
║ 2) Group     ║                                             ║
║ q) Quit      ║                                             ║
╚══════════════╩═════════════════════════════════════════════╝
```

---

### 10.3 Flutter Cross-Platform

**Pros:** Mobile + desktop, beautiful UI, single codebase
**Cons:** Dart learning curve, mobile-focused
**Time:** 4-6 weeks

**Key Libraries:**
- `dart:io` for TCP sockets
- `flutter_bloc` for state management
- `web_socket_channel` for WebSocket (web target)
- `flutter_local_notifications` for push notifications

---

## 11. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebSocket proxy adds latency | Medium | High | Optimize encoding, use binary WebSocket frames |
| Protocol mismatch bugs | High | Medium | Comprehensive integration tests, protocol versioning |
| Server can't handle load | High | Low | Load testing, horizontal scaling of proxy |
| Browser compatibility issues | Medium | Medium | Use established libraries, test on major browsers |
| User resistance to web UI | Low | Low | Keep CLI option, gradual migration |
| Security vulnerabilities in proxy | High | Medium | Security audit, rate limiting, input validation |
| WebSocket connection drops | Medium | High | Automatic reconnection, offline mode, message queuing |

---

## 12. Success Metrics

### 12.1 Technical Metrics
- **Latency:** < 100ms end-to-end (client → proxy → server → proxy → client)
- **Uptime:** > 99.5% availability
- **Concurrent Users:** Support 100+ simultaneous connections
- **Message Throughput:** > 1000 messages/second
- **Bundle Size:** < 500KB gzipped for initial load

### 12.2 User Experience Metrics
- **Time to First Message:** < 30 seconds from landing to sending first message
- **UI Responsiveness:** No frame drops during scrolling
- **Error Rate:** < 1% failed message delivery
- **User Satisfaction:** > 4/5 rating in user feedback

---

## 13. Future Enhancements

### 13.1 Short-term (3-6 months)
- Voice calling (WebRTC)
- Video calling (WebRTC)
- File sharing (chunked transfer)
- Message reactions (emoji)
- Typing indicators
- Read receipts
- Message editing/deletion
- Search functionality

### 13.2 Long-term (6-12 months)
- End-to-end encryption (Signal Protocol)
- Multi-device sync
- Mobile apps (React Native or Flutter)
- Desktop app (Electron)
- Message backup/export
- Rich text formatting
- Code snippet sharing with syntax highlighting
- Screen sharing

---

## 14. Documentation Deliverables

### 14.1 Technical Documentation
1. **WebSocket Proxy API Specification**
   - Message format documentation
   - Protocol mapping reference
   - Error codes and handling

2. **Deployment Guide**
   - Server setup instructions
   - Nginx configuration
   - SSL/TLS setup
   - Docker deployment

3. **Development Setup Guide**
   - Local development environment
   - Running tests
   - Contributing guidelines

### 14.2 User Documentation
1. **User Guide**
   - Getting started
   - Feature walkthrough
   - Keyboard shortcuts
   - Troubleshooting

2. **FAQ**
   - Common issues
   - Browser compatibility
   - Privacy and security

---

## 15. Budget & Resource Estimates

### 15.1 Development Resources

**Team Composition:**
- 1 Backend Developer (WebSocket proxy) - 2 weeks
- 1 Frontend Developer (React UI) - 4 weeks
- 1 UI/UX Designer (mockups, design system) - 1 week
- 1 QA Engineer (testing, bug fixing) - 1 week

**Total Development Time:** ~6 weeks for full web UI implementation

### 15.2 Infrastructure Costs (Monthly)

**Self-Hosted Option:**
- VPS (4GB RAM, 2 CPU cores): $20-40/month
- Domain + SSL: $15/year
- Backup storage: $5/month
- **Total:** ~$30-50/month

**Cloud Option (AWS/DigitalOcean):**
- EC2 t3.medium: $30/month
- Load Balancer: $20/month
- CloudFront CDN: $10-50/month
- Route53 DNS: $1/month
- **Total:** ~$60-100/month

---

## 16. Implementation Roadmap

### Week 1: Foundation
- [ ] Set up project structure (websocket-proxy, web-client)
- [ ] Implement basic WebSocket proxy
- [ ] Protocol encoding/decoding for auth messages
- [ ] React project setup with Vite + TypeScript
- [ ] Basic login/register UI

### Week 2: Core Features - Part 1
- [ ] Complete protocol translation for all message types
- [ ] WebSocket connection management and reconnection
- [ ] Friend list UI with real-time status
- [ ] Chat window with message history
- [ ] Message sending and receiving

### Week 3: Core Features - Part 2
- [ ] Friend request system UI
- [ ] Group creation and management
- [ ] Group chat interface
- [ ] Notification system
- [ ] Offline message handling

### Week 4: Polish & Features
- [ ] UI/UX improvements (responsive design, animations)
- [ ] Dark/light theme
- [ ] Error handling and loading states
- [ ] Settings panel
- [ ] User profile management

### Week 5: Testing & Deployment
- [ ] Unit tests for proxy and components
- [ ] Integration tests (E2E)
- [ ] Performance testing and optimization
- [ ] Docker containerization
- [ ] Deployment setup (Nginx, systemd)

### Week 6: Beta & Launch
- [ ] Beta testing with users
- [ ] Bug fixes and polish
- [ ] Documentation (user guide, deployment guide)
- [ ] Production deployment
- [ ] Monitoring and logging setup

---

## 17. Decision Matrix: Final Recommendation

| Technology | Time | Complexity | UX | Scalability | Maintenance | Score |
|------------|------|------------|----|-----------  |-------------|-------|
| **Web UI (React + WebSocket)** | 4 weeks | Medium | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **19/25** ✅ |
| Electron Desktop | 5 weeks | High | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 15/25 |
| Qt Native | 6 weeks | High | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 13/25 |
| Flutter | 5 weeks | High | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 17/25 |
| ncurses TUI | 2 weeks | Low | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 11/25 |

### Final Recommendation: **Web-Based UI (React + WebSocket Proxy)**

**Rationale:**
1. **Best UX:** Modern, responsive, accessible interface
2. **Cross-platform:** Works on all devices without installation
3. **Fast Development:** Rich ecosystem, reusable components
4. **Easy Deployment:** Static files + simple proxy service
5. **Future-proof:** Easy to extend with PWA, mobile views
6. **Moderate Complexity:** Well-documented architecture patterns

**Tradeoffs Accepted:**
- WebSocket proxy adds ~10-20ms latency (acceptable for chat)
- Requires additional service (proxy), but lightweight
- No native filesystem access (acceptable for chat app)

---

## 18. Quick Start Guide

### Get Started in 15 Minutes

**Step 1: Clone and Setup**
```bash
cd chat_tcp_socket
mkdir websocket-proxy web-client
```

**Step 2: Create WebSocket Proxy**
```bash
cd websocket-proxy
npm init -y
npm install ws

# Create src/server.js with basic proxy (see Section 5.2)
node src/server.js
```

**Step 3: Create React Frontend**
```bash
cd ../web-client
npm create vite@latest . -- --template react-ts
npm install zustand

# Add WebSocket connection (see Section 5.3)
npm run dev
```

**Step 4: Test**
1. Start C server: `./bin/server`
2. Start proxy: `node websocket-proxy/src/server.js`
3. Start React: `npm run dev` (in web-client)
4. Open browser: `http://localhost:5173`

---

## 19. Unresolved Questions

1. **File Transfer:** Should we implement file sharing in Phase 1 or defer to Phase 2?
2. **Message History:** Backend currently doesn't persist message history beyond offline queue. Should we add database for full history?
3. **Scalability:** If scaling beyond single server, how to handle session state? (Redis for shared state?)
4. **Mobile Priority:** Should we prioritize mobile-responsive web UI or native mobile apps?
5. **Voice/Video:** WebRTC integration complexity - is this Phase 2 or Phase 3?

---

## Conclusion

This plan provides a comprehensive roadmap for implementing a modern web-based UI for the TCP chat application. The recommended approach (React + WebSocket proxy) balances development speed, user experience, and maintainability.

**Next Steps:**
1. Approve technology stack and architecture
2. Assign resources and finalize timeline
3. Set up development environment
4. Begin Week 1 implementation tasks
5. Schedule weekly progress reviews

**Estimated Total Timeline:** 6 weeks from start to production deployment

**Required Resources:**
- 1-2 developers (full-stack or frontend + backend split)
- UI/UX designer (optional but recommended for professional polish)
- Server infrastructure (VPS or cloud instance)

---

**Plan Version:** 1.0
**Last Updated:** 2025-12-15
**Status:** Ready for Implementation
