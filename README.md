# TCP Chat Application

A complete TCP-based chat application with a modern web interface, implementing all network programming concepts from the course. This project demonstrates socket programming, I/O multiplexing with `select()`, message framing, and client-server architecture in C, plus a contemporary React web UI with real-time protocol visualization.

**Latest Update**: The web client now features a redesigned UI with a **Server Logs Panel** - an educational tool that displays all protocol messages in real-time, making network programming concepts transparent and learnable.

## Features

### ✅ Core Requirements (17/17 Implemented)

1. **Stream Handling** - Length-prefixed message framing
2. **I/O Multiplexing** - `select()` for handling multiple clients
3. **User Registration** - Account creation with password hashing
4. **Login & Session Management** - Token-based authentication
5. **Friend Requests** - Send friend invitations
6. **Accept/Reject Friends** - Manage friend requests
7. **Remove Friends** - Unfriend functionality
8. **Friends List** - View friends and their status (online/offline)
9. **Direct Messaging** - Send messages between friends
10. **Disconnect Handling** - Graceful disconnection with status updates
11. **Group Creation** - Create chat groups
12. **Group Invitations** - Invite users to groups
13. **Remove from Group** - Admin can remove members
14. **Leave Group** - Users can leave groups
15. **Group Messaging** - Send messages to all group members
16. **Offline Messages** - Queue messages for offline users
17. **Activity Logging** - Comprehensive server-side logging

### ✨ Web Client Features (Modern UI)

The application includes a modern React-based web client with:

- **Server Logs Panel** - Real-time visualization of all protocol messages (the key educational feature)
  - Color-coded by category (Authentication, Friends, Messaging, Groups, Status, Errors, System)
  - Request/response pairing with latency metrics
  - Advanced filtering and full-text search
  - Export capabilities (JSON and TXT formats)
  - Pause/resume functionality

- **4-Panel Desktop Layout** - Intuitive organization
  - Header (64px) - Connection status, theme toggle, user menu, logs toggle
  - Navigation Sidebar (280px) - Friends, Groups, Online Users tabs
  - Chat Area (flexible) - Message list and input
  - Server Logs Panel (400px, collapsible) - Real-time protocol logs

- **Dark Mode by Default** - Modern, eye-friendly interface
- **Responsive Design** - Tablet and mobile support
- **Real-time Messaging** - Instant WebSocket communication
- **Friend & Group Management** - Full UI for all features
- **Theme Toggle** - Light/Dark mode with persistent preference

See [Web Client Guide](/web-client/README.md) and [Server Logs Documentation](/web-client/docs/SERVER_LOGS_FEATURE.md) for details.

## Architecture

### Technology Stack

**Backend (TCP Server)**:
- **Language**: C (C99 standard)
- **I/O Model**: I/O Multiplexing with `select()`
- **Protocol**: Custom binary protocol with length-prefixed framing
- **Threading**: POSIX threads for client receive handler
- **Byte Order**: Network byte order (big-endian) for protocol headers

**WebSocket Bridge**:
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Purpose**: Translates between WebSocket (JSON) and TCP (binary) protocols

**Web Client**:
- **Framework**: React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Protocol Visualization**: Real-time Server Logs Panel

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHAT SERVER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   select()   │  │   Session    │  │   Message    │          │
│  │   I/O Loop   │──│   Manager    │──│   Router     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│          │                │                │                    │
│          └────────────────┴────────────────┘                    │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │ TCP Connections
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
   │ Client A  │    │ Client B  │    │ Client C  │
   └───────────┘    └───────────┘    └───────────┘
```

### Project Structure

```
chat_tcp_socket/
├── Makefile
├── README.md
├── include/                # Header files
│   ├── common.h            # Common definitions
│   ├── protocol.h          # Protocol definitions
│   ├── server.h            # Server structures
│   ├── user.h              # User management
│   ├── friend.h            # Friend management
│   ├── group.h             # Group management
│   ├── message.h           # Message handling
│   └── logger.h            # Logging
├── src/
│   ├── server/
│   │   ├── main.c          # Server entry point
│   │   ├── server.c        # Server logic with select()
│   │   └── handlers.c      # Message handlers
│   ├── client/
│   │   ├── main.c          # Client entry point
│   │   ├── client.c        # Client logic
│   │   └── ui.c            # Command-line interface
│   └── common/
│       ├── protocol.c      # Message serialization
│       ├── user.c          # User operations
│       ├── friend.c        # Friend operations
│       ├── group.c         # Group operations
│       ├── message.c       # Message operations
│       └── logger.c        # Logging
├── bin/                    # Compiled binaries
├── data/                   # Database files
└── logs/                   # Activity logs
```

## Building the Project

### Prerequisites

- GCC compiler
- POSIX-compliant system (Linux, macOS, BSD)
- GNU Make

### Compilation

```bash
# Build both server and client
make

# Build only server
make server

# Build only client
make client

# Clean build artifacts
make clean
```

## Usage

### Starting the Server

```bash
# Start server on default port (8888)
./bin/server

# Start server on custom port
./bin/server 9999
```

### Starting the Client

```bash
# Connect to localhost on default port
./bin/client

# Connect to custom server
./bin/client 192.168.1.100 9999
```

## Client Commands

### Authentication

```
register <username> <password> <email>  - Register new account
login <username> <password>              - Login to account
logout                                   - Logout and disconnect
```

**Example:**
```
> register alice password123 alice@example.com
Registration successful! User ID: 1

> login alice password123
Login successful! Welcome, alice
```

### Friend Management

```
friend add <username>       - Send friend request
friend accept <user_id>     - Accept friend request
friend reject <user_id>     - Reject friend request
friend remove <user_id>     - Remove friend
friend list                 - Show friends list with status
```

**Example:**
```
> friend add bob
Request sent

> friend list
=== Friends List (2) ===
  bob (ID: 2) - online
  charlie (ID: 3) - offline
=======================
```

### Direct Messaging

```
msg <user_id> <message>     - Send message to friend
```

**Example:**
```
> msg 2 Hello Bob!
Message sent successfully

[MESSAGE from bob]: Hi Alice!
```

### Group Chat

```
group create <name> [description]       - Create new group
group join <group_id>                   - Join a group
group leave <group_id>                  - Leave a group
group invite <group_id> <user_id>       - Invite user to group
group msg <group_id> <message>          - Send message to group
```

**Example:**
```
> group create StudyGroup Study group for CS course
Group created successfully! Group ID: 1

> group invite 1 2
Invitation sent

> group msg 1 Hey everyone!
Group message sent successfully

[GROUP StudyGroup - bob]: Hi there!
```

### Other Commands

```
help    - Show command list
quit    - Exit application
```

## Protocol Design

### Message Format

All messages use length-prefixed framing to handle TCP's stream-oriented nature:

```
+--------+--------+--------+--------+...+--------+
|   LENGTH (4 bytes)      | TYPE(2)|   PAYLOAD   |
+--------+--------+--------+--------+...+--------+
```

- **Length** (4 bytes): Total message length including header (network byte order)
- **Type** (2 bytes): Message type identifier (network byte order)
- **Payload** (variable): Message content

### Message Types

**Authentication (0x01-0x0F)**
- `0x01` MSG_REGISTER
- `0x02` MSG_REGISTER_ACK
- `0x03` MSG_LOGIN
- `0x04` MSG_LOGIN_ACK
- `0x05` MSG_LOGOUT
- `0x06` MSG_LOGOUT_ACK

**Friends (0x20-0x2F)**
- `0x20` MSG_FRIEND_REQUEST
- `0x21` MSG_FRIEND_REQUEST_ACK
- `0x22` MSG_FRIEND_ACCEPT
- `0x24` MSG_FRIEND_REJECT
- `0x26` MSG_FRIEND_REMOVE
- `0x28` MSG_FRIEND_LIST
- `0x29` MSG_FRIEND_LIST_RSP
- `0x2A` MSG_FRIEND_NOTIFY
- `0x2B` MSG_STATUS_NOTIFY

**Chat (0x30-0x3F)**
- `0x30` MSG_CHAT_SEND
- `0x31` MSG_CHAT_DELIVER
- `0x32` MSG_CHAT_ACK

**Groups (0x40-0x4F)**
- `0x40` MSG_GROUP_CREATE
- `0x42` MSG_GROUP_INVITE
- `0x44` MSG_GROUP_JOIN
- `0x46` MSG_GROUP_LEAVE
- `0x48` MSG_GROUP_REMOVE_USER
- `0x4A` MSG_GROUP_MSG
- `0x4B` MSG_GROUP_MSG_DELIVER

**System (0xF0-0xFF)**
- `0xF0` MSG_ERROR
- `0xFE` MSG_HEARTBEAT

## Key Technical Concepts

### 1. Stream Handling (Requirement #1)

TCP is a byte-stream protocol without message boundaries. We solve this using **length-prefixed framing**:

```c
// Sending: prepend length header
uint32_t total_len = HEADER_SIZE + data_len;
*(uint32_t*)buffer = htonl(total_len);  // Network byte order

// Receiving: read header first, then exact payload
while (received < HEADER_SIZE) {
    int n = recv(sockfd, header + received, HEADER_SIZE - received, 0);
    received += n;
}
uint32_t length = ntohl(*(uint32_t*)header);
```

### 2. I/O Multiplexing with select() (Requirement #2)

The server uses `select()` to handle multiple clients concurrently without threads:

```c
fd_set read_fds;
while (1) {
    read_fds = master_set;
    select(max_fd + 1, &read_fds, NULL, NULL, &timeout);

    // Check listening socket for new connections
    if (FD_ISSET(listen_fd, &read_fds)) {
        accept_new_client();
    }

    // Check client sockets for data
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (FD_ISSET(clients[i].fd, &read_fds)) {
            handle_client_data(i);
        }
    }
}
```

**Why select()?**
- Handles multiple clients without creating threads/processes
- Portable across POSIX systems
- Appropriate for moderate client counts (<1000)
- Matches course curriculum (Lecture 06)

### 3. Session Management (Requirement #4)

After successful login:
1. Server creates session with random token
2. Token stored in server memory
3. Client info linked to user_id
4. Session timeout: 5 minutes of inactivity

### 4. Status Notifications (Requirement #10)

When a user logs in/out:
1. User status updated to "online"/"offline"
2. Server gets friend list
3. Broadcasts status change to all online friends
4. Friends receive `MSG_STATUS_NOTIFY`

### 5. Offline Message Queue (Requirement #16)

When sending to offline user:
1. Message saved to database
2. Added to offline queue
3. On login, server delivers all queued messages
4. Messages marked as delivered

## Data Persistence

All data is stored in binary files in the `data/` directory:

- `users.dat` - User accounts
- `friends.dat` - Friendship relationships
- `groups.dat` - Groups and members
- `messages.dat` - Message history

Files are loaded on server startup and saved after modifications.

## Logging

Server activity is logged to `logs/server.log`:

```
[2025-12-05 10:30:15] User=1 Event=LOGIN Data=alice
[2025-12-05 10:30:22] User=1 Event=FRIEND_REQUEST Data=bob
[2025-12-05 10:30:45] User=1 Event=CHAT_SEND Data=Sent message
[2025-12-05 10:35:10] User=1 Event=LOGOUT Data=User logged out
```

Event types include:
- Authentication: REGISTER, LOGIN, LOGIN_FAIL, LOGOUT
- Friends: FRIEND_REQUEST, FRIEND_ACCEPT, FRIEND_REJECT, FRIEND_REMOVE
- Groups: GROUP_CREATE, GROUP_JOIN, GROUP_LEAVE, GROUP_INVITE
- Messaging: CHAT_SEND, GROUP_MSG
- System: CONNECT, DISCONNECT, ERROR

## Testing

### Basic Flow Test

**Terminal 1 - Server:**
```bash
./bin/server
```

**Terminal 2 - Client A (Alice):**
```bash
./bin/client
> register alice password123 alice@example.com
> login alice password123
```

**Terminal 3 - Client B (Bob):**
```bash
./bin/client
> register bob password456 bob@example.com
> login bob password456
> friend add alice
```

**Back to Client A:**
```
[FRIEND NOTIFICATION] bob wants to be your friend
> friend accept 2
> msg 2 Hello Bob!
```

**Back to Client B:**
```
[MESSAGE from alice]: Hello Bob!
> msg 1 Hi Alice!
```

## Limitations and Future Improvements

### Current Limitations

1. **Security**: Simple password hashing (DJB2) - should use bcrypt/argon2
2. **Scalability**: select() limited to ~1024 file descriptors
3. **Storage**: Binary files - should use SQLite or PostgreSQL
4. **Threading**: Single-threaded server

### Potential Improvements

1. Use `epoll()` (Linux) or `kqueue()` (BSD/macOS) for better scalability
2. Implement proper password hashing (bcrypt, argon2id)
3. Add database support (SQLite)
4. Add TLS/SSL encryption
5. Implement file transfer
6. Add typing indicators
7. Read receipts
8. Message history retrieval
9. User profiles with avatars
10. Persistent group chat history

## References

This project implements concepts from:

- **Lec03**: Socket API Introduction
- **Lec04**: Elementary Sockets Programming
- **Lec05**: Concurrent Server
- **Lec06**: I/O Multiplexing
- **Lec07**: Advanced I/O

### Key Concepts Applied

✅ TCP Socket Programming (socket, bind, listen, accept, connect)
✅ Message Framing (length-prefixed protocol)
✅ Byte Order Conversion (htonl, ntohl, htons, ntohs)
✅ I/O Multiplexing (select, fd_set)
✅ Session Management
✅ Non-blocking considerations

## License

This is an educational project for the Network Programming course at HUST.

## Author

Created as coursework for IT4062 Network Programming course, following the technical specifications in `docs/tcp_chat_plan_vn.md`.

---

**Note**: This application is designed for educational purposes to demonstrate network programming concepts. For production use, additional security measures, error handling, and testing would be required.
