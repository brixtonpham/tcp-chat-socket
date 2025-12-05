# Requirements Checklist - TCP Chat Application

This document maps each of the 17 requirements to their implementation in the codebase.

## ✅ All Requirements Implemented (17/17)

### Requirement #1: Xử lý truyền dòng (Stream handling) - 1 điểm

**Implementation:**
- **File:** `src/common/protocol.c`
- **Functions:** `send_message()`, `recv_message()`
- **Technique:** Length-prefixed message framing

**Code Location:**
```
src/common/protocol.c:17-56   - send_message() implementation
src/common/protocol.c:58-110  - recv_message() implementation
```

**How it works:**
- Each message has 6-byte header: 4 bytes length + 2 bytes type
- Handles partial reads/writes in loops
- Uses network byte order (htonl/ntohl)

---

### Requirement #2: Cơ chế vào/ra socket trên server - 2 điểm

**Implementation:**
- **File:** `src/server/server.c`
- **Function:** `server_loop()`
- **Technique:** I/O Multiplexing with `select()`

**Code Location:**
```
src/server/server.c:62-109   - server_loop() with select()
src/server/server.c:111-179  - handle_new_connection()
src/server/server.c:181-236  - handle_client_data()
```

**How it works:**
- Uses `fd_set` and `select()` to monitor multiple sockets
- Handles new connections on listening socket
- Handles data from existing client sockets
- Non-blocking, single-threaded server

---

### Requirement #3: Đăng ký và quản lý tài khoản - 2 điểm

**Implementation:**
- **Files:** `src/common/user.c`, `src/server/handlers.c`
- **Functions:** `create_user()`, `handle_register()`
- **Features:** Username uniqueness, password hashing, data persistence

**Code Location:**
```
src/common/user.c:66-102     - create_user()
src/common/user.c:118-126    - hash_password()
src/server/handlers.c:3-42   - handle_register()
```

**How it works:**
- Validates username uniqueness
- Validates password length (min 6 chars)
- Hashes password before storage
- Saves to users.dat file

---

### Requirement #4: Đăng nhập và quản lý phiên - 2 điểm

**Implementation:**
- **Files:** `src/common/user.c`, `src/server/handlers.c`
- **Functions:** `create_session()`, `handle_login()`
- **Features:** Session tokens, timeout handling, status management

**Code Location:**
```
src/common/user.c:143-167    - create_session()
src/common/user.c:209-221    - generate_random_token()
src/server/handlers.c:44-105 - handle_login()
```

**How it works:**
- Generates 64-character random session token
- Links session to socket descriptor
- Updates user status to "online"
- Sends online friends list
- Delivers offline messages
- Session timeout: 5 minutes

---

### Requirement #5: Gửi lời mời kết bạn - 1 điểm

**Implementation:**
- **Files:** `src/common/friend.c`, `src/server/handlers.c`
- **Functions:** `create_friendship()`, `handle_friend_request()`
- **Features:** Request validation, notification

**Code Location:**
```
src/common/friend.c:93-118    - create_friendship()
src/server/handlers.c:136-185 - handle_friend_request()
```

**How it works:**
- Validates target user exists
- Checks for existing friendship
- Creates friendship with "pending" status
- Notifies target user if online
- Saves to friends.dat

---

### Requirement #6: Chấp nhận/Từ chối lời mời - 1 điểm

**Implementation:**
- **Files:** `src/common/friend.c`, `src/server/handlers.c`
- **Functions:** `update_friendship_status()`, `handle_friend_accept()`, `handle_friend_reject()`

**Code Location:**
```
src/common/friend.c:123-135   - update_friendship_status()
src/server/handlers.c:187-218 - handle_friend_accept()
src/server/handlers.c:220-243 - handle_friend_reject()
```

**How it works:**
- Accept: Updates status to "accepted", notifies requester
- Reject: Updates status to "rejected"
- Both save to file

---

### Requirement #7: Hủy kết bạn - 1 điểm

**Implementation:**
- **Files:** `src/common/friend.c`, `src/server/handlers.c`
- **Functions:** `remove_friendship()`, `handle_friend_remove()`

**Code Location:**
```
src/common/friend.c:140-154   - remove_friendship()
src/server/handlers.c:245-276 - handle_friend_remove()
```

**How it works:**
- Marks friendship as deleted
- Notifies friend if online
- Saves to file

---

### Requirement #8: Lấy danh sách bạn bè và trạng thái - 1 điểm

**Implementation:**
- **Files:** `src/common/friend.c`, `src/server/handlers.c`
- **Functions:** `get_friends()`, `handle_friend_list()`
- **Features:** Shows username, ID, and online/offline status

**Code Location:**
```
src/common/friend.c:72-90     - get_friends()
src/server/handlers.c:278-312 - handle_friend_list()
```

**How it works:**
- Gets all friends with "accepted" status
- Fetches user info for each friend
- Returns list with online/offline status

---

### Requirement #9: Gửi nhận tin nhắn giữa 2 người - 1 điểm

**Implementation:**
- **Files:** `src/common/message.c`, `src/server/handlers.c`, `src/server/server.c`
- **Functions:** `create_message()`, `handle_chat_send()`, `deliver_message()`
- **Features:** Friend validation, immediate delivery, offline queueing

**Code Location:**
```
src/common/message.c:49-70    - create_message()
src/server/handlers.c:314-375 - handle_chat_send()
src/server/server.c:391-406   - deliver_message()
```

**How it works:**
- Validates friendship exists
- Creates and saves message
- Delivers immediately if recipient online
- Queues if recipient offline
- Sends ACK to sender

---

### Requirement #10: Ngắt kết nối - 1 điểm

**Implementation:**
- **Files:** `src/server/server.c`, `src/server/handlers.c`
- **Functions:** `disconnect_client()`, `handle_logout()`, `broadcast_status_change()`
- **Features:** Graceful disconnect, status notification to friends

**Code Location:**
```
src/server/server.c:238-268   - disconnect_client()
src/server/handlers.c:107-134 - handle_logout()
src/server/server.c:343-364   - broadcast_status_change()
```

**How it works:**
- Updates user status to "offline"
- Invalidates session
- Notifies all online friends via MSG_STATUS_NOTIFY
- Closes socket
- Logs activity

---

### Requirement #11: Tạo nhóm chat - 1 điểm

**Implementation:**
- **Files:** `src/common/group.c`, `src/server/handlers.c`
- **Functions:** `create_group()`, `handle_group_create()`
- **Features:** Creator becomes admin automatically

**Code Location:**
```
src/common/group.c:56-79      - create_group()
src/server/handlers.c:377-415 - handle_group_create()
```

**How it works:**
- Creates group with name and description
- Adds creator as admin member
- Saves to groups.dat
- Returns group ID

---

### Requirement #12: Thêm người vào nhóm - 1 điểm

**Implementation:**
- **Files:** `src/common/group.c`, `src/server/handlers.c`
- **Functions:** `add_group_member()`, `handle_group_invite()`
- **Features:** Invitation system

**Code Location:**
```
src/common/group.c:120-140    - add_group_member()
src/server/handlers.c:417-458 - handle_group_invite()
```

**How it works:**
- Validates inviter is group member
- Sends invitation to target user
- Target can accept via handle_group_join()

---

### Requirement #13: Xóa người khỏi nhóm - 1 điểm

**Implementation:**
- **Files:** `src/common/group.c`, `src/server/handlers.c`
- **Functions:** `remove_group_member()`, `handle_group_remove_user()`
- **Features:** Admin-only action

**Code Location:**
```
src/common/group.c:145-162    - remove_group_member()
src/server/handlers.c:516-561 - handle_group_remove_user()
```

**How it works:**
- Validates user is admin
- Removes member from group
- Notifies removed user
- Saves to file

---

### Requirement #14: Rời nhóm chat - 1 điểm

**Implementation:**
- **Files:** `src/common/group.c`, `src/server/handlers.c`
- **Functions:** `remove_group_member()`, `handle_group_leave()`
- **Features:** User can leave voluntarily

**Code Location:**
```
src/server/handlers.c:490-514 - handle_group_leave()
```

**How it works:**
- Removes user from group
- Notifies other members
- Saves to file

---

### Requirement #15: Gửi nhận thông điệp trong nhóm - 1 điểm

**Implementation:**
- **Files:** `src/common/message.c`, `src/server/handlers.c`
- **Functions:** `create_message()`, `handle_group_message()`
- **Features:** Broadcast to all members, offline queueing

**Code Location:**
```
src/server/handlers.c:563-633 - handle_group_message()
src/common/message.c:85-97    - queue_offline_group_message()
```

**How it works:**
- Validates sender is group member
- Creates message with negative recipient_id (indicates group)
- Delivers to all online members
- Queues for offline members
- Excludes sender from recipients

---

### Requirement #16: Gửi tin nhắn offline - 1 điểm

**Implementation:**
- **Files:** `src/common/message.c`, `src/server/server.c`
- **Functions:** `queue_offline_message()`, `deliver_offline_messages()`
- **Features:** Store-and-forward mechanism

**Code Location:**
```
src/common/message.c:75-83    - queue_offline_message()
src/server/server.c:411-427   - deliver_offline_messages()
```

**How it works:**
- When recipient offline, message added to queue
- Queue stored in memory (persisted in messages.dat)
- On login, all queued messages delivered
- Messages marked as delivered

---

### Requirement #17: Ghi log hoạt động - 1 điểm

**Implementation:**
- **File:** `src/common/logger.c`
- **Functions:** `log_activity()`, `log_error()`, `log_info()`
- **Features:** Timestamped logs, user tracking

**Code Location:**
```
src/common/logger.c:3-21     - log_activity()
src/common/logger.c:23-41    - log_error()
src/common/logger.c:43-61    - log_info()
```

**Logged events:**
- REGISTER, LOGIN, LOGIN_FAIL, LOGOUT
- FRIEND_REQUEST, FRIEND_ACCEPT, FRIEND_REJECT, FRIEND_REMOVE
- GROUP_CREATE, GROUP_JOIN, GROUP_LEAVE, GROUP_INVITE
- CHAT_SEND, GROUP_MSG
- CONNECT, DISCONNECT, ERROR

**Log format:**
```
[2025-12-05 10:30:15] User=1 Event=LOGIN Data=alice
```

---

## Technical Highlights

### Key Technologies Used

1. **TCP Sockets** (Lec03, Lec04)
   - `socket()`, `bind()`, `listen()`, `accept()`, `connect()`
   - IPv4 addressing with `SOCKADDR_IN`

2. **I/O Multiplexing** (Lec06)
   - `select()` with `fd_set`
   - Handles multiple clients without threads

3. **Message Framing** (Lec04)
   - Length-prefixed protocol
   - Handles TCP stream boundaries

4. **Byte Order** (Lec03)
   - `htonl()`, `htons()` for network byte order
   - `ntohl()`, `ntohs()` for host byte order

5. **Session Management**
   - Token-based authentication
   - Timeout handling

6. **Data Persistence**
   - Binary file storage
   - In-memory caching

### Files Statistics

```
Total Files: 24
Header Files: 8
Source Files: 11
Documentation: 5

Lines of Code:
- Server: ~1500 lines
- Client: ~800 lines
- Common: ~900 lines
Total: ~3200 lines
```

### Protocol Messages

```
Total Message Types: 33
- Authentication: 6
- Friends: 8
- Chat: 3
- Groups: 13
- System: 3
```

## Testing Checklist

### Basic Functionality

- [x] Server starts on specified port
- [x] Client connects to server
- [x] User registration works
- [x] User login works
- [x] Session creation works
- [x] Friend request works
- [x] Friend accept/reject works
- [x] Friend removal works
- [x] Friend list shows status
- [x] Direct messaging works
- [x] Group creation works
- [x] Group invitation works
- [x] Group join works
- [x] Group leave works
- [x] Group remove user works
- [x] Group messaging works
- [x] Offline messages queued
- [x] Offline messages delivered on login
- [x] Logout notifies friends
- [x] Disconnect handled gracefully
- [x] Activity logged correctly

### Edge Cases

- [x] Multiple clients connect simultaneously
- [x] Client disconnects abruptly
- [x] Invalid login credentials
- [x] Duplicate username registration
- [x] Send message to non-friend
- [x] Send message to offline user
- [x] Non-admin tries to remove member
- [x] User tries to remove self from group
- [x] Session timeout after inactivity

## Conclusion

All 17 requirements have been fully implemented and tested. The application demonstrates comprehensive understanding of:

- TCP socket programming
- I/O multiplexing
- Network protocols
- Session management
- Data persistence
- Error handling
- Logging

The codebase follows best practices from the course lectures and is well-documented for educational purposes.
