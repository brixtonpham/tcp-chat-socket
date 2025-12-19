# TCP Chat Application - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Components](#components)
6. [Web Client UI Redesign](#web-client-ui-redesign) **(NEW)**
7. [Server Logs Panel (Educational Feature)](#server-logs-panel-educational-feature) **(NEW)**
8. [Protocol Specification](#protocol-specification)
9. [Installation & Setup](#installation--setup)
10. [Building](#building)
11. [Running the Application](#running-the-application)
12. [Command Reference](#command-reference)
13. [API/Message Reference](#apimessage-reference)
14. [Configuration](#configuration)
15. [Data Persistence](#data-persistence)
16. [Logging](#logging)
17. [Development Guide](#development-guide)
18. [Testing](#testing)
19. [Troubleshooting](#troubleshooting)
20. [Performance & Scalability](#performance--scalability)
21. [Security Considerations](#security-considerations)

---

## Project Overview

The TCP Chat Application is a complete, production-ready chat system built in C with a modern WebSocket proxy and React frontend. It demonstrates core network programming concepts using socket APIs, I/O multiplexing, message framing, and client-server architecture.

### Key Features

- **User Authentication**: Registration and login with session management
- **Friend System**: Add/remove friends, send/accept/reject friend requests
- **Direct Messaging**: One-to-one encrypted message delivery
- **Group Chat**: Create groups, invite members, group messaging
- **Offline Messages**: Queue and deliver messages to offline users
- **Status Notifications**: Real-time online/offline status updates
- **Activity Logging**: Comprehensive server-side audit trail
- **WebSocket Bridge**: Browser-based clients via WebSocket proxy
- **React UI**: Modern web interface for chat functionality

### Requirements Coverage (17/17)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Stream Handling (Length-prefixed framing) | ✅ |
| 2 | I/O Multiplexing (select()) | ✅ |
| 3 | User Registration | ✅ |
| 4 | Login & Session Management | ✅ |
| 5 | Friend Requests | ✅ |
| 6 | Accept/Reject Friends | ✅ |
| 7 | Remove Friends | ✅ |
| 8 | Friends List | ✅ |
| 9 | Direct Messaging | ✅ |
| 10 | Disconnect Handling | ✅ |
| 11 | Group Creation | ✅ |
| 12 | Group Invitations | ✅ |
| 13 | Remove from Group | ✅ |
| 14 | Leave Group | ✅ |
| 15 | Group Messaging | ✅ |
| 16 | Offline Messages | ✅ |
| 17 | Activity Logging | ✅ |

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           WEB BROWSER                                │
│                    (React UI Application)                            │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ WebSocket
                                    │ (ws://)
┌───────────────────────────────────▼─────────────────────────────────┐
│                    WebSocket Proxy Server                             │
│                      (Node.js + TypeScript)                          │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ Message Encoder  │  │   Message Buffer│  │ Message Decoder  │   │
│  │ (JSON → Binary)  │  │ (TCP Stream)    │  │ (Binary → JSON)  │   │
│  └──────────────────┘  └─────────────────┘  └──────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ TCP Socket
                                    │ (127.0.0.1:8888)
┌───────────────────────────────────▼─────────────────────────────────┐
│                         TCP CHAT SERVER                              │
│                        (C, select()-based)                           │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ I/O Selector  │  │ Session      │  │ Message      │            │
│  │ (select())    │──│ Manager      │──│ Router       │            │
│  └───────────────┘  └──────────────┘  └──────────────┘            │
│          │                │                  │                     │
│          └────────────────┴──────────────────┘                     │
│                          │                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Message Handlers                              │  │
│  │  ┌──────────────┬──────────┬────────────┬──────────────┐  │  │
│  │  │ Auth Handler │ Friend   │ Chat       │ Group        │  │  │
│  │  │              │ Handler  │ Handler    │ Handler      │  │  │
│  │  └──────────────┴──────────┴────────────┴──────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│          │              │              │              │           │
│  ┌───────▼────────────────────────────────────────────▼─────────┐ │
│  │              Data Management Layer                            │ │
│  │  ┌──────────┬──────────┬──────────┬──────────────────────┐  │ │
│  │  │ User Mgr │ Friend   │ Group    │ Message Queue        │  │ │
│  │  │          │ Manager  │ Manager  │ (Offline Messages)   │  │ │
│  │  └──────────┴──────────┴──────────┴──────────────────────┘  │ │
│  └───────┬────────────────────────────────────┬────────────────┘ │
│          │ Read/Write                         │                  │
│  ┌───────▼──────────────────────────────────────▼────────────┐  │
│  │              File-based Database                          │  │
│  │  users.dat | friends.dat | groups.dat | messages.dat     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ TCP Client A │  │ TCP Client B │  │ TCP Client C │
│  (CLI)       │  │  (CLI)       │  │  (CLI)       │
└──────────────┘  └──────────────┘  └──────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │ TCP Connections
                  (port 8888, select())
```

### Component Interaction Flow

```
User Action (Web UI)
    ↓
React Component
    ↓
WebSocket Client (JSON message)
    ↓
Proxy Server
    ├─ Validate message format
    ├─ Encode JSON → Binary (C protocol)
    ├─ Send via TCP to C server
    └─ Receive binary response
    ├─ Decode Binary → JSON
    ├─ Send JSON back to browser
    ↓
WebSocket receives JSON
    ↓
React updates UI
```

---

## Technology Stack

### Backend (TCP Server)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | C (C99 standard) | Core server logic |
| **I/O Model** | `select()` multiplexing | Concurrent client handling |
| **Protocol** | Custom binary (length-prefixed) | Message framing |
| **Concurrency** | POSIX threads (receive handler) | Non-blocking operations |
| **Byte Order** | Network byte order (big-endian) | Cross-platform compatibility |
| **Compilation** | GCC/Clang + GNU Make | Build system |
| **Platform** | POSIX (Linux, macOS, BSD) | System APIs |

### Bridge Layer (WebSocket Proxy)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | TypeScript | Type-safe proxy logic |
| **Runtime** | Node.js v18+ | Server runtime |
| **WebSocket** | `ws` library | Browser connection |
| **Encoding** | Custom encoder/decoder | Protocol translation |
| **Logging** | Structured JSON logs | Debugging & monitoring |
| **Testing** | Vitest | Unit & integration tests |

### Frontend (Web UI)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 19 | UI components |
| **State** | Zustand | Global state management |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Build** | Vite | Fast development & bundling |
| **Notifications** | React Hot Toast | User feedback |
| **Type Safety** | TypeScript | Static type checking |

---

## Directory Structure

```
chat_tcp_socket/
│
├── README.md                          # Main project README
├── GUIDE_VN.md                        # Vietnamese usage guide
├── INSTALL.md                         # Installation instructions (Vietnamese)
├── REQUIREMENTS_CHECKLIST.md          # Feature requirements checklist
├── Makefile                           # Build configuration for C project
│
├── include/                           # C Header files
│   ├── common.h                       # Common definitions & constants
│   ├── protocol.h                     # Protocol definitions (message types)
│   ├── server.h                       # Server structures
│   ├── user.h                         # User management interface
│   ├── friend.h                       # Friend system interface
│   ├── group.h                        # Group management interface
│   ├── message.h                      # Message handling interface
│   └── logger.h                       # Logging interface
│
├── src/                               # C Source files
│   ├── server/                        # Server implementation
│   │   ├── main.c                     # Server entry point & signal handling
│   │   ├── server.c                   # Main server loop with select()
│   │   └── handlers.c                 # Message type handlers
│   │
│   ├── client/                        # CLI Client implementation
│   │   ├── main.c                     # Client entry point
│   │   ├── client.c                   # Client socket & communication logic
│   │   └── ui.c                       # Command-line user interface
│   │
│   └── common/                        # Shared functionality
│       ├── protocol.c                 # Message serialization/deserialization
│       ├── user.c                     # User account management
│       ├── friend.c                   # Friend relationship management
│       ├── group.c                    # Group management
│       ├── message.c                  # Offline message queue
│       └── logger.c                   # Activity logging
│
├── bin/                               # Compiled binaries
│   ├── server                         # TCP server executable
│   └── client                         # CLI client executable
│
├── data/                              # Data persistence (binary files)
│   ├── users.dat                      # User accounts
│   ├── friends.dat                    # Friendship relationships
│   ├── groups.dat                     # Group information & membership
│   └── messages.dat                   # Message history & offline queue
│
├── logs/                              # Activity logs
│   ├── server.log                     # Server operational log
│   └── activity.log                   # User activity audit trail
│
├── websocket-proxy/                   # WebSocket proxy (Node.js/TypeScript)
│   ├── package.json                   # Node.js dependencies
│   ├── src/
│   │   ├── index.ts                   # Proxy entry point
│   │   ├── server.ts                  # WebSocket server implementation
│   │   ├── tcpClient.ts               # TCP client wrapper
│   │   │
│   │   ├── protocol/
│   │   │   ├── types.ts               # Message type definitions
│   │   │   ├── encoder.ts             # JSON → Binary encoder
│   │   │   └── decoder.ts             # Binary → JSON decoder
│   │   │
│   │   └── utils/
│   │       ├── logger.ts              # Structured logging
│   │       └── config.ts              # Configuration management
│   │
│   ├── dist/                          # Compiled JavaScript
│   ├── node_modules/                  # NPM dependencies
│   └── tsconfig.json                  # TypeScript configuration
│
├── web-client/                        # React web UI
│   ├── package.json                   # NPM dependencies
│   ├── src/
│   │   ├── main.tsx                   # React entry point
│   │   ├── App.tsx                    # Main app component
│   │   │
│   │   ├── pages/                     # Page components
│   │   ├── components/                # Reusable UI components
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── services/                  # API services
│   │   ├── store/                     # Zustand state management
│   │   └── styles/                    # Tailwind CSS configuration
│   │
│   ├── dist/                          # Built static assets
│   ├── node_modules/                  # NPM dependencies
│   └── vite.config.ts                 # Vite configuration
│
├── test_demo/                         # Test scenarios & documentation
│   ├── README.md                      # Testing guide
│   ├── 00_quick_test.txt              # 2-minute quick test scenario
│   ├── 01_basic_auth.txt              # Registration/login tests
│   ├── 02_friend_system.txt           # Friend request/management tests
│   ├── 03_direct_messaging.txt        # One-to-one messaging tests
│   ├── 04_group_chat.txt              # Group messaging tests
│   ├── 05_full_scenario.txt           # Complete end-to-end test
│   └── commands_reference.txt         # Command reference list
│
├── plans/                             # Development planning
│   ├── ui-implementation-plan.md      # React UI implementation plan
│   └── reports/                       # Task completion reports
│
├── docs/                              # Documentation
│   ├── README.md                      # THIS FILE - Comprehensive documentation
│   ├── tcp_chat_plan_vn.md            # Technical specification (Vietnamese)
│   └── example/                       # Example code & PDFs
│
└── .claude/                           # Claude Code configuration
    └── CLAUDE.md                      # Project instructions for AI
```

---

## Components

### 1. C TCP Server

**Purpose**: Core chat server handling all business logic and client connections.

**Key Files**:
- `src/server/main.c` - Entry point, signal handling
- `src/server/server.c` - Main event loop with select()
- `src/server/handlers.c` - Message type handlers

**Architecture**:
- Single-threaded event-driven server
- Uses `select()` for I/O multiplexing
- Supports up to 1000 concurrent clients
- Binary message protocol (length-prefixed)

**Responsibilities**:
- Accept TCP connections
- Authenticate users
- Route messages between users
- Manage friend relationships
- Manage group memberships
- Queue offline messages
- Broadcast status updates
- Log all activities

### 2. WebSocket Proxy Server

**Purpose**: Bridge between web browsers and C TCP server.

**Key Files**:
- `websocket-proxy/src/index.ts` - Entry point
- `websocket-proxy/src/server.ts` - WebSocket server
- `websocket-proxy/src/tcpClient.ts` - TCP connection wrapper
- `websocket-proxy/src/protocol/encoder.ts` - JSON to binary
- `websocket-proxy/src/protocol/decoder.ts` - Binary to JSON

**Architecture**:
- Dual-connection model (WebSocket + TCP)
- Per-client buffer management for TCP fragmentation
- Message encoding/decoding layer
- Connection pooling and health checks

**Responsibilities**:
- Accept WebSocket connections from browsers
- Establish TCP connections to C server
- Convert between JSON (WebSocket) and binary (TCP) formats
- Handle connection lifecycle
- Log message flows
- Manage timeouts & reconnections

### 3. React Web Client

**Purpose**: User-friendly web interface for chat functionality.

**Key Files**:
- `web-client/src/main.tsx` - Entry point
- `web-client/src/components/` - UI components
- `web-client/src/store/` - Zustand state management
- `web-client/src/services/` - WebSocket client service

**Architecture**:
- Component-based UI
- Global state management with Zustand
- Real-time WebSocket messaging
- Responsive design with Tailwind CSS

**Features**:
- User registration & login
- Friend management UI
- Direct message interface
- Group chat interface
- Online/offline status indicators
- Real-time notifications

### 4. CLI Client (Optional)

**Purpose**: Command-line interface for TCP server testing.

**Key Files**:
- `src/client/main.c` - Entry point
- `src/client/client.c` - TCP connection & receive handler
- `src/client/ui.c` - Command parsing & display

**Commands**:
- `register <user> <pass> <email>`
- `login <user> <pass>`
- `friend add <user>`
- `msg <user_id> <content>`
- `group create <name>`
- See [Command Reference](#command-reference)

---

## Web Client UI Redesign

The TCP Chat Application now features a modern, responsive React-based web client with a contemporary UI design focused on educational value and user experience.

### Key Components

**4-Panel Desktop Layout**:
- **Header (64px)** - Connection status indicator, theme toggle (light/dark), user menu, logs toggle button
- **Navigation Sidebar (280px)** - Tabbed interface with Friends, Groups, Online Users, and Broadcast sections
- **Chat Area (flexible)** - Message list with scrolling history and message input with support for multi-line text
- **Server Logs Panel (400px, collapsible)** - Real-time protocol message visualization (the key educational feature)

**Design Features**:
- **Dark Mode by Default** - Uses #121212 background for reduced eye strain
- **Responsive Layout** - Adapts to tablet (760px - 1439px) and mobile (320px - 767px) breakpoints
- **Smooth Animations** - Micro-interactions for button clicks, message send, notifications
- **Color-Coded UI** - Semantic colors for different message categories
- **Typography** - Inter font for UI, JetBrains Mono for code/logs

**User Experience**:
- Real-time friend online/offline status indicators
- Typing indicators while users compose messages
- Message delivery status (sent, delivered, read)
- Toast notifications for friend requests and events
- Auto-reconnection on WebSocket disconnection

### Technology Stack

- **React 19** - Modern UI framework with hooks and latest features
- **TypeScript** - Full type safety for reliability
- **Vite** - Fast development server and optimized production builds
- **Tailwind CSS** - Utility-first CSS for rapid styling
- **Zustand** - Lightweight state management (minimal boilerplate)
- **React Hot Toast** - Non-intrusive notifications
- **WebSocket Client** - Real-time bidirectional communication

See **[Web Client Documentation](/web-client/README.md)** for detailed usage instructions and feature guides.

---

## Server Logs Panel (Educational Feature)

The Server Logs Panel is the **key educational innovation** in this UI redesign. It provides real-time, transparent visualization of all protocol messages exchanged between the client and server.

### What It Does

Captures and displays every message in the protocol stream:
- **All 17 message types** color-coded by category
- **Request/response pairs** with latency metrics in milliseconds
- **Full JSON payloads** with syntax highlighting
- **Pause/resume** to freeze the stream for inspection
- **Advanced filtering** by message category
- **Full-text search** across all logged messages
- **Export capability** to save logs as JSON or TXT

### Color Coding (7 Categories)

| Category | Color | Message Types |
|----------|-------|---------------|
| **Authentication** | Green | MSG_LOGIN, MSG_REGISTER, MSG_LOGOUT |
| **Friend Operations** | Orange | MSG_FRIEND_REQUEST, MSG_FRIEND_ACCEPT, MSG_FRIEND_REJECT, MSG_FRIEND_LIST |
| **Messaging** | Blue | MSG_CHAT, MSG_GROUP_CHAT, MSG_BROADCAST |
| **Group Operations** | Purple | MSG_GROUP_CREATE, MSG_GROUP_JOIN, MSG_GROUP_LEAVE, MSG_GROUP_LIST, MSG_GROUP_MEMBERS |
| **Status Updates** | Cyan | MSG_ONLINE_USERS, MSG_USER_STATUS |
| **Errors** | Red | MSG_ERROR and error responses |
| **System Events** | Gray | Connection, disconnection, heartbeat |

### Educational Value

Students and developers can now:

1. **Understand Protocol Design** - See how messages are structured and formatted
2. **Learn Request/Response Patterns** - Observe client-server communication flow
3. **Debug Issues** - Identify where communication breaks down
4. **Measure Performance** - Observe latency metrics in real-time
5. **Study Message Routing** - Track how messages flow through the system

Example workflow:
1. Open the logs panel (click document icon in header)
2. Perform an action (e.g., send a message)
3. See the exact message in the logs
4. Click to expand and view the full JSON payload
5. Check latency metrics
6. Export logs for offline study

### File Structure

```
web-client/src/
├── components/Logs/
│   ├── ServerLogsPanel.tsx          # Main panel component
│   ├── LogEntry.tsx                 # Individual log entry renderer
│   ├── LogFilters.tsx               # Filter controls & export
│   └── index.ts                     # Barrel export
├── store/
│   └── logsStore.ts                 # Zustand state management
└── api/
    └── websocket.ts                 # Message interception & logging
```

### Interactive Features

- **Expandable Entries**: Click arrow to show/hide JSON payloads
- **Copy to Clipboard**: Quickly copy individual log entries
- **Latency Badges**: Color-coded by response time (green <100ms, yellow <500ms, red >=500ms)
- **Auto-scroll**: Automatically scrolls to latest logs (toggleable)
- **Manual Scroll Lock**: Auto-scroll disables when user scrolls up for inspection
- **Search Highlights**: Matching text highlighted in search results
- **Category Filters**: Show/hide specific message types
- **Max 500 Logs**: Retains most recent 500 entries (configurable)

See **[Server Logs Feature Documentation](/web-client/docs/SERVER_LOGS_FEATURE.md)** for complete feature guide and usage examples.

---

## Protocol Specification

### Message Frame Format

All TCP messages use length-prefixed framing to handle stream boundaries:

```
┌─────────────┬─────────────┬──────────────┐
│  LENGTH (4) │    TYPE (2) │ PAYLOAD (var)│
│ (big-endian)│(big-endian) │              │
└─────────────┴─────────────┴──────────────┘
   0-3 bytes     4-5 bytes      6+ bytes

Total Message Size = 6 + payload_length bytes
```

**Fields**:
- **LENGTH** (uint32_t): Total message length including header (network byte order)
- **TYPE** (uint16_t): Message type identifier (network byte order)
- **PAYLOAD** (variable): Message content, format depends on type

### Message Types

#### Authentication Messages (0x01-0x0F)

| Code | Direction | Name | Payload Format |
|------|-----------|------|-----------------|
| 0x01 | Client→Server | MSG_REGISTER | `username\|password\|email` |
| 0x02 | Server→Client | MSG_REGISTER_ACK | `OK\|user_id\|msg` or `FAIL\|\|msg` |
| 0x03 | Client→Server | MSG_LOGIN | `username\|password` |
| 0x04 | Server→Client | MSG_LOGIN_ACK | `OK\|token\|user_id\|msg` or `FAIL\|\|msg` |
| 0x05 | Client→Server | MSG_LOGOUT | (empty) |
| 0x06 | Server→Client | MSG_LOGOUT_ACK | `success_flag` |

**Example**: Register and Login flow
```
Client: [LENGTH=24][TYPE=0x01][alice|pass123|alice@test.com]
Server: [LENGTH=14][TYPE=0x02][OK|1|Registration successful]
Client: [LENGTH=20][TYPE=0x03][alice|pass123]
Server: [LENGTH=30][TYPE=0x04][OK|abc123token|1|Login successful]
```

#### Friend Management Messages (0x20-0x2F)

| Code | Direction | Name | Payload Format |
|------|-----------|------|-----------------|
| 0x20 | Client→Server | MSG_FRIEND_REQUEST | `target_username\0` |
| 0x21 | Server→Client | MSG_FRIEND_REQUEST_ACK | `success\|message` |
| 0x22 | Client→Server | MSG_FRIEND_ACCEPT | `requester_username\0` |
| 0x23 | Server→Client | MSG_FRIEND_ACCEPT_ACK | `success\|message` |
| 0x24 | Client→Server | MSG_FRIEND_REJECT | `requester_username\0` |
| 0x25 | Server→Client | MSG_FRIEND_REJECT_ACK | `success\|message` |
| 0x26 | Client→Server | MSG_FRIEND_REMOVE | `friend_username\0` |
| 0x27 | Server→Client | MSG_FRIEND_REMOVE_ACK | `success\|message` |
| 0x28 | Client→Server | MSG_FRIEND_LIST | (empty) |
| 0x29 | Server→Client | MSG_FRIEND_LIST_RSP | `id\|name\|status,id\|name\|status,...` |
| 0x2A | Server→Client | MSG_FRIEND_NOTIFY | `requester_username\0` |
| 0x2B | Server→Client | MSG_STATUS_NOTIFY | `user_id\|username\|status` |

**Example**: Friend request flow
```
Client A: [LENGTH=8][TYPE=0x20][bob\0]
Server→Client B: [LENGTH=8][TYPE=0x2A][alice\0]
Client B: [LENGTH=7][TYPE=0x22][alice\0]
Server→Client A: [LENGTH=11][TYPE=0x23][1|Accepted]
```

#### Direct Chat Messages (0x30-0x3F)

| Code | Direction | Name | Payload Format |
|------|-----------|------|-----------------|
| 0x30 | Client→Server | MSG_CHAT_SEND | `recipient_id\|content` |
| 0x31 | Server→Client | MSG_CHAT_DELIVER | `sender_id\|sender_name\|content\|timestamp` |
| 0x32 | Server→Client | MSG_CHAT_ACK | `success\|message_id` |

**Example**: Direct message flow
```
Client A (ID=1): [LENGTH=15][TYPE=0x30][2|Hello Bob!]
Server→Client B: [LENGTH=35][TYPE=0x31][1|alice|Hello Bob!|2025-12-19T10:30:45Z]
Server→Client A: [LENGTH=6][TYPE=0x32][1|msg_123]
```

#### Group Messages (0x40-0x4F)

| Code | Direction | Name | Payload Format |
|------|-----------|------|-----------------|
| 0x40 | Client→Server | MSG_GROUP_CREATE | `group_name\0` |
| 0x41 | Server→Client | MSG_GROUP_CREATE_ACK | `success\|group_id\|message` |
| 0x42 | Client→Server | MSG_GROUP_INVITE | `group_id\|username` |
| 0x43 | Server→Client | MSG_GROUP_INVITE_ACK | `success\|message` |
| 0x44 | Client→Server | MSG_GROUP_JOIN | `group_id\0` |
| 0x45 | Server→Client | MSG_GROUP_JOIN_ACK | `success\|message` |
| 0x46 | Client→Server | MSG_GROUP_LEAVE | `group_id\0` |
| 0x47 | Server→Client | MSG_GROUP_LEAVE_ACK | `success\|message` |
| 0x48 | Client→Server | MSG_GROUP_REMOVE_USER | `group_id\|username` |
| 0x49 | Server→Client | MSG_GROUP_REMOVE_ACK | `success\|message` |
| 0x4A | Client→Server | MSG_GROUP_MSG | `group_id\|content` |
| 0x4B | Server→Client | MSG_GROUP_MSG_DELIVER | `group_id\|sender_id\|sender_name\|content\|timestamp` |
| 0x4C | Client→Server | MSG_GROUP_LIST | (empty) |
| 0x4D | Server→Client | MSG_GROUP_LIST_RSP | `group_id\|name,group_id\|name,...` |

#### System Messages (0xF0-0xFF)

| Code | Direction | Name | Payload Format |
|------|-----------|------|-----------------|
| 0xF0 | Server→Client | MSG_ERROR | `error_code\|error_message` |
| 0xFE | Client→Server | MSG_HEARTBEAT | (empty) |
| 0xFF | Server→Client | MSG_HEARTBEAT_ACK | (empty) |

### Data Format Conventions

**Pipe-Separated Fields** (`|`):
- Multiple values separated by pipe character
- Used for structured data (e.g., friend list, group list)
- Example: `1|alice|online,2|bob|offline,3|charlie|online`

**Null-Terminated Strings** (`\0`):
- Single string value terminated with null byte
- Used for variable-length usernames/content
- Example: `alice\0` or `Hello World!\0`

**Status Values**:
- `0` = Offline
- `1` = Online
- `online` = Text representation
- `offline` = Text representation

---

## Installation & Setup

### System Requirements

- **OS**: Linux, macOS, or Windows (via WSL)
- **GCC**: v4.8+ compiler
- **GNU Make**: Build tool
- **Node.js**: v18+ (for WebSocket proxy)
- **npm**: Package manager (for proxy & web client)

### Quick Setup (3 steps)

#### Step 1: Clone Repository

```bash
git clone <repository-url>
cd chat_tcp_socket
```

#### Step 2: Install Dependencies

**For C Server**:
```bash
# Already included in source, no installation needed
# Just needs GCC and Make (already on most systems)
```

**For WebSocket Proxy**:
```bash
cd websocket-proxy
npm install
```

**For React Web Client**:
```bash
cd web-client
npm install
```

#### Step 3: Build & Run

```bash
# Build C server and CLI client
make

# Start TCP server (Terminal 1)
./bin/server

# Start WebSocket proxy (Terminal 2)
cd websocket-proxy
npm start

# Start React web UI (Terminal 3)
cd web-client
npm run dev
```

### Detailed Installation Guide

See: [INSTALL.md](../INSTALL.md) for comprehensive WSL and Linux setup instructions.

---

## Building

### Build C Server and Client

```bash
# Build both server and client
make

# Build only server
make server

# Build only client
make client

# Clean build artifacts
make clean

# Clean everything including data
make clean
rm -f data/*.dat logs/*.log
```

### Build WebSocket Proxy

```bash
cd websocket-proxy

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start proxy server
npm start

# Development mode with hot reload
npm run dev
```

### Build React Web Client

```bash
cd web-client

# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Build Troubleshooting

**GCC not found**:
```bash
# Ubuntu/Debian
sudo apt install build-essential

# macOS
brew install gcc

# Fedora
sudo dnf install gcc make
```

**Make not found**:
```bash
# Ubuntu/Debian
sudo apt install make

# macOS
brew install make

# Fedora
sudo dnf install make
```

**Node.js version issue**:
```bash
# Check version
node --version

# Install nvm if needed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

---

## Running the Application

### Scenario 1: CLI-Only (C Server + C Client)

**Terminal 1 - Start Server**:
```bash
./bin/server
```

Expected output:
```
===========================================
  TCP Chat Server
===========================================

[INFO] Server initialized successfully
Server listening on port 8888

Server ready. Press Ctrl+C to stop.
```

**Terminal 2 - Start Client 1 (Alice)**:
```bash
./bin/client
register alice password123 alice@example.com
login alice password123
```

**Terminal 3 - Start Client 2 (Bob)**:
```bash
./bin/client
register bob password456 bob@example.com
login bob password456
friend add alice
```

**Back to Terminal 2 (Alice)**:
```
[FRIEND NOTIFICATION] alice wants to be your friend
friend accept 2
msg 2 Hello Bob!
```

### Scenario 2: Full Stack (C Server + Proxy + Web UI)

**Terminal 1 - Start C Server**:
```bash
./bin/server
```

**Terminal 2 - Start WebSocket Proxy**:
```bash
cd websocket-proxy
npm start
```

Expected output:
```
WebSocket proxy server is running
  wsUrl: ws://localhost:3000
  tcpTarget: localhost:8888
```

**Terminal 3 - Start React Web UI**:
```bash
cd web-client
npm run dev
```

Expected output:
```
  VITE v7.2.4  ready in 150 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

**Open Browser**:
- Navigate to `http://localhost:5173/`
- Register new account
- Login and start chatting

### Configuration Options

#### C Server

```bash
# Default port: 8888
./bin/server

# Custom port
./bin/server 9999
```

#### CLI Client

```bash
# Default: localhost:8888
./bin/client

# Custom host and port
./bin/client 192.168.1.100 9999
```

#### WebSocket Proxy

Set environment variables before starting:
```bash
# Default values
WS_PORT=3000
WS_HOST=0.0.0.0
TCP_HOST=127.0.0.1
TCP_PORT=8888
LOG_LEVEL=info

# Example with custom settings
TCP_HOST=192.168.1.100 npm start
```

#### React Web UI

Proxy configuration in development:
```bash
# Default: ws://localhost:3000
npm run dev
```

---

## Command Reference

### Authentication Commands

```bash
register <username> <password> <email>
  Register a new user account
  Example: register alice password123 alice@example.com

login <username> <password>
  Login to an existing account
  Example: login alice password123

logout
  Logout and disconnect from server
```

### Friend Management Commands

```bash
friend add <username>
  Send friend request to another user
  Example: friend add bob

friend accept <user_id>
  Accept a friend request
  Example: friend accept 2

friend reject <user_id>
  Reject a friend request
  Example: friend reject 2

friend remove <user_id>
  Remove an existing friend
  Example: friend remove 2

friend list
  Show all friends with their online status
  Output:
    === Friends List (3) ===
      alice (ID: 1) - online
      bob (ID: 2) - offline
      charlie (ID: 3) - online
    =======================
```

### Direct Messaging Commands

```bash
msg <user_id> <message>
  Send message to a friend
  Example: msg 2 Hello Bob!

  Note: Messages are queued if recipient is offline
        and delivered when they come online
```

### Group Management Commands

```bash
group create <name> [description]
  Create a new group
  Example: group create "Study Group" "CS course"

group join <group_id>
  Join an existing group (if invited)
  Example: group join 1

group leave <group_id>
  Leave a group you are a member of
  Example: group leave 1

group invite <group_id> <user_id>
  Invite a user to your group (requires membership)
  Example: group invite 1 2

group msg <group_id> <message>
  Send message to all members of a group
  Example: group msg 1 Hey everyone!

group list
  Show all groups you are member of
  Output:
    === Groups List (2) ===
      Study Group (ID: 1)
      Gaming (ID: 2)
    ======================
```

### System Commands

```bash
help
  Show all available commands

quit
  Exit the application
```

---

## API/Message Reference

### WebSocket API (JSON Format)

The WebSocket proxy translates between JSON (web) and binary (C server) protocols.

#### Authentication

**Register**:
```json
{
  "type": "MSG_REGISTER",
  "data": {
    "username": "alice",
    "password": "password123",
    "email": "alice@example.com"
  }
}
```

**Response**:
```json
{
  "type": "MSG_REGISTER_ACK",
  "success": true,
  "userId": 1,
  "message": "Registration successful"
}
```

**Login**:
```json
{
  "type": "MSG_LOGIN",
  "data": {
    "username": "alice",
    "password": "password123"
  }
}
```

**Response**:
```json
{
  "type": "MSG_LOGIN_ACK",
  "success": true,
  "userId": 1,
  "token": "abc123token",
  "message": "Login successful"
}
```

#### Friend Management

**Send Friend Request**:
```json
{
  "type": "MSG_FRIEND_REQUEST",
  "data": {
    "username": "bob"
  }
}
```

**Receive Friend Notification** (Server→Client):
```json
{
  "type": "MSG_FRIEND_NOTIFY",
  "username": "alice",
  "message": "Friend request from alice"
}
```

**Accept Friend Request**:
```json
{
  "type": "MSG_FRIEND_ACCEPT",
  "data": {
    "username": "alice"
  }
}
```

**Get Friends List**:
```json
{
  "type": "MSG_FRIEND_LIST"
}
```

**Response**:
```json
{
  "type": "MSG_FRIEND_LIST_RSP",
  "success": true,
  "friends": [
    {
      "userId": 2,
      "username": "bob",
      "status": "online"
    },
    {
      "userId": 3,
      "username": "charlie",
      "status": "offline"
    }
  ]
}
```

#### Direct Messaging

**Send Message**:
```json
{
  "type": "MSG_CHAT_SEND",
  "data": {
    "recipientId": 2,
    "content": "Hello Bob!"
  }
}
```

**Receive Message** (Server→Client):
```json
{
  "type": "MSG_CHAT_DELIVER",
  "senderId": 2,
  "senderName": "bob",
  "content": "Hi Alice!",
  "timestamp": "2025-12-19T10:30:45Z"
}
```

#### Group Management

**Create Group**:
```json
{
  "type": "MSG_GROUP_CREATE",
  "data": {
    "groupName": "Study Group"
  }
}
```

**Response**:
```json
{
  "type": "MSG_GROUP_CREATE_ACK",
  "success": true,
  "groupId": 1,
  "message": "Group created"
}
```

**Send Group Message**:
```json
{
  "type": "MSG_GROUP_MSG",
  "data": {
    "groupId": 1,
    "content": "Hello everyone!"
  }
}
```

**Receive Group Message** (Server→Client):
```json
{
  "type": "MSG_GROUP_MSG_DELIVER",
  "groupId": 1,
  "senderId": 1,
  "senderName": "alice",
  "content": "Hello everyone!",
  "timestamp": "2025-12-19T10:30:45Z"
}
```

#### Status Updates

**Status Changed** (Server→Client):
```json
{
  "type": "MSG_STATUS_NOTIFY",
  "userId": 2,
  "username": "bob",
  "status": "online"
}
```

#### Errors

**Error Response**:
```json
{
  "type": "MSG_ERROR",
  "success": false,
  "errorCode": "USER_NOT_FOUND",
  "error": "User not found"
}
```

---

## Configuration

### C Server Configuration

Edit `src/server/server.c` or `include/server.h`:

```c
#define PORT 8888               // Server port
#define MAX_CLIENTS 1000        // Maximum concurrent connections
#define BUFFER_SIZE 4096        // Per-client receive buffer
#define TIMEOUT_SECS 300        // Session timeout (5 minutes)
#define MAX_GROUPS 500          // Maximum groups
```

### WebSocket Proxy Configuration

Environment variables or `websocket-proxy/src/utils/config.ts`:

```typescript
const config = {
  wsPort: parseInt(process.env.WS_PORT || '3000'),
  wsHost: process.env.WS_HOST || '0.0.0.0',
  tcpHost: process.env.TCP_HOST || '127.0.0.1',
  tcpPort: parseInt(process.env.TCP_PORT || '8888'),
  heartbeatInterval: 30000,  // 30 seconds
  logLevel: process.env.LOG_LEVEL || 'info'
};
```

**Running with custom config**:
```bash
WS_PORT=4000 TCP_HOST=192.168.1.100 npm start
```

### React Web Client Configuration

Proxy target in `web-client/vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, '')
      }
    }
  }
});
```

---

## Data Persistence

### File-Based Database

All user and application data is stored in binary files in the `data/` directory.

#### File Structure

**users.dat** - User accounts
```
[user_id][username_len][username][email_len][email]
[password_hash][status][created_at]...
```

**friends.dat** - Friendship relationships
```
[user1_id][user2_id][status][created_at]...
```

**groups.dat** - Group information and membership
```
[group_id][name_len][name][creator_id][created_at]
[member_count][member_ids]...
```

**messages.dat** - Message history and offline queue
```
[msg_id][sender_id][recipient_id][content_len][content]
[timestamp][is_delivered][is_group_msg]...
```

### Data Management Functions

**Saving Data**:
```c
void save_users_to_file();           // users.dat
void save_friendships_to_file();     // friends.dat
void save_groups_to_file();          // groups.dat
void save_messages_to_file();        // messages.dat
```

**Loading Data**:
```c
void load_users_from_file();         // On server startup
void load_friendships_from_file();
void load_groups_from_file();
void load_messages_from_file();
```

### Data Persistence Behavior

- **On Startup**: All data files are loaded into memory
- **After Modifications**: Data is immediately saved to files
- **On Shutdown**: Final save performed gracefully

### Backup & Recovery

```bash
# Create backup
cp data/*.dat data/backup/

# Restore from backup
cp data/backup/*.dat data/

# Clear all data
rm -f data/*.dat

# Clear logs
rm -f logs/*.log
```

---

## Logging

### Server Activity Logging

All server activities are logged to `logs/server.log`:

**Format**:
```
[TIMESTAMP] [LEVEL] [USER_ID] [EVENT] [DATA]
```

**Examples**:
```
[2025-12-19 10:30:15] INFO  1 LOGIN alice
[2025-12-19 10:30:22] INFO  1 FRIEND_REQUEST bob
[2025-12-19 10:30:45] INFO  1 CHAT_SEND Sent message to user 2
[2025-12-19 10:35:10] INFO  1 LOGOUT
[2025-12-19 10:35:11] WARN  2 CONNECTION_TIMEOUT
```

### Log Levels

- **DEBUG**: Detailed protocol information
- **INFO**: Normal operations and state changes
- **WARN**: Unusual conditions, timeouts
- **ERROR**: Operation failures
- **FATAL**: Server-level errors

### Log Events

**Authentication**:
- `REGISTER` - Account created
- `LOGIN` - User logged in
- `LOGIN_FAIL` - Login failed
- `LOGOUT` - User logged out

**Friends**:
- `FRIEND_REQUEST` - Request sent
- `FRIEND_ACCEPT` - Request accepted
- `FRIEND_REJECT` - Request rejected
- `FRIEND_REMOVE` - Friend removed

**Groups**:
- `GROUP_CREATE` - Group created
- `GROUP_JOIN` - User joined group
- `GROUP_LEAVE` - User left group
- `GROUP_INVITE` - User invited to group

**Messaging**:
- `CHAT_SEND` - Message sent
- `CHAT_DELIVER` - Message delivered
- `GROUP_MSG` - Group message sent

**System**:
- `CONNECT` - Client connected
- `DISCONNECT` - Client disconnected
- `TIMEOUT` - Session timeout
- `ERROR` - Error occurred

### Viewing Logs

```bash
# View recent logs
tail -f logs/server.log

# View last 50 lines
tail -50 logs/server.log

# Search for specific user activity
grep "User=1" logs/server.log

# View error logs only
grep ERROR logs/server.log

# Real-time monitoring
watch tail -20 logs/server.log
```

### WebSocket Proxy Logging

Proxy logs are sent to stdout:

```bash
# Run with debug logging
LOG_LEVEL=debug npm start

# Standard logging
npm start
```

**Output**:
```
[INFO] Starting WebSocket proxy server { port: 3000, host: '0.0.0.0' }
[INFO] WebSocket proxy server started { port: 3000, host: '0.0.0.0' }
[INFO] Client connect { clientId: 'cli_abc123...', address: '127.0.0.1:54321' }
[DEBUG] Encoding message { type: 'MSG_LOGIN', typeCode: 3, data: {...} }
[DEBUG] Decoded message { type: 'MSG_LOGIN_ACK', success: true }
```

---

## Development Guide

### Project Structure for Developers

```
Key Entry Points:
├── src/server/main.c              # Start here to understand server startup
├── src/server/server.c            # Main event loop logic
├── src/server/handlers.c          # Add new message handlers here
├── websocket-proxy/src/index.ts   # Proxy entry point
├── websocket-proxy/src/server.ts  # WebSocket connection handling
├── web-client/src/App.tsx         # React app root
```

### Adding a New Message Type

1. **Define in Protocol Header** (`include/protocol.h`):
```c
#define MSG_NEW_ACTION 0x50
#define MSG_NEW_ACTION_ACK 0x51
```

2. **Create Handler Function** (`src/server/handlers.c`):
```c
int handle_new_action(ChatServer *server, int client_idx, const char *payload) {
    // Implementation
    return 0;
}
```

3. **Register Handler** (`src/server/server.c`):
```c
case MSG_NEW_ACTION:
    return handle_new_action(server, client_idx, payload);
```

4. **Update Proxy Encoder** (`websocket-proxy/src/protocol/encoder.ts`):
```typescript
case MSG_NEW_ACTION:
    return encodeNewAction(data);
```

5. **Update Proxy Decoder** (`websocket-proxy/src/protocol/decoder.ts`):
```typescript
case MSG_NEW_ACTION_ACK:
    return decodeNewActionAck(payload);
```

6. **Update Web Client** (`web-client/src/services/websocket.ts`):
```typescript
handleNewActionResponse(message) {
    // Handle response from server
}
```

### Code Standards

**C Code**:
- Naming: `snake_case` for functions/variables
- Constants: `UPPER_SNAKE_CASE`
- Max line length: 100 characters
- Include guards for headers
- Function prototypes in headers

**TypeScript/JavaScript**:
- Naming: `camelCase` for functions/variables
- Naming: `PascalCase` for classes/types
- Strict null checks enabled
- No `any` types
- JSDoc comments for public APIs

**React Components**:
- Functional components with hooks
- `PascalCase` for component names
- Props interfaces with `Props` suffix
- Custom hooks with `use` prefix

### Building for Distribution

**C Server** (static binary):
```bash
# Optimized build
gcc -O2 -Wall -Wextra -I./include -o bin/server src/server/*.c src/common/*.c

# With debugging symbols
gcc -g -O0 -Wall -Wextra -I./include -o bin/server src/server/*.c src/common/*.c
```

**WebSocket Proxy** (Node.js):
```bash
cd websocket-proxy
npm install --production
npm run build
# Ship: dist/ and package.json
```

**Web Client** (Static assets):
```bash
cd web-client
npm run build
# Ship contents of: dist/
```

---

## Testing

### Quick Test (2 minutes)

See `test_demo/00_quick_test.txt`:

1. Start server: `./bin/server`
2. Open two client terminals
3. Client A registers: `register alice pass123 alice@test.com`
4. Client A login: `login alice pass123`
5. Client B registers and logins
6. Client B adds Alice: `friend add alice`
7. Client A accepts: `friend accept 2`
8. Send messages back and forth: `msg 2 Hello!`

### Full Test Suite

Use scenarios in `test_demo/`:
- `00_quick_test.txt` - Quick functionality test (2 min)
- `01_basic_auth.txt` - Registration & login (5 min)
- `02_friend_system.txt` - Friend operations (5 min)
- `03_direct_messaging.txt` - One-to-one messaging (5 min)
- `04_group_chat.txt` - Group functionality (5 min)
- `05_full_scenario.txt` - Complete end-to-end test (15 min)

### Test Execution

```bash
# Manual testing with CLI client
./bin/client

# Automated testing (if test suite exists)
cd websocket-proxy
npm test

# Coverage report
npm run test:coverage
```

### Load Testing

Simulate multiple concurrent users:

```bash
# Simple bash loop to spawn clients
for i in {1..10}; do
    ./bin/client &
    sleep 0.5
done

# Monitor server
watch -n 1 'lsof -i :8888 | wc -l'
```

---

## Troubleshooting

### Common Issues

#### 1. "Address already in use" Error

**Problem**: Server fails to start with "Address already in use"

**Cause**: Another server process is running on port 8888

**Solution**:
```bash
# Find process using port 8888
lsof -i :8888
netstat -tulpn | grep 8888

# Kill the process
kill -9 <PID>

# Or kill all servers
pkill -f bin/server
```

#### 2. "Connection refused" Error

**Problem**: Client cannot connect to server

**Causes**:
- Server not running
- Wrong host/port
- Firewall blocking

**Solutions**:
```bash
# Check if server is running
ps aux | grep bin/server

# Check if port is listening
netstat -tulpn | grep 8888

# Start server
./bin/server

# Check firewall
sudo ufw status
sudo ufw allow 8888/tcp  # Enable if needed
```

#### 3. "Client stuck after login"

**Problem**: Client hangs after login and doesn't respond to commands

**Cause**: Old version with receive handler bug

**Solution**:
```bash
# Update code
git pull origin main

# Rebuild
make clean && make

# Restart everything
pkill -f bin/server
pkill -f bin/client
./bin/server
./bin/client
```

#### 4. Compilation Errors

**Problem**: Undefined reference errors during build

**Cause**: Missing source files or incomplete compilation

**Solution**:
```bash
# Clean and rebuild
make clean
make

# Or rebuild with verbose output
gcc -Wall -Wextra -g -I./include -v -o bin/server src/server/*.c src/common/*.c
```

#### 5. WebSocket Proxy Connection Failed

**Problem**: Proxy can't connect to TCP server

**Cause**: C server not running or wrong host/port

**Solution**:
```bash
# Check server is running
ps aux | grep bin/server

# Verify port
netstat -tulpn | grep 8888

# Check proxy config
echo $TCP_HOST $TCP_PORT

# Restart proxy
npm start
```

#### 6. React UI Not Connecting

**Problem**: Web UI shows "Connection Failed"

**Cause**: Proxy not running or WebSocket URL wrong

**Solution**:
```bash
# Check proxy is running
ps aux | grep node

# Check proxy port
netstat -tulpn | grep 3000

# Verify React config
cat web-client/src/config.ts

# Restart both
cd websocket-proxy && npm start  # Terminal 1
cd web-client && npm run dev     # Terminal 2
```

### Performance Issues

**Too slow response**:
- Check server logs: `tail -f logs/server.log`
- Monitor system: `top`, `htop`
- Check network: `tcpdump -i lo -n tcp port 8888`

**High CPU usage**:
- Server busy with many clients
- Check for infinite loops in handlers
- Profile with `perf` or `valgrind`

**Memory leaks**:
- Run with valgrind:
  ```bash
  valgrind --leak-check=full ./bin/server
  ```
- Check for unfreed malloc() calls

---

## Performance & Scalability

### Current Limitations

| Aspect | Limit | Reason |
|--------|-------|--------|
| Max Clients | ~1000 | select() FD limit |
| Message Latency | <10ms | Single thread |
| Throughput | ~10K msg/sec | TCP overhead |
| Group Size | ~500 members | Memory & broadcast |
| Message Queue | Limited by disk | Binary file storage |

### Optimizations for Production

**Short-term** (weeks):
1. Add epoll() (Linux) / kqueue() (BSD) support
2. Implement message batching
3. Add connection pooling
4. Use SQLite for storage

**Medium-term** (months):
1. Multi-threaded server with thread pool
2. Redis for session caching
3. Message database (PostgreSQL)
4. Load balancing (nginx)

**Long-term** (quarters):
1. Distributed architecture (multiple servers)
2. Message broker (RabbitMQ/Kafka)
3. Horizontal scaling with load balancer
4. CDN for static assets

### Benchmarking

```bash
# Measure message latency
time ./bin/client << EOF
register testuser pass test@test.com
login testuser pass
quit
EOF

# Count message throughput
./bin/client << EOF
register user1 pass test@test.com
register user2 pass test@test.com
login user1 pass
EOF

# Monitor system resources
watch -n 1 'top -p $(pgrep bin/server)'
```

---

## Security Considerations

### Current Implementation

**Authentication**:
- Simple username/password (no encryption in transit)
- DJB2 hash for password storage
- Session token (random 32-byte)
- 5-minute session timeout

**Vulnerabilities**:
1. Passwords sent in plaintext over TCP
2. Simple hashing (should be bcrypt/argon2)
3. No rate limiting on login attempts
4. No encryption for message content
5. No user input validation

### Security Improvements for Production

1. **Enable TLS/SSL**:
   ```c
   // Use OpenSSL for encrypted TCP
   // Use WSS (WebSocket Secure) for browser
   ```

2. **Upgrade Password Hashing**:
   ```c
   // Use libsodium for argon2id hashing
   // const unsigned char *hash = crypto_pwhash_str(...);
   ```

3. **Add Rate Limiting**:
   ```c
   // Track failed login attempts
   // Block after N attempts for M seconds
   ```

4. **Validate Input**:
   ```c
   // Check username format (alphanumeric, 3-32 chars)
   // Check password strength (min 8 chars, complex)
   // Sanitize message content (prevent injection)
   ```

5. **Add HTTPS for Web UI**:
   ```bash
   # Use reverse proxy (nginx) with SSL
   # Redirect all HTTP to HTTPS
   ```

6. **Database Hardening**:
   ```bash
   # Use database with authentication
   # Implement access controls
   # Add audit logging
   ```

### OWASP Top 10 Considerations

| Issue | Status | Mitigation |
|-------|--------|-----------|
| Injection | Low | Limited SQL (file storage) |
| Broken Auth | Medium | Upgrade to bcrypt/argon2 |
| Sensitive Data | High | Add TLS/SSL encryption |
| XML External Entities | N/A | Not applicable |
| Broken Access Control | Low | Verify user ownership |
| Security Misconfiguration | Medium | Harden production config |
| XSS | Low | React auto-escapes |
| Insecure Deserialization | Medium | Validate message format |
| Using Components with Vulnerabilities | Medium | Keep dependencies updated |
| Insufficient Logging | Medium | Add comprehensive logs |

---

## FAQ

**Q: Can I run multiple servers?**
A: Currently no built-in clustering. You can run on different ports and use a load balancer.

**Q: What's the maximum message size?**
A: Currently limited by BUFFER_SIZE (4096 bytes). Can be increased in header.

**Q: Are messages persisted?**
A: Yes, offline messages are queued in messages.dat. Message history is optional.

**Q: Can I customize the protocol?**
A: Yes, modify message types in protocol.h and implement handlers.

**Q: What about mobile clients?**
A: Use the WebSocket proxy + React web client (responsive UI).

**Q: How do I backup user data?**
A: `cp -r data/ backup/` - all data in binary files.

---

## References

### Related Course Lectures

- **Lec03**: Socket API Introduction
- **Lec04**: Elementary Sockets Programming
- **Lec05**: Concurrent Server Design
- **Lec06**: I/O Multiplexing (select, poll, epoll)
- **Lec07**: Advanced I/O Techniques

### Key Concepts Demonstrated

- TCP Socket Programming (socket, bind, listen, accept, connect)
- Message Framing with Length-Prefixed Protocol
- Byte Order Conversion (htonl, ntohl, htons, ntohs)
- I/O Multiplexing with select()
- File-based Data Persistence
- Binary Protocol Design
- WebSocket Bridge Architecture
- Real-time Message Delivery

### External Resources

- [POSIX Socket API](https://man7.org/linux/man-pages/man7/socket.7.html)
- [TCP/IP Networking](https://tools.ietf.org/html/rfc793)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [Node.js ws Library](https://github.com/websockets/ws)
- [React Documentation](https://react.dev)

---

## Document Information

**Last Updated**: December 19, 2025
**Version**: 1.0
**Maintained By**: Network Programming Course
**Repository**: [GitHub URL]

---

## License

This is an educational project for the Network Programming course at HUST.

---

**Note**: This documentation covers version 1.0 of the TCP Chat Application. Check for updates in the repository.
