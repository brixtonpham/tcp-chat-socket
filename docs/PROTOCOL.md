# TCP Chat Protocol Specification

## Overview

The TCP Chat Protocol is a custom, binary, length-prefixed protocol designed to handle message framing over TCP streams. This document provides complete specifications for protocol implementation.

## Frame Format

### Basic Structure

```
┌──────────────────┬──────────────────┬──────────────────────────┐
│   LENGTH (4B)    │    TYPE (2B)     │   PAYLOAD (variable)     │
│  Network Order   │  Network Order   │  Format depends on TYPE  │
│  Big-Endian      │  Big-Endian      │                          │
└──────────────────┴──────────────────┴──────────────────────────┘
 Offset: 0-3       Offset: 4-5        Offset: 6+
```

### Field Specifications

#### LENGTH Field (4 bytes, uint32_t)

- **Byte Order**: Network byte order (big-endian)
- **Value Range**: 6 to 65535 (must include header size)
- **Interpretation**: Total message length INCLUDING the LENGTH and TYPE fields
- **Calculation**: `length = 6 + payload_length`

**Encoding Example** (C):
```c
uint32_t total_len = 6 + payload_len;  // e.g., 15
uint8_t *buffer = malloc(total_len);

// Using htonl macro
*(uint32_t *)buffer = htonl(total_len);

// Manual encoding (big-endian)
buffer[0] = (total_len >> 24) & 0xFF;  // 0x00
buffer[1] = (total_len >> 16) & 0xFF;  // 0x00
buffer[2] = (total_len >> 8) & 0xFF;   // 0x00
buffer[3] = total_len & 0xFF;          // 0x0F (15 in decimal)
```

**Decoding Example**:
```c
uint8_t header[4] = {0x00, 0x00, 0x00, 0x0F};
uint32_t length = ntohl(*(uint32_t *)header);  // = 15

// Or manual decoding
length = (header[0] << 24) | (header[1] << 16) |
         (header[2] << 8) | header[3];
```

#### TYPE Field (2 bytes, uint16_t)

- **Byte Order**: Network byte order (big-endian)
- **Value Range**: 0x0000 to 0xFFFF
- **Interpretation**: Message type identifier (see Message Types section)
- **Categories**: Organized in ranges by functionality

**Encoding Example**:
```c
uint16_t msg_type = MSG_REGISTER;  // 0x01
*(uint16_t *)(buffer + 4) = htons(msg_type);

// Manual encoding
buffer[4] = (msg_type >> 8) & 0xFF;  // 0x00
buffer[5] = msg_type & 0xFF;         // 0x01
```

#### PAYLOAD Field (variable length)

- **Length**: Exactly `length - 6` bytes
- **Format**: Type-specific (see Message Types section)
- **Encoding**: UTF-8 for strings
- **Delimiters**:
  - Pipe (`|`) for field separation
  - Null byte (`\0`) for string termination

---

## Message Types

### Type Ranges

| Range | Purpose | Count |
|-------|---------|-------|
| 0x01-0x0F | Authentication | 6 types |
| 0x20-0x2F | Friend Management | 11 types |
| 0x30-0x3F | Direct Chat | 3 types |
| 0x40-0x4F | Group Management | 14 types |
| 0xF0-0xFF | System Messages | 3 types |

### Message Type Definitions

## Authentication Messages (0x01-0x0F)

### MSG_REGISTER (0x01)

**Direction**: Client → Server
**Purpose**: Create new user account
**Payload Format**: `username|password|email`

**Constraints**:
- Username: 3-32 alphanumeric characters
- Password: 4+ characters (no validation rules)
- Email: Valid email format

**Example Payload**:
```
alice|password123|alice@example.com
```

**Binary Representation**:
```
[4 bytes: 0x00000024]  // Length = 36 (6 + 30)
[2 bytes: 0x0001]      // Type = MSG_REGISTER
[payload]: alice|password123|alice@example.com
```

**Server Processing**:
1. Parse pipe-separated fields
2. Validate input constraints
3. Check if username already exists
4. Hash password with DJB2
5. Create user record with auto-incremented ID
6. Save to users.dat
7. Send MSG_REGISTER_ACK

---

### MSG_REGISTER_ACK (0x02)

**Direction**: Server → Client
**Purpose**: Registration response
**Payload Format**:
- Success: `OK|user_id|message`
- Failure: `FAIL||message`

**Success Example**:
```
OK|1|Registration successful
```

**Failure Example**:
```
FAIL||Username already exists
```

---

### MSG_LOGIN (0x03)

**Direction**: Client → Server
**Purpose**: Authenticate and create session
**Payload Format**: `username|password`

**Example Payload**:
```
alice|password123
```

**Server Processing**:
1. Parse username and password
2. Look up user in users.dat
3. Verify password hash
4. Create session token (32 random bytes, hex encoded)
5. Link client info to user_id
6. Update user status to ONLINE
7. Send MSG_LOGIN_ACK with token
8. Notify all online friends of status change (MSG_STATUS_NOTIFY)
9. Deliver all queued offline messages

---

### MSG_LOGIN_ACK (0x04)

**Direction**: Server → Client
**Purpose**: Login response with session token
**Payload Format**:
- Success: `OK|token|user_id|message`
- Failure: `FAIL||message`

**Success Example**:
```
OK|a1b2c3d4e5f6...|1|Login successful
```

**Note**: Token is 64-character hex string (32 bytes)

---

### MSG_LOGOUT (0x05)

**Direction**: Client → Server
**Purpose**: End session and disconnect
**Payload Format**: Empty (no payload needed)

**Server Processing**:
1. Find client by socket FD
2. Update user status to OFFLINE
3. Clear session token
4. Notify online friends (MSG_STATUS_NOTIFY)
5. Close TCP connection
6. Send MSG_LOGOUT_ACK

---

### MSG_LOGOUT_ACK (0x06)

**Direction**: Server → Client
**Purpose**: Confirm logout
**Payload Format**: `success_flag` (1 byte: 0=fail, 1=success)

**Example**:
```
[1 byte: 0x01]  // Success
```

---

## Friend Management Messages (0x20-0x2F)

### MSG_FRIEND_REQUEST (0x20)

**Direction**: Client → Server
**Purpose**: Send friend request to another user
**Payload Format**: `target_username\0`

**Example Payload**:
```
bob[NULL]
```

**Server Processing**:
1. Parse null-terminated target username
2. Look up target user in users.dat
3. Create friendship record (requester_id, target_id, status=PENDING)
4. Save to friends.dat
5. Send MSG_FRIEND_REQUEST_ACK to requester
6. If target is online, send MSG_FRIEND_NOTIFY to target
7. If target is offline, queue notification for delivery

**Example Binary**:
```
[4 bytes: 0x00000008]  // Length = 8 (6 + 2 for "bob\0")
[2 bytes: 0x0020]      // Type = MSG_FRIEND_REQUEST
[payload]: bob[NULL]
```

---

### MSG_FRIEND_REQUEST_ACK (0x21)

**Direction**: Server → Client
**Purpose**: Confirm friend request sent
**Payload Format**: `success|message`

**Success Example**: `1|Request sent to bob`
**Failure Example**: `0|bob not found`

---

### MSG_FRIEND_NOTIFY (0x2A)

**Direction**: Server → Client
**Purpose**: Notify user of incoming friend request
**Payload Format**: `requester_username\0`

**Example Payload**:
```
alice[NULL]
```

**When Sent**:
- User is online AND receives friend request
- User logs in (for any pending requests)

---

### MSG_FRIEND_ACCEPT (0x22)

**Direction**: Client → Server
**Purpose**: Accept a pending friend request
**Payload Format**: `requester_username\0`

**Server Processing**:
1. Parse null-terminated requester username
2. Find friendship record
3. Update status to ACCEPTED
4. Save to friends.dat
5. Notify both users with MSG_FRIEND_ACCEPT_ACK

---

### MSG_FRIEND_ACCEPT_ACK (0x23)

**Direction**: Server → Client
**Purpose**: Confirm friend request accepted
**Payload Format**: `success|message`

---

### MSG_FRIEND_REJECT (0x24)

**Direction**: Client → Server
**Purpose**: Reject a pending friend request
**Payload Format**: `requester_username\0`

**Server Processing**:
1. Delete friendship record
2. Send MSG_FRIEND_REJECT_ACK

---

### MSG_FRIEND_REJECT_ACK (0x25)

**Direction**: Server → Client
**Purpose**: Confirm friend request rejected
**Payload Format**: `success|message`

---

### MSG_FRIEND_REMOVE (0x26)

**Direction**: Client → Server
**Purpose**: Remove an existing friend
**Payload Format**: `friend_username\0`

**Server Processing**:
1. Delete friendship record (both directions)
2. Save to friends.dat
3. Send MSG_FRIEND_REMOVE_ACK

---

### MSG_FRIEND_REMOVE_ACK (0x27)

**Direction**: Server → Client
**Purpose**: Confirm friend removed
**Payload Format**: `success|message`

---

### MSG_FRIEND_LIST (0x28)

**Direction**: Client → Server
**Purpose**: Request list of all friends
**Payload Format**: Empty (no payload)

**Server Processing**:
1. Get user's friend list from friends.dat
2. For each ACCEPTED friend:
   - Get friend's username
   - Get friend's current status (ONLINE/OFFLINE)
3. Send MSG_FRIEND_LIST_RSP

---

### MSG_FRIEND_LIST_RSP (0x29)

**Direction**: Server → Client
**Purpose**: Return friend list with status
**Payload Format**: `id1|name1|status1,id2|name2|status2,...`

**Example Payload** (empty list):
```
[empty payload]
```

**Example Payload** (with friends):
```
2|bob|online,3|charlie|offline,4|dave|online
```

**Format Details**:
- Multiple friends separated by comma (`,`)
- Friend fields separated by pipe (`|`)
- Fields: `user_id|username|status`
- Status values: `online` or `offline`

---

### MSG_STATUS_NOTIFY (0x2B)

**Direction**: Server → Client
**Purpose**: Notify of friend's status change
**Payload Format**: `user_id|username|status`

**Example Payload**:
```
2|bob|online
```

**When Sent**:
- Friend logs in
- Friend logs out
- Friend's status changes

---

## Direct Chat Messages (0x30-0x3F)

### MSG_CHAT_SEND (0x30)

**Direction**: Client → Server
**Purpose**: Send message to friend
**Payload Format**: `recipient_id|content`

**Example Payload**:
```
2|Hello Bob, how are you?
```

**Constraints**:
- Recipient must be a friend (ACCEPTED relationship)
- Recipient must exist
- Content can be up to ~4000 bytes

**Server Processing**:
1. Parse recipient_id and content
2. Verify sender and recipient are friends
3. Verify recipient exists
4. Create message record with timestamp
5. Save to messages.dat
6. If recipient is online:
   - Send MSG_CHAT_DELIVER to recipient
   - Get MSG_CHAT_ACK back
   - Send MSG_CHAT_ACK to sender
7. If recipient is offline:
   - Queue message in messages.dat with delivered=0
   - Send MSG_CHAT_ACK to sender (queued)
   - On recipient login, deliver all queued messages

---

### MSG_CHAT_DELIVER (0x31)

**Direction**: Server → Client
**Purpose**: Deliver received message
**Payload Format**: `sender_id|sender_name|content|timestamp`

**Example Payload**:
```
2|bob|Hello Alice!|2025-12-19T10:30:45.123Z
```

**When Sent**:
- Recipient is online when message arrives
- Recipient logs in (for queued messages)

**Timestamp Format**: ISO 8601 (UTC)

---

### MSG_CHAT_ACK (0x32)

**Direction**: Server → Client
**Purpose**: Acknowledge message delivery
**Payload Format**: `success|message_id`

**Success Example**: `1|msg_12345`
**Failure Example**: `0|user not found`

---

## Group Management Messages (0x40-0x4F)

### MSG_GROUP_CREATE (0x40)

**Direction**: Client → Server
**Purpose**: Create new group
**Payload Format**: `group_name|description`

**Example Payload**:
```
Study Group|A group for studying network programming
```

**Note**: If no description provided, send empty string: `group_name|`

**Server Processing**:
1. Parse group name and description (pipe-separated)
2. Validate name (3-50 chars)
3. Create group record with auto-incremented ID
4. Set creator as first member with 'admin' role
5. Save to groups.dat
6. Send MSG_GROUP_CREATE_ACK

---

### MSG_GROUP_CREATE_ACK (0x41)

**Direction**: Server → Client
**Purpose**: Confirm group created
**Payload Format**:
- Success: `OK|group_id|group_name`
- Failure: `FAIL|message`

**Success Example**: `OK|1|Study Group`
**Failure Example**: `FAIL|Group name already exists`

---

### MSG_GROUP_INVITE (0x42)

**Direction**: Client → Server
**Purpose**: Invite user to group
**Payload Format**: `group_id|username`

**Example Payload**:
```
1|bob
```

**Constraints**:
- Inviter must be group member
- Invitee must exist
- Invitee not already member

**Server Processing**:
1. Parse group_id and username
2. Verify inviter is group member
3. Look up username (get user_id)
4. Add user to group members list
5. Save to groups.dat
6. If invitee is online, notify immediately
7. If invitee is offline, queue notification

---

### MSG_GROUP_INVITE_ACK (0x43)

**Direction**: Server → Client
**Purpose**: Confirm invite sent
**Payload Format**: `success|message`

---

### MSG_GROUP_JOIN (0x44)

**Direction**: Client → Server
**Purpose**: Join group (if previously invited)
**Payload Format**: `group_id\0` (null-terminated group ID)

**Example Payload**: `5\0`

**Server Processing**:
1. Parse group_id (null-terminated string, convert to int)
2. Verify group exists
3. Verify user is not already member
4. Add user to members list with 'member' role
5. Send MSG_GROUP_JOIN_ACK
6. Notify other group members

---

### MSG_GROUP_JOIN_ACK (0x45)

**Direction**: Server → Client
**Purpose**: Confirm joined group
**Payload Format**:
- Success: `OK|message`
- Failure: `FAIL|message`

**Success Example**: `OK|Joined group`
**Failure Example**: `FAIL|Already in group`

---

### MSG_GROUP_LEAVE (0x46)

**Direction**: Client → Server
**Purpose**: Leave a group
**Payload Format**: `group_id\0` (null-terminated group ID)

**Example Payload**: `3\0`

**Server Processing**:
1. Verify user is group member
2. Remove from members list
3. If user is creator, transfer ownership or delete group
4. Send MSG_GROUP_LEAVE_ACK
5. Notify remaining group members

---

### MSG_GROUP_LEAVE_ACK (0x47)

**Direction**: Server → Client
**Purpose**: Confirm left group
**Payload Format**:
- Success: `OK|message`
- Failure: `FAIL|message`

**Success Example**: `OK|Left group`
**Failure Example**: `FAIL|Not in group`

---

### MSG_GROUP_REMOVE_USER (0x48)

**Direction**: Client → Server
**Purpose**: Admin removes member from group
**Payload Format**: `group_id|username`

**Constraints**:
- Sender must be group creator/admin
- Cannot remove creator
- Target must be group member

**Server Processing**:
1. Verify sender is group admin
2. Remove target user from group
3. Send MSG_GROUP_REMOVE_ACK

---

### MSG_GROUP_REMOVE_ACK (0x49)

**Direction**: Server → Client
**Purpose**: Confirm member removed
**Payload Format**: `success|message`

---

### MSG_GROUP_MSG (0x4A)

**Direction**: Client → Server
**Purpose**: Send message to group
**Payload Format**: `group_id|content`

**Example Payload**:
```
1|Hello everyone in the study group!
```

**Server Processing**:
1. Parse group_id and content
2. Verify sender is group member
3. Get all group members
4. For each member:
   - If online: Send MSG_GROUP_MSG_DELIVER immediately
   - If offline: Queue in messages.dat
5. Return MSG_GROUP_MSG_ACK to sender

---

### MSG_GROUP_MSG_DELIVER (0x4B)

**Direction**: Server → Client
**Purpose**: Deliver group message
**Payload Format**: `group_id|sender_id|sender_name|content|timestamp`

**Example Payload**:
```
1|2|bob|I agree with this approach|2025-12-19T10:30:45.123Z
```

---

### MSG_GROUP_LIST (0x4C)

**Direction**: Client → Server
**Purpose**: Request groups user is member of
**Payload Format**: Empty (no payload)

**Server Processing**:
1. Get all groups where user is member
2. For each group, gather: group_id, name, description, user's role
3. Send MSG_GROUP_LIST_RSP

---

### MSG_GROUP_LIST_RSP (0x4D)

**Direction**: Server → Client
**Purpose**: Return user's groups with details
**Payload Format**: `count|id1|name1|desc1|role1,id2|name2|desc2|role2,...`

**Format Details**:
- First field: Count of groups
- Groups separated by comma (`,`)
- Each group: `group_id|name|description|role`
- Role values: `admin` (creator) or `member`

**Example Payload** (empty):
```
0|
```

**Example Payload** (with groups):
```
3|1|Study Group|Network programming study|admin,2|Gaming|Gaming buddies|member,3|Project Team|Capstone project|member
```

---

## System Messages (0xF0-0xFF)

### MSG_ERROR (0xF0)

**Direction**: Server → Client
**Purpose**: Send error message
**Payload Format**: `error_code|error_message`

**Common Error Codes**:
- `USER_NOT_FOUND`
- `INVALID_PASSWORD`
- `USER_ALREADY_EXISTS`
- `NOT_AUTHENTICATED`
- `NOT_FRIENDS`
- `INVALID_GROUP`
- `NOT_GROUP_MEMBER`
- `INSUFFICIENT_PERMISSIONS`
- `INTERNAL_ERROR`

**Example Payload**:
```
USER_NOT_FOUND|Username 'charlie' does not exist
```

**When Sent**:
- Client sends invalid message
- Validation fails
- User not found
- Permission denied
- Server error

---

### MSG_HEARTBEAT (0xFE)

**Direction**: Client → Server
**Purpose**: Keep connection alive, detect dead connections
**Payload Format**: Empty (no payload)

**Frequency**: Every 30 seconds (configurable)

**Server Response**: MSG_HEARTBEAT_ACK

---

### MSG_HEARTBEAT_ACK (0xFF)

**Direction**: Server → Client
**Purpose**: Acknowledge heartbeat
**Payload Format**: Empty (no payload)

**Timeout**: If no heartbeat for 5 minutes → disconnect client

---

## Payload Encoding Conventions

### Pipe-Separated Fields

Used for structured data with multiple values:

```
field1|field2|field3
```

**Rules**:
- Fields separated by pipe character (`|`)
- No spaces around pipes
- Fields cannot contain pipe character
- Order is significant
- Empty fields allowed (e.g., `ok||message`)

**Example**:
```
OK|1|Registration successful
1|alice|online
1|Study Group,2|Gaming
```

### Null-Terminated Strings

Used for single variable-length string values:

```
string_value[NULL BYTE]
```

**Rules**:
- String ends with `\0` (0x00 byte)
- Only one string per payload
- String cannot contain null bytes
- Preferred for usernames, messages, group names

**Example**:
```
alice[NULL]
Hello Bob![NULL]
```

### Comma-Separated Records

Used for list of items with multiple fields:

```
item1_field1|item1_field2,item2_field1|item2_field2,...
```

**Rules**:
- Items separated by comma (`,`)
- Fields within items separated by pipe (`|`)
- No spaces
- Order significant

**Example** (Friend List):
```
2|bob|online,3|charlie|offline,4|dave|online
```

**Example** (Group List):
```
1|Study Group,2|Gaming,3|Project Team
```

---

## Protocol Implementation Guidelines

### Message Sending (Encoding)

```c
int send_message(int sockfd, uint16_t type, const char *payload, int payload_len) {
    // Calculate total length
    uint32_t total_len = 6 + payload_len;

    // Create buffer
    uint8_t *buffer = malloc(total_len);

    // Write header
    *(uint32_t *)buffer = htonl(total_len);      // Network byte order
    *(uint16_t *)(buffer + 4) = htons(type);    // Network byte order

    // Write payload
    if (payload_len > 0) {
        memcpy(buffer + 6, payload, payload_len);
    }

    // Send all bytes
    int sent = 0;
    while (sent < total_len) {
        int n = send(sockfd, buffer + sent, total_len - sent, 0);
        if (n <= 0) {
            perror("send");
            free(buffer);
            return -1;
        }
        sent += n;
    }

    free(buffer);
    return 0;
}
```

### Message Receiving (Decoding)

```c
int recv_message(int sockfd, uint16_t *type, char *payload, int *payload_len) {
    // Read header (6 bytes)
    uint8_t header[6];
    int received = 0;

    while (received < 6) {
        int n = recv(sockfd, header + received, 6 - received, 0);
        if (n <= 0) return -1;  // Connection closed or error
        received += n;
    }

    // Parse header
    uint32_t message_len = ntohl(*(uint32_t *)header);
    *type = ntohs(*(uint16_t *)(header + 4));

    // Validate length
    if (message_len < 6 || message_len > MAX_MESSAGE_SIZE) {
        return -1;  // Invalid length
    }

    // Read payload
    *payload_len = message_len - 6;
    received = 0;

    while (received < *payload_len) {
        int n = recv(sockfd, payload + received, *payload_len - received, 0);
        if (n <= 0) return -1;
        received += n;
    }

    return 0;
}
```

### Stream Fragmentation Handling

TCP may split messages across multiple packets:

```
Sent:  [LENGTH=15][TYPE=0x30][payload...]
Recv:  [LEN=15][TY  <- First packet
        PE=0x30][pay  <- Second packet
        load...]
```

Solution: Use a **per-client buffer** to reassemble:

```c
typedef struct {
    int fd;
    char buffer[4096];      // Reassembly buffer
    int buffer_len;         // Bytes in buffer
} ClientInfo;

// On recv:
int n = recv(client->fd, client->buffer + client->buffer_len, ...);
client->buffer_len += n;

// Try to extract complete messages:
while (client->buffer_len >= 6) {
    uint32_t msg_len = ntohl(*(uint32_t *)client->buffer);
    if (client->buffer_len < msg_len) break;  // Incomplete

    // Process message
    process_message(client->buffer + 6, msg_len - 6);

    // Remove from buffer
    memmove(client->buffer, client->buffer + msg_len,
            client->buffer_len - msg_len);
    client->buffer_len -= msg_len;
}
```

---

## Testing Protocol Compliance

### Manual Testing with netcat

```bash
# Start server
./bin/server

# In another terminal, create manual message
echo -ne '\x00\x00\x00\x08\x00\x01' | nc localhost 8888
# Sends: Length=8 (0x00000008), Type=1 (0x0001), no payload
```

### Packet Capture with tcpdump

```bash
# Capture chat traffic
tcpdump -i lo -n tcp port 8888 -X

# Filter by message type (0x0020 = friend request)
tcpdump -i lo -n tcp port 8888 -X | grep '0020'
```

### Protocol Fuzzing

```bash
# Send random data to test error handling
dd if=/dev/urandom | nc localhost 8888

# Send oversized messages
perl -e 'print "\xFF\xFF\xFF\xFF" . "A" x 10000' | nc localhost 8888
```

---

**Document Information**
- Last Updated: December 19, 2025
- Protocol Version: 1.0
- Status: Finalized
