# TCP Chat Application - Documentation Index

Welcome to the comprehensive documentation for the TCP Chat Application. This index helps you navigate all available documentation.

## Quick Links

- **Getting Started**: [README.md - Installation & Setup](#readme-installation--setup)
- **Architecture**: [ARCHITECTURE.md - System Design](#architecturemd---system-design)
- **Protocol**: [PROTOCOL.md - Binary Protocol](#protocolmd---binary-protocol)
- **Commands**: [README.md - Command Reference](#readme-command-reference)

## Documentation Files

### README.md - Comprehensive Main Guide

**Location**: `/Users/namu10x/workspace/hust/20251/network programming/chat_tcp_socket/docs/README.md`

**Size**: 50 KB | 1,862 lines

**Best for**: First-time users, complete reference

**Main Sections**:

1. **Project Overview** (lines 1-60)
   - Key features
   - 17/17 requirements coverage
   - Quick facts about the application

2. **Architecture** (lines 61-200)
   - System architecture diagram
   - Component interaction flow
   - Technology stack table

3. **Technology Stack** (lines 201-240)
   - Backend (C, select, protocol)
   - Bridge layer (TypeScript, WebSocket)
   - Frontend (React, Tailwind, Zustand)

4. **Directory Structure** (lines 241-330)
   - Complete project layout
   - File descriptions
   - Location of key components

5. **Components** (lines 331-480)
   - C TCP Server details
   - WebSocket Proxy Server details
   - React Web Client details
   - CLI Client details
   - Message Protocol Layer

6. **Protocol Specification** (lines 481-700)
   - Message frame format
   - Message types (37 total)
   - Data format conventions

7. **Installation & Setup** (lines 701-830)
   - System requirements
   - Quick 3-step setup
   - Detailed installation guide

8. **Building** (lines 831-920)
   - Build C server/client
   - Build WebSocket proxy
   - Build React web client
   - Build troubleshooting

9. **Running the Application** (lines 921-1100)
   - CLI-only scenario
   - Full stack scenario
   - Configuration options

10. **Command Reference** (lines 1101-1350)
    - Authentication commands
    - Friend management commands
    - Direct messaging commands
    - Group management commands
    - System commands

11. **API/Message Reference** (lines 1351-1600)
    - Authentication JSON
    - Friend management JSON
    - Direct messaging JSON
    - Group management JSON
    - Status updates & errors

12. **Configuration** (lines 1601-1680)
    - C Server configuration
    - WebSocket Proxy configuration
    - React Web Client configuration

13. **Data Persistence** (lines 1681-1750)
    - File-based database
    - File structure
    - Data management functions
    - Backup & recovery

14. **Logging** (lines 1751-1850)
    - Server activity logging
    - Log levels
    - Log events
    - Viewing logs
    - WebSocket proxy logging

15. **Development Guide** (lines 1851-1950)
    - Project structure for developers
    - Adding new message types
    - Code standards
    - Building for distribution

16. **Testing** (lines 1951-2050)
    - Quick test (2 minutes)
    - Full test suite
    - Test execution
    - Load testing

17. **Troubleshooting** (lines 2051-2250)
    - Common issues & solutions
    - Performance issues
    - Error handling

18. **Performance & Scalability** (lines 2251-2350)
    - Current limitations
    - Optimizations for production
    - Benchmarking

19. **Security Considerations** (lines 2351-2450)
    - Current implementation
    - Vulnerabilities
    - Security improvements
    - OWASP Top 10

---

### ARCHITECTURE.md - System Design & Flow Diagrams

**Location**: `/Users/namu10x/workspace/hust/20251/network programming/chat_tcp_socket/docs/ARCHITECTURE.md`

**Size**: 29 KB | 568 lines

**Best for**: Understanding system design, component interactions, data flow

**Main Sections**:

1. **System Overview** (lines 1-100)
   - Complete system ASCII diagram
   - All components and connections
   - Data flow visualization

2. **Component Responsibilities** (lines 101-250)
   - C TCP Server responsibilities
   - WebSocket Proxy responsibilities
   - React Web Client responsibilities
   - Message Protocol Layer

3. **Message Flow Diagrams** (lines 251-450)
   - Authentication flow
   - Direct messaging flow
   - Group messaging flow
   - Visual sequence diagrams

4. **Data Flow Architecture** (lines 451-600)
   - User registration & login
   - Friend request system
   - Offline message queue
   - State machines

5. **Session Management** (lines 601-700)
   - Connection states
   - Authentication states
   - Timeout handling

6. **Network Byte Order Handling** (lines 701-750)
   - big-endian encoding
   - Practical examples with htonl/ntohl

7. **Error Handling Strategy** (lines 751-800)
   - Error detection
   - Error response flow
   - Common error codes

8. **Security Boundaries** (lines 801-850)
   - Input validation flow
   - Authentication boundaries
   - Authorization checks

---

### PROTOCOL.md - Binary Protocol Specification

**Location**: `/Users/namu10x/workspace/hust/20251/network programming/chat_tcp_socket/docs/PROTOCOL.md`

**Size**: 20 KB | 947 lines

**Best for**: Protocol implementation, message formats, binary encoding details

**Main Sections**:

1. **Overview** (lines 1-20)
   - Protocol purpose
   - Quick reference

2. **Frame Format** (lines 21-150)
   - Basic structure
   - LENGTH field specification
   - TYPE field specification
   - PAYLOAD field specification
   - Encoding/decoding examples

3. **Message Types** (lines 151-200)
   - Type ranges
   - Type definitions

4. **Authentication Messages (0x01-0x0F)** (lines 201-350)
   - MSG_REGISTER (0x01)
   - MSG_REGISTER_ACK (0x02)
   - MSG_LOGIN (0x03)
   - MSG_LOGIN_ACK (0x04)
   - MSG_LOGOUT (0x05)
   - MSG_LOGOUT_ACK (0x06)

5. **Friend Management Messages (0x20-0x2F)** (lines 351-550)
   - MSG_FRIEND_REQUEST (0x20)
   - MSG_FRIEND_REQUEST_ACK (0x21)
   - MSG_FRIEND_NOTIFY (0x2A)
   - MSG_FRIEND_ACCEPT (0x22-0x23)
   - MSG_FRIEND_REJECT (0x24-0x25)
   - MSG_FRIEND_REMOVE (0x26-0x27)
   - MSG_FRIEND_LIST (0x28-0x29)
   - MSG_STATUS_NOTIFY (0x2B)

6. **Direct Chat Messages (0x30-0x3F)** (lines 551-650)
   - MSG_CHAT_SEND (0x30)
   - MSG_CHAT_DELIVER (0x31)
   - MSG_CHAT_ACK (0x32)

7. **Group Management Messages (0x40-0x4F)** (lines 651-800)
   - MSG_GROUP_CREATE (0x40-0x41)
   - MSG_GROUP_INVITE (0x42-0x43)
   - MSG_GROUP_JOIN (0x44-0x45)
   - MSG_GROUP_LEAVE (0x46-0x47)
   - MSG_GROUP_REMOVE_USER (0x48-0x49)
   - MSG_GROUP_MSG (0x4A-0x4B)
   - MSG_GROUP_LIST (0x4C-0x4D)

8. **System Messages (0xF0-0xFF)** (lines 801-850)
   - MSG_ERROR (0xF0)
   - MSG_HEARTBEAT (0xFE)
   - MSG_HEARTBEAT_ACK (0xFF)

9. **Payload Encoding Conventions** (lines 851-920)
   - Pipe-separated fields
   - Null-terminated strings
   - Comma-separated records

10. **Protocol Implementation Guidelines** (lines 921-947)
    - Message sending (encoding) with C code
    - Message receiving (decoding) with C code
    - Stream fragmentation handling

---

## Documentation Navigation by Task

### If you want to...

**Get the application running**:
1. Read: README.md - Installation & Setup
2. Read: README.md - Building
3. Read: README.md - Running the Application

**Understand the system architecture**:
1. Read: ARCHITECTURE.md - System Overview
2. Read: ARCHITECTURE.md - Component Responsibilities
3. Read: ARCHITECTURE.md - Message Flow Diagrams

**Implement a new feature**:
1. Read: ARCHITECTURE.md - Adding a New Message Type
2. Read: PROTOCOL.md - Message Type Definition
3. Read: README.md - Development Guide

**Understand the protocol**:
1. Read: PROTOCOL.md - Frame Format
2. Read: PROTOCOL.md - Message Types (relevant section)
3. Read: PROTOCOL.md - Payload Encoding Conventions

**Use the CLI client**:
1. Read: README.md - Running the Application (CLI scenario)
2. Read: README.md - Command Reference

**Use the web UI**:
1. Read: README.md - Running the Application (Full Stack scenario)
2. Read: README.md - Using Web Client

**Debug issues**:
1. Read: README.md - Troubleshooting
2. Check: logs/server.log
3. Read: PROTOCOL.md - Error Messages

**Optimize performance**:
1. Read: README.md - Performance & Scalability
2. Read: README.md - Benchmarking
3. Check: logs/server.log for bottlenecks

**Improve security**:
1. Read: README.md - Security Considerations
2. Read: ARCHITECTURE.md - Security Boundaries
3. Implement recommendations in README.md

---

## Quick Reference

### File Locations (Absolute Paths)

```
/Users/namu10x/workspace/hust/20251/network programming/chat_tcp_socket/
├── docs/
│   ├── README.md                          (50 KB) - Main guide
│   ├── ARCHITECTURE.md                    (29 KB) - System design
│   ├── PROTOCOL.md                        (20 KB) - Protocol spec
│   ├── INDEX.md                           (this file)
│   ├── tcp_chat_plan_vn.md                (56 KB) - Vietnamese spec
│   └── example/                           (Example code & PDFs)
├── src/
│   ├── server/                            (C server implementation)
│   ├── client/                            (CLI client implementation)
│   └── common/                            (Shared C code)
├── websocket-proxy/                       (Node.js/TypeScript proxy)
├── web-client/                            (React web UI)
├── bin/                                   (Compiled binaries)
├── data/                                  (Data persistence files)
└── logs/                                  (Activity logs)
```

### Quick Commands

```bash
# Build everything
make

# Start server
./bin/server

# Start CLI client
./bin/client

# Build proxy
cd websocket-proxy && npm install && npm run build

# Start proxy
cd websocket-proxy && npm start

# Start web UI
cd web-client && npm install && npm run dev
```

### Key Message Types

| Code | Name | Direction |
|------|------|-----------|
| 0x01 | MSG_REGISTER | Client→Server |
| 0x03 | MSG_LOGIN | Client→Server |
| 0x20 | MSG_FRIEND_REQUEST | Client→Server |
| 0x30 | MSG_CHAT_SEND | Client→Server |
| 0x40 | MSG_GROUP_CREATE | Client→Server |
| 0x2B | MSG_STATUS_NOTIFY | Server→Client |
| 0x31 | MSG_CHAT_DELIVER | Server→Client |
| 0x4B | MSG_GROUP_MSG_DELIVER | Server→Client |

---

## Document Statistics

| Document | Size | Lines | Sections | Tables | Diagrams |
|----------|------|-------|----------|--------|----------|
| README.md | 50 KB | 1,862 | 21 | 10+ | 2 |
| ARCHITECTURE.md | 29 KB | 568 | 8 | 5+ | 8+ |
| PROTOCOL.md | 20 KB | 947 | 10 | 10+ | 5+ |
| **Total** | **99 KB** | **3,377** | **39** | **25+** | **15+** |

---

## Notes

- All documentation is in Markdown format for easy reading and version control
- Code examples are provided in C and TypeScript where applicable
- ASCII diagrams are used for offline viewing without external tools
- Documentation is self-contained; links use relative paths
- Language: English (technical documentation standard)

---

## Version Information

- Documentation Version: 1.0
- Created: December 19, 2025
- Project: TCP Chat Application for IT4062 Network Programming Course
- Status: Production-Ready

---

## How to Contribute

To update documentation:
1. Edit the relevant .md file in `/docs/`
2. Test that links and references still work
3. Update this INDEX.md if adding new sections
4. Verify Markdown formatting is correct

---

**Last Updated**: December 19, 2025
**Maintainer**: Network Programming Course
**License**: Educational - HUST

---

For questions or issues with the documentation, please refer to the Troubleshooting section in README.md.
