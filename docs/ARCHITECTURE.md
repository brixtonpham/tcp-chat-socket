# TCP Chat Application - Architecture & Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           WEB BROWSER                                │
│                    (React UI Application)                            │
│  ┌────────────┬─────────────────┬──────────────┬─────────────────┐  │
│  │ Login Page │ Chat Interface  │ Friend List  │ Group Management│  │
│  └────────────┴─────────────────┴──────────────┴─────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                        WebSocket Connection (ws://)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│               WebSocket Proxy Server (Node.js)                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    WebSocket Handler                         │  │
│  │  - Manages browser connections                              │  │
│  │  - Handles incoming WebSocket messages (JSON)               │  │
│  │  - Sends responses back to browser (JSON)                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            │          ▲                             │
│                            │          │                             │
│                       Encode│         │Decode                       │
│                       (JSON)│         │(JSON)                       │
│                            │          │                             │
│  ┌──────────────────────────▼──────────────────────────────────┐  │
│  │                Protocol Translation Layer                   │  │
│  │  ┌─────────────────┐              ┌─────────────────┐      │  │
│  │  │ JSON → Binary   │              │ Binary → JSON   │      │  │
│  │  │ Encoder         │              │ Decoder         │      │  │
│  │  │                 │              │                 │      │  │
│  │  │ (Message buffer │              │ (TCP stream     │      │  │
│  │  │  management,    │              │  fragmentation  │      │  │
│  │  │  type conversion)│             │  handling)      │      │  │
│  │  └─────────────────┘              └─────────────────┘      │  │
│  └──────────────────────────┬──────────────────────────────────┘  │
│                            │          ▲                             │
│                            │          │                             │
│                       Send │         │Receive                       │
│                     (Binary)│         │(Binary)                      │
│                            │          │                             │
│  ┌──────────────────────────▼──────────────────────────────────┐  │
│  │                    TCP Socket Handler                        │  │
│  │  - Manages per-client TCP connections to C server          │  │
│  │  - Handles TCP stream reassembly (length-prefixed)         │  │
│  │  - Manages connection lifecycle                             │  │
│  │  - Health checks & timeout handling                         │  │
│  └──────────────────────────┬──────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                        TCP Connection (127.0.0.1:8888)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   TCP Chat Server (C, select())                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Main Event Loop (select)                    │  │
│  │                                                               │  │
│  │  while(1) {                                                  │  │
│  │    select(listen_fd + all_clients, timeout)                  │  │
│  │    if (listen_fd ready) accept_new_connection()             │  │
│  │    for each client in master_set:                            │  │
│  │      if (client ready) handle_client_data()                 │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                     │         │         │          │                │
│                     ▼         ▼         ▼          ▼                │
│  ┌──────────────┬──────────┬───────────┬──────────────────────┐   │
│  │ Auth Handler │ Friend   │ Chat      │ Group Handler        │   │
│  │ - Register   │ Handler  │ Handler   │ - Create Group       │   │
│  │ - Login      │ - Add    │ - Send    │ - Invite Members     │   │
│  │ - Logout     │ - Accept │ - Deliver │ - Send Group Msg     │   │
│  │              │ - Reject │ - ACK     │ - Remove User        │   │
│  │              │ - Remove │           │                      │   │
│  │              │ - List   │           │                      │   │
│  └──────────────┴──────────┴───────────┴──────────────────────┘   │
│                     │         │         │          │                │
│                     └─────────┴─────────┴──────────┘                │
│                               │                                     │
│  ┌────────────────────────────▼────────────────────────────────┐  │
│  │              Data Management Layer                          │  │
│  │  ┌──────────────┬──────────────┬───────────┬─────────────┐ │  │
│  │  │ User Manager │ Friend       │ Group     │ Message     │ │  │
│  │  │ - User DB    │ Manager      │ Manager   │ Queue       │ │  │
│  │  │ - Sessions   │ - Friendlist │ - Members │ - Offline   │ │  │
│  │  │ - Auth       │ - Requests   │ - Groups  │   Messages  │ │  │
│  │  │ - Status     │ - Notify     │ - Notify  │ - Delivery  │ │  │
│  │  └──────────────┴──────────────┴───────────┴─────────────┘ │  │
│  └────────────────────────────┬────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                            File Operations
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌────────────────┐┌─────────────────┐┌──────────────┐
        │  data/         ││  logs/          ││  Offline     │
        │  ├─users.dat   ││  ├─server.log   ││  Message     │
        │  ├─friends.dat ││  └─activity.log ││  Queue       │
        │  ├─groups.dat  │└─────────────────┘└──────────────┘
        │  └─msgs.dat    │
        └────────────────┘
```

## Component Responsibilities

### 1. C TCP Server (Backend Core)

**Location**: `src/server/`, `include/`

**Responsibilities**:
- Accept TCP connections on port 8888
- Implement `select()`-based event loop for multiplexing
- Parse and validate incoming binary messages
- Implement business logic for all features
- Route messages to appropriate handlers
- Maintain user sessions and authentication
- Manage friend relationships
- Manage group memberships
- Queue messages for offline users
- Broadcast status updates
- Persist data to files
- Log all activities

**Key Data Structures**:
```c
typedef struct {
    int fd;                      // Socket descriptor
    int user_id;                 // Logged-in user ID
    char username[50];           // Username
    char recv_buffer[4096];      // Receive buffer for fragmented messages
    time_t last_activity;        // For timeout detection
} ClientInfo;

typedef struct {
    int listen_fd;               // Listening socket
    ClientInfo clients[1000];    // All connected clients
    fd_set master_set;           // File descriptors for select()
    int max_fd;                  // Highest FD for select()
} ChatServer;
```

### 2. WebSocket Proxy Server (Bridge Layer)

**Location**: `websocket-proxy/src/`

**Responsibilities**:
- Accept WebSocket connections from browsers
- Create corresponding TCP connections to C server
- Convert incoming JSON messages to binary protocol
- Convert outgoing binary messages to JSON
- Handle message buffering for TCP fragmentation
- Manage connection lifecycle
- Implement heartbeat/ping for connection health
- Log message flows

**Key Components**:
```typescript
interface ClientConnection {
    ws: WebSocket;              // Browser connection
    tcp: TCPClient;             // Server connection
    clientId: string;           // Unique client ID
    isAlive: boolean;           // Health check flag
}

class ProxyServer {
    clients: Map<string, ClientConnection>;
    // Maps WebSocket clients to TCP server connections
}
```

### 3. React Web Client (Frontend UI)

**Location**: `web-client/src/`

**Responsibilities**:
- Provide user-friendly chat interface
- Handle user authentication
- Manage friend relationships
- Display online/offline status
- Send and receive direct messages
- Manage group memberships
- Send and receive group messages
- Real-time notification display
- State management with Zustand

**UI Component Library**:
- **shadcn/ui** - Accessible, customizable component library built on Tailwind CSS
- Components located in `src/components/ui/`
- Includes Button, Input, Card, Dialog, Avatar, Badge, Tooltip, ScrollArea, Tabs, Select, DropdownMenu, and more
- Full dark mode support with CSS variables

**Key Components**:
- `AuthContext` - Handle login/registration
- `ChatStore` - Global state for messages
- `FriendList` - Display and manage friends
- `ChatWindow` - Direct message interface
- `GroupChat` - Group messaging interface
- `ServerLogsPanel` - Educational protocol visualization (custom, educational feature)

### 4. Message Protocol Layer

**Location**: `include/protocol.h`, `src/common/protocol.c`

**Responsibilities**:
- Define message format (length-prefixed binary)
- Serialize messages (encoding)
- Deserialize messages (decoding)
- Handle byte order conversion (network byte order)
- Implement protocol constants

**Message Structure**:
```
[4 bytes: Length] [2 bytes: Type] [N bytes: Payload]
```

---

## Message Flow Diagrams

### Authentication Flow

```
Client (Browser)              Proxy Server           Server (C)
    │                              │                    │
    ├──WebSocket Register JSON──────>                   │
    │  {type: MSG_REGISTER,         │                   │
    │   data: {username, pwd}}      │                   │
    │                               ├──Binary Message──>│
    │                               │ [LENGTH][TYPE]    │
    │                               │ [username|pwd...]│
    │                               │                   ├─Validate
    │                               │                   ├─Hash Password
    │                               │                   ├─Create User
    │                               │                   ├─Save to DB
    │                               │                   │
    │                               │<─Binary Response──┤
    │                               │ [LENGTH][TYPE]    │
    │                               │ [OK|user_id|msg]  │
    │<───WebSocket JSON Response────┤                   │
    │  {type: MSG_REGISTER_ACK,      │                   │
    │   success: true, userId: 1}    │                   │
    │                               │                   │
```

### Direct Messaging Flow

```
Client A                  Proxy-A             Server            Proxy-B           Client B
  │                          │                 │                    │                │
  ├─WebSocket JSON────────────>                │                    │                │
  │ {type: MSG_CHAT_SEND,     │                │                    │                │
  │  data: {recipientId: 2,   │                │                    │                │
  │         content: "Hi"}}   │                │                    │                │
  │                           │                │                    │                │
  │                           ├─Binary────────>│                    │                │
  │                           │ MSG_CHAT_SEND │                    │                │
  │                           │                ├─Find Client 2      │                │
  │                           │                ├─Route Message──────────────────────>│
  │                           │                │ MSG_CHAT_DELIVER   │                │
  │                           │                │                    ├─WebSocket JSON┤
  │                           │                │                    │ {type:         │
  │                           │                │                    │  MSG_CHAT_DELIVER}
  │                           │                │                    │                ├─Display
  │                           │                │<─Binary ACK────────┤                │
  │                           │<─Binary ACK────┤ MSG_CHAT_ACK       │                │
  │<─WebSocket JSON ACK───────┤                │                    │                │
  │ {type: MSG_CHAT_ACK,      │                │                    │                │
  │  success: true}           │                │                    │                │
  │                           │                │                    │                │
```

### Group Messaging Flow

```
Client A→Proxy→Server                              All Other Clients
  │              │                                         │
  ├─Send to────>─┤                                         │
  │ Group 1      ├─Route to all members                    │
  │              │ Find all clients in group 1             │
  │              │ For each online member:                 │
  │              │   ├─Deliver MSG_GROUP_MSG_DELIVER──────>├─Receive & Display
  │              │   ├─Deliver MSG_GROUP_MSG_DELIVER──────>├─Receive & Display
  │              │   └─Deliver MSG_GROUP_MSG_DELIVER──────>├─Receive & Display
  │              │                                         │
  │              │ For offline members:                    │
  │              │   └─Queue in messages.dat (no proxy)    │
  │              │                                         │
  │<─Receive ACK─┤                                         │
  │              │                                         │
```

---

## Data Flow Architecture

### User Registration & Login

```
┌──────────────────────────────────────────────────────────┐
│ Client sends: register alice password123 alice@test.com  │
└──────────────────────────────────────────────────────────┘
                           │
                    Proxy converts JSON to binary
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ Server receives binary MSG_REGISTER                       │
│ Payload: [alice|password123|alice@test.com]              │
└──────────────────────────────────────────────────────────┘
                           │
                  handle_register() function
                    ├─ Validate username (3-32 chars)
                    ├─ Hash password with DJB2
                    ├─ Check if user exists
                    ├─ Create new user struct
                    ├─ Assign user_id
                    ├─ Save to users.dat
                    └─ Return success with user_id
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ Server sends binary MSG_REGISTER_ACK                     │
│ Payload: [OK|1|Registration successful]                 │
└──────────────────────────────────────────────────────────┘
                           │
                    Proxy converts binary to JSON
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ Client receives: {success: true, userId: 1}              │
└──────────────────────────────────────────────────────────┘
```

### Friend Request System

```
1. Alice sends friend request to Bob

   Alice: friend add bob
   └─ Server gets bob's user_id (2)
      └─ Create friendship record (1←→2, status=pending)
         └─ Send MSG_FRIEND_NOTIFY to Bob (if online)

2. Bob receives notification

   Server: MSG_FRIEND_NOTIFY [alice]
   └─ Proxy sends JSON to Bob's browser
      └─ React displays: "alice wants to be your friend"
         └─ Bob clicks Accept

3. Bob accepts request

   Bob: friend accept 1
   └─ Server updates friendship (1←→2, status=accepted)
      └─ Send MSG_STATUS_NOTIFY to both
         └─ Alice sees: "bob is now your friend"
         └─ Bob sees: "You are now friends with alice"

4. Now they can message each other

   Alice: msg 2 Hello Bob!
   └─ Server routes to Bob
      └─ Bob receives and can reply
```

### Offline Message Queue

```
1. Alice (online) sends to Charlie (offline)

   Alice: msg 3 Hello Charlie!
   └─ Server checks: Is Charlie online? NO
      └─ Queue message in messages.dat
      └─ Return ACK to Alice (message queued)

2. Charlie comes online

   Charlie: login
   └─ Server gets all queued messages for Charlie
      └─ Sends MSG_CHAT_DELIVER for each
      └─ Mark as delivered in messages.dat
      └─ Charlie sees: "You have X offline messages"

3. Charlie reads messages

   Charlie receives all queued messages
   └─ Can reply to each
```

---

## Session Management

```
┌─────────────────────────────────────────────────────────┐
│                    Client Connection                     │
└─────────────────────────────────────────────────────────┘
                           │
                    TCP Connection Accepted
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼                                   ▼
   Connected                          (Waiting for login)
  (Not authenticated)
         │
         ├─ register → New User Created → Can login
         │
         ├─ login → Check credentials → Authenticated
         │  ├─ Create session token
         │  ├─ Set user_id in ClientInfo
         │  ├─ Record last_activity timestamp
         │  └─ User is NOW authenticated
         │
         ▼
   ┌─────────────────────────────┐
   │ Authenticated Session       │
   │ - Can send/receive messages │
   │ - Can manage friends        │
   │ - Can participate in groups │
   │ - Status = ONLINE           │
   └─────────────────────────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
  Send  Idle  Recv
  Msg   Timer  Msg
    │    ▼    │
    │ Timeout │
    │ (5 min) │
    │    ▼    ▼
    └────────────┐
                 ▼
          ┌─────────────────┐
          │ Session Timeout │
          │ - Auto logout   │
          │ - Status=OFFLINE│
          │ - Notify friends│
          │ - Close socket  │
          └─────────────────┘
                 │
                 ▼
         Client reconnects
         (New session created)
```

---

## Network Byte Order Handling

The protocol uses **network byte order** (big-endian) for integer fields:

```c
// Sending a message
uint32_t length = 6 + payload_len;
uint16_t type = MSG_CHAT_SEND;

buffer[0] = (length >> 24) & 0xFF;     // Most significant byte first
buffer[1] = (length >> 16) & 0xFF;
buffer[2] = (length >> 8) & 0xFF;
buffer[3] = length & 0xFF;             // Least significant byte last

buffer[4] = (type >> 8) & 0xFF;
buffer[5] = type & 0xFF;

// Or using htonl/htons macros:
*(uint32_t *)buffer = htonl(length);
*(uint16_t *)(buffer+4) = htons(type);

// Receiving a message
uint32_t length = ntohl(*(uint32_t *)buffer);
uint16_t type = ntohs(*(uint16_t *)(buffer+4));
```

This ensures compatibility across different architectures (Intel x86, ARM, etc.)

---

## Error Handling Strategy

```
Error Detection
    │
    ├─ Protocol validation (length, type)
    ├─ Authentication check
    ├─ Input validation (username, password)
    ├─ User existence verification
    ├─ Permission checks (group admin, friends)
    └─ Resource limits (max groups, max members)
         │
         ▼
    Error Response (MSG_ERROR)
         │
         ├─ Send error to client
         ├─ Log error with user ID
         ├─ Continue (non-fatal) or Disconnect (fatal)
         └─ Notify affected parties if relevant
```

**Error Codes**:
- `USER_NOT_FOUND` - Invalid username
- `INVALID_PASSWORD` - Wrong password
- `USER_ALREADY_EXISTS` - Duplicate registration
- `NOT_AUTHENTICATED` - Must login first
- `INVALID_GROUP` - Group doesn't exist
- `NOT_GROUP_MEMBER` - No permission
- `NOT_FRIENDS` - Can't message non-friend
- `INTERNAL_ERROR` - Server error

---

## Security Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                  Untrusted Input                         │
│  (All incoming data from clients via TCP/WebSocket)     │
└──────────────────────┬──────────────────────────────────┘
                       │
                ┌──────▼──────┐
                │  Validate   │
                │  - Length   │
                │  - Type     │
                │  - Format   │
                └──────┬──────┘
                       │
         ┌─────────────▼─────────────┐
         │                           │
    Invalid                     Valid
         │                          │
         ▼                          ▼
    Reject                    Process
    (Send Error)              (Business Logic)
                                   │
                           ┌───────┴────────┐
                           │                │
                      Authenticate      Authorize
                      (User logged in)  (Has permission)
                           │                │
                      ┌────┴────┐      ┌────┴────┐
                      │         │      │         │
                   Valid    Invalid  Valid   Invalid
                      │         │      │         │
                      └────┬────┘      └────┬────┘
                           │                │
                    ┌──────▼──────┐         │
                    │ Execute     │         │
                    │ Action      │         ▼
                    └──────┬──────┘    Reject
                           │
                    ┌──────▼──────┐
                    │ Persist     │
                    │ Changes     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Send        │
                    │ Response    │
                    └─────────────┘
```

---

**Document Information**
- Last Updated: December 19, 2025
- Version: 1.0
