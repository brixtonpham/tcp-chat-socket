# TCP Chat Socket Architecture & Protocol Flows

````carousel
![System Architecture](/home/nam/.gemini/antigravity/brain/e474380b-44cd-40cc-a4ff-d765b729d89c/system_arch.png)

## 1. System Overview

The TCP Chat Project is a robust Client-Server application designed for reliability and concurrency.

- **Server**: C-based, uses `select()` for non-blocking I/O. Handles 100+ concurrent clients.
- **Client**: Multi-threaded (Sender/Receiver separation).
- **Security**: Basic authentication with password hashing.
- **Protocol**: Custom binary protocol (TLV-style).

```mermaid
graph LR
    ClientA[Client A] <-->|TCP/IP| Server[Chat Server]
    ClientB[Client B] <-->|TCP/IP| Server
    Server <-->|R/W| Storage[(File System)]
    
    style Server fill:#f96,stroke:#333,stroke-width:2px
    style Storage fill:#db4,stroke:#333
```
<!-- slide -->
## 2. General Packet Transmission

How a message travels from Client to Server.
*Requirement: Reliable TCP framing.*

**Packet Structure**: `[Len (4B)][Type (2B)][Payload (NB)]`

```mermaid
sequenceDiagram
    participant App as Client App
    participant Net as Network Layer
    participant Svr as Server Protocol

    Note over App: User types "hello"
    App->>Net: 1. Encode Pkt: [00 00 00 05][00 30][hello]
    Net->>Svr: 2. Transmit Bytes over TCP
    
    Note over Svr: 3. Buffer Incoming Data
    Svr->>Svr: 4. Check Buffer >= 4 bytes? (Yes)
    Svr->>Svr: 5. Read Len = 5
    Svr->>Svr: 6. Check Buffer >= 4+2+5? (Yes)
    Svr->>Svr: 7. Decode Type = 0x30 (MSG_CHAT_SEND)
    Svr->>Svr: 8. Extract Payload = "hello"
    Svr->>App: 9. Process & ACK
```
<!-- slide -->
## 3. Authentication Requirements (Req 3, 4, 16)

Covers Registration, Login, and Logout flows.

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant DB as UserDB

    %% Register
    U->>C: register alpha pass123
    C->>S: [MSG_REGISTER] "alpha|pass123"
    S->>DB: Check if exists?
    S->>DB: Create User
    S-->>C: [MSG_REGISTER_ACK] "OK|ID=1"
    C-->>U: "Registration Successful"

    %% Login
    U->>C: login alpha pass123
    C->>S: [MSG_LOGIN] "alpha|pass123"
    S->>DB: Verify Hash
    S->>S: Create Session (Token)
    S-->>C: [MSG_LOGIN_ACK] "OK|Token"
    S-->>C: [MSG_FRIEND_LIST_RSP] (Auto-send friends)
    S-->>C: [MSG_CHAT_DELIVER] (Offline msgs)
    C-->>U: "Logged In"

    %% Logout
    U->>C: logout
    C->>S: [MSG_LOGOUT]
    S->>S: Destroy Session
    S-->>C: [MSG_LOGOUT_ACK] "OK"
    C->>C: Disconnect TCP
```
<!-- slide -->
## 4. Friend System Requirements (Req 5, 6, 7, 8)

Managing relationships: Request, List, Accept, Remove.

```mermaid
sequenceDiagram
    participant A as User A
    participant S as Server
    participant B as User B

    %% Friend Request
    A->>S: [MSG_FRIEND_REQUEST] "beta"
    S->>B: [MSG_FRIEND_NOTIFY] "alpha wants to be friend"
    S-->>A: [MSG_FRIEND_REQUEST_ACK] "OK"

    %% Accept
    B->>S: [MSG_FRIEND_ACCEPT] "1" (Alpha's ID)
    S->>S: Update DB: status='accepted'
    S->>A: [MSG_FRIEND_NOTIFY] "beta accepted"
    S-->>B: [MSG_FRIEND_ACCEPT_ACK] "OK"

    %% List
    A->>S: [MSG_FRIEND_LIST]
    S-->>A: [MSG_FRIEND_LIST_RSP] "beta|online,gamma|offline"

    %% Remove
    A->>S: [MSG_FRIEND_REMOVE] "2" (Beta's ID)
    S->>S: Delete Friendship
    S->>B: [MSG_FRIEND_NOTIFY] "removed you"
    S-->>A: [MSG_FRIEND_REMOVE_ACK] "OK"
```
<!-- slide -->
## 5. Chat & Offline Messaging (Req 9, 10)

Direct P2P messaging with offline store-and-forward.

```mermaid
sequenceDiagram
    participant A as User A
    participant S as Server
    participant B as User B (Offline)

    %% Online Chat
    Note over A, B: Scenario: Both Online
    A->>S: [MSG_CHAT_SEND] "2|Hello"
    S->>B: [MSG_CHAT_DELIVER] "1|alpha|Hello"
    S-->>A: [MSG_CHAT_ACK] "OK"

    %% Offline Chat
    Note over B: B goes Offline
    B->>S: [MSG_LOGOUT]
    
    A->>S: [MSG_CHAT_SEND] "2|Are you there?"
    S->>S: Check B status -> Offline
    S->>S: Store in OfflineQueue
    S-->>A: [MSG_CHAT_ACK] "OK" (Queued)

    Note over B: B comes Online
    B->>S: [MSG_LOGIN] "beta..."
    S-->>B: [MSG_LOGIN_ACK] "OK"
    S->>B: [MSG_CHAT_DELIVER] "1|alpha|Are you there?" (From Queue)
```
<!-- slide -->
## 6. Group Chat System (Req 11-15)

Complex flow: Create, Invite/Join, Message, Leave.

```mermaid
sequenceDiagram
    participant A as Owner
    participant S as Server
    participant B as Member

    %% Create
    A->>S: [MSG_GROUP_CREATE] "Team A"
    S->>S: Create Group ID=1
    S-->>A: [MSG_GROUP_CREATE_ACK] "OK|1"

    %% Invite & Join
    A->>S: [MSG_GROUP_INVITE] "1|2" (Group 1, User 2)
    S->>B: [MSG_GROUP_INVITE] "1|Team A|alpha"
    B->>S: [MSG_GROUP_JOIN] "1"
    S->>A: [MSG_GROUP_MSG] "USER_JOINED|beta" (Notify members)
    S-->>B: [MSG_GROUP_JOIN_ACK] "OK"

    %% Group Message
    B->>S: [MSG_GROUP_MSG] "1|Hi Team"
    S->>A: [MSG_GROUP_MSG_DELIVER] "1|Team A|beta|Hi Team"
    S-->>B: [MSG_CHAT_ACK] "OK"

    %% Leave
    B->>S: [MSG_GROUP_LEAVE] "1"
    S->>A: [MSG_GROUP_MSG] "USER_LEFT|beta"
    S-->>B: [MSG_GROUP_LEAVE_ACK] "OK"
```
````
