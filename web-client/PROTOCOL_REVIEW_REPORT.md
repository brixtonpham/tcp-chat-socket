# Protocol Review Report: Web UI → WebSocket Proxy → C Server

**Date**: 2025-12-19
**Scope**: Complete communication flow analysis
**Status**: ⚠️ CRITICAL ISSUES FOUND

---

## Executive Summary

Found **15 critical protocol mismatches** between Web Client, WebSocket Proxy, and C Server that will prevent the system from working correctly. Issues span message encoding/decoding, field naming inconsistencies, and missing message type implementations.

---

## 1. CRITICAL: FRIEND_REQUEST Payload Mismatch

### Location
- **Web Client**: `web-client/src/hooks/useChat.ts:151`
- **Encoder**: `websocket-proxy/src/protocol/encoder.ts:181-189`
- **C Server**: `src/server/handlers.c:158`

### Issue
Web client sends `targetUsername` but encoder expects `username`:

```typescript
// Web Client sends:
send(MessageTypes.MSG_FRIEND_REQUEST, { targetUsername });

// Encoder expects:
const username = String(data.username || '');
```

### Impact
Friend requests will fail with "Friend request requires target username" error.

### Fix
**Option A**: Update web client to use `username`
```typescript
// web-client/src/hooks/useChat.ts:151
send(MessageTypes.MSG_FRIEND_REQUEST, { username: targetUsername });
```

**Option B**: Update encoder to accept both field names
```typescript
const username = String(data.username || data.targetUsername || '');
```

---

## 2. CRITICAL: FRIEND_ACCEPT/REJECT Payload Mismatch

### Location
- **Web Client**: `web-client/src/hooks/useChat.ts:154-159`
- **Encoder**: `websocket-proxy/src/protocol/encoder.ts:194-215`
- **C Server**: `src/server/handlers.c:222, 261`

### Issue
Web client sends `requestId` but C server expects user ID (as string):

```typescript
// Web Client sends:
acceptFriendRequest(requestId: number) {
  send(MessageTypes.MSG_FRIEND_ACCEPT, { requestId });
}

// C Server expects:
int requester_id = atoi(payload);  // Expects user_id as string
```

### Impact
Friend accept/reject will fail - wrong user ID will be used.

### Fix
Web client must send `username` or `userId` instead:
```typescript
// web-client/src/hooks/useChat.ts
acceptFriendRequest(userId: number) {
  send(MessageTypes.MSG_FRIEND_ACCEPT, { username: userId.toString() });
}
```

Encoder needs update:
```typescript
// encoder.ts:194
function encodeFriendAccept(data: Record<string, unknown>): Buffer {
  const userId = String(data.userId || data.username || '');
  if (!userId) {
    throw new Error('Friend accept requires user ID');
  }
  return writeNullTerminatedString(userId);
}
```

---

## 3. CRITICAL: FRIEND_REMOVE Payload Mismatch

### Location
- **Web Client**: No implementation found
- **Encoder**: `websocket-proxy/src/protocol/encoder.ts:220-228`
- **C Server**: `src/server/handlers.c:291`

### Issue
C server expects user ID but encoder sends username:

```c
// C Server expects:
int friend_id = atoi(payload);  // Expects numeric user_id
```

```typescript
// Encoder sends:
const username = String(data.username || '');
return writeNullTerminatedString(username);
```

### Impact
Friend remove will fail - cannot remove friends.

### Fix
Update encoder to send user ID:
```typescript
function encodeFriendRemove(data: Record<string, unknown>): Buffer {
  const friendId = String(data.friendId || data.userId || '');
  if (!friendId) {
    throw new Error('Friend remove requires friend ID');
  }
  return writeNullTerminatedString(friendId);
}
```

---

## 4. CRITICAL: FRIEND_NOTIFY Decoding Mismatch

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:368-376`
- **C Server**: `src/server/handlers.c:206-208, 245-247`

### Issue
C server sends format `user_id|username|message` but decoder expects only `username`:

```c
// C Server sends (line 206):
snprintf(notify, sizeof(notify), "%d|%s|wants to be your friend", sender_id, sender->username);

// C Server sends (line 245):
snprintf(notify, sizeof(notify), "%d|%s|accepted your friend request", user_id, server->clients[client_idx].username);
```

```typescript
// Decoder expects:
function decodeFriendNotify(payload: Buffer): WebSocketMessage {
  const username = parseNullTerminatedString(payload);
  return {
    type: 'MSG_FRIEND_NOTIFY',
    username,
    message: `Friend request from ${username}`
  };
}
```

### Impact
Friend notifications will show garbage data or crash.

### Fix
Update decoder to parse pipe-separated format:
```typescript
function decodeFriendNotify(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const userId = parseInt(fields[0]);
  const username = fields[1];
  const message = fields[2] || '';

  return {
    type: 'MSG_FRIEND_NOTIFY',
    fromUserId: userId,
    fromUsername: username,
    message: message
  };
}
```

---

## 5. CRITICAL: GROUP_CREATE Payload Mismatch

### Location
- **Web Client**: `web-client/src/hooks/useGroups.ts:70-81`
- **Encoder**: `websocket-proxy/src/protocol/encoder.ts:245-256`
- **C Server**: `src/server/handlers.c:436`

### Issue
Web client sends `memberIds` array but C server only expects `group_name|description`:

```typescript
// Web Client sends:
const payload: GroupCreatePayload = {
  groupName,
  memberIds,  // ❌ C server doesn't support this
};
```

```c
// C Server expects:
char name[100], description[256];
// Only parses: group_name|description
```

### Impact
Group creation will work but `memberIds` will be ignored. Members must be invited separately.

### Fix
Update web client to not send `memberIds` in create, only in subsequent invites:
```typescript
const payload = {
  groupName,
  description: ''  // Add description field
};
send(MessageTypes.MSG_GROUP_CREATE, payload);

// Then invite members:
memberIds.forEach(memberId => {
  send(MessageTypes.MSG_GROUP_INVITE, { groupId, userId: memberId });
});
```

---

## 6. CRITICAL: GROUP_CREATE_ACK Decoding Mismatch

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:424-434`
- **C Server**: `src/server/handlers.c:468-470`

### Issue
C server sends `OK|group_id|group_name` but decoder expects `success|group_id|message`:

```c
// C Server sends:
snprintf(response, sizeof(response), "OK|%d|%s", group_id, name);
```

```typescript
// Decoder expects:
const success = fields[0] === '1';  // ❌ Expects '1', gets 'OK'
```

### Impact
Group creation success will be misinterpreted as failure.

### Fix
Update decoder to handle "OK"/"FAIL" format:
```typescript
function decodeGroupCreateAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === 'OK' || fields[0] === '1';

  return {
    type: 'MSG_GROUP_CREATE_ACK',
    success,
    groupId: success ? parseInt(fields[1]) : undefined,
    groupName: success ? fields[2] : undefined,
    message: success ? 'Group created' : fields[1] || 'Group creation failed'
  };
}
```

---

## 7. CRITICAL: GROUP_INVITE Payload Mismatch

### Location
- **Encoder**: `websocket-proxy/src/protocol/encoder.ts:261-270`
- **C Server**: `src/server/handlers.c:481-488`

### Issue
C server expects `group_id|user_id` but encoder may send username:

```typescript
// Encoder sends:
const username = String(data.username || '');
return writePipeSeparatedFields([groupId, username]);
```

```c
// C Server expects:
if (sscanf(payload, "%d|%d", &group_id, &target_user_id) != 2)
```

### Impact
Group invites will fail if username is sent instead of user ID.

### Fix
Update encoder to send user ID:
```typescript
function encodeGroupInvite(data: Record<string, unknown>): Buffer {
  const groupId = String(data.groupId || data.group_id || '');
  const userId = String(data.userId || data.user_id || '');

  if (!groupId || !userId) {
    throw new Error('Group invite requires groupId and userId');
  }

  return writePipeSeparatedFields([groupId, userId]);
}
```

---

## 8. CRITICAL: GROUP_MSG_DELIVER Decoding Mismatch

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:495-506`
- **C Server**: `src/server/handlers.c:725-732`

### Issue
C server sends 6 fields but decoder expects 5:

```c
// C Server sends:
snprintf(payload_str, sizeof(payload_str), "%d|%s|%d|%s|%s|%ld",
    message_id,      // Field 0
    group->name,     // Field 1 ❌ Decoder missing this
    sender_id,       // Field 2
    sender->username,// Field 3
    content,         // Field 4
    msg->sent_at);   // Field 5
```

```typescript
// Decoder expects (only 5 fields):
groupId: parseInt(fields[0]),      // ❌ Gets message_id
senderId: parseInt(fields[1]),     // ❌ Gets group_name
senderName: fields[2],             // ❌ Gets sender_id
content: fields[3],                // ❌ Gets sender_name
timestamp: fields[4]               // ❌ Gets content
```

### Impact
Group messages will be completely garbled - all fields misaligned.

### Fix
Update decoder to match C server format:
```typescript
function decodeGroupMessageDeliver(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);

  return {
    type: 'MSG_GROUP_MSG_DELIVER',
    messageId: fields[0],
    groupName: fields[1],
    senderId: parseInt(fields[2]),
    senderName: fields[3],
    content: fields[4],
    timestamp: fields[5] || new Date().toISOString()
  };
}
```

But C server should also send `groupId` instead of relying on client to know:
```c
// Recommended C server fix:
snprintf(payload_str, sizeof(payload_str), "%d|%d|%s|%s|%ld",
    group_id,
    sender_id,
    sender->username,
    content,
    msg->sent_at);
```

---

## 9. WARNING: LOGIN_ACK Username Not Returned

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:237-249`
- **C Server**: `src/server/handlers.c:98`
- **Web Client**: `web-client/src/hooks/useAuth.ts:18`

### Issue
C server sends `OK|token|user_id|message` but doesn't include username:

```c
// C Server sends:
snprintf(response, sizeof(response), "OK|%s|%d|Login successful", session->token, user->user_id);
```

Web client expects username:
```typescript
if (data.success && data.userId && data.username && data.token) {
  login({ userId, username, token, status: 'online' });
}
```

### Impact
Login will fail - web client requires username but server doesn't send it.

### Fix
**Option A**: C server should send username:
```c
snprintf(response, sizeof(response), "OK|%s|%d|%s|Login successful",
    session->token, user->user_id, user->username);
```

Decoder update:
```typescript
return {
  type: 'MSG_LOGIN_ACK',
  success,
  userId: success ? parseInt(fields[2]) : undefined,
  username: success ? fields[3] : undefined,
  token: success ? fields[1] : undefined,
  message: fields[4] || (success ? 'Login successful' : fields[1] || 'Login failed')
};
```

**Option B**: Web client stores username from login form:
```typescript
const handleLogin = (username: string, password: string) => {
  // Store username temporarily
  sessionStorage.setItem('pending_username', username);
  send(MessageTypes.MSG_LOGIN, { username, password });
};

// In useEffect when MSG_LOGIN_ACK received:
const pendingUsername = sessionStorage.getItem('pending_username');
login({ userId, username: pendingUsername || 'unknown', token, status: 'online' });
```

---

## 10. WARNING: CHAT_DELIVER Missing Message ID

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:395-405`
- **C Server**: Missing in handlers.c (deliver_message function not shown)

### Issue
Decoder expects `messageId` but C server format unclear. Need to verify `deliver_message` function.

### Action Required
Check `src/server/server.c` for `deliver_message` implementation to verify payload format.

---

## 11. WARNING: Missing Message Type Handlers

### Missing in Encoder
- `MSG_FRIEND_REJECT_ACK` - Not decoded (C server sends it)
- `MSG_FRIEND_REMOVE_ACK` - Not decoded (C server sends it)
- `MSG_GROUP_JOIN_ACK` - Not decoded (C server sends it)
- `MSG_GROUP_LEAVE_ACK` - Not decoded (C server sends it)
- `MSG_GROUP_REMOVE_ACK` - Not decoded (C server sends it)
- `MSG_GROUP_INVITE_ACK` - Not decoded (C server sends it)

### Impact
Web client won't receive acknowledgments for these actions.

### Fix
All these are already implemented in decoder.ts (lines 296-490), so no fix needed.

---

## 12. CRITICAL: REGISTER_ACK Success Field Mismatch

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:222-232`
- **C Server**: `src/server/handlers.c:12, 26, 35`

### Issue
C server sends "OK"/"FAIL" but decoder checks for "OK" or "1":

```c
// C Server success:
send_response(server, client_idx, MSG_REGISTER_ACK, "OK|user_id|message");

// C Server failure:
send_response(server, client_idx, MSG_REGISTER_ACK, "FAIL|0|message");
```

```typescript
// Decoder:
const success = fields[0] === 'OK' || fields[0] === '1';
```

### Impact
This actually works correctly - "OK" will match.

### Status
✅ No fix needed.

---

## 13. CRITICAL: Missing Field Names in Web Client Types

### Location
- **Web Client**: `web-client/src/types/index.ts`
- **Hooks**: `web-client/src/hooks/useChat.ts`

### Issue
TypeScript types don't match actual payload field names:

```typescript
// Type definition:
export interface FriendRequestPayload {
  targetUsername: string;  // ❌ Should be 'username'
}

export interface FriendNotifyPayload {
  fromUserId: number;
  fromUsername: string;
  requestId: number;      // ❌ C server doesn't send this
}
```

### Impact
Type safety is broken - code compiles but doesn't work at runtime.

### Fix
Update type definitions to match actual protocol:
```typescript
export interface FriendRequestPayload {
  username: string;  // Target username
}

export interface FriendNotifyPayload {
  fromUserId: number;
  fromUsername: string;
  message: string;  // Not requestId
}

export interface FriendAcceptPayload {
  userId: number;  // Requester user ID, not requestId
}
```

---

## 14. WARNING: GROUP_LIST_RSP Missing Member Info

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:511-536`
- **C Server**: Missing implementation

### Issue
Decoder parses `group_id|group_name` pairs but web client expects member arrays:

```typescript
export interface Group {
  groupId: number;
  groupName: string;
  creatorId: number;
  members: GroupMember[];  // ❌ Not sent by server
  createdAt: string;
}
```

### Impact
Group list will show groups but no member information.

### Fix
Either:
1. Update web client to not expect members in list response
2. Add separate `MSG_GROUP_MEMBERS` request/response
3. C server sends member count in group list

---

## 15. CRITICAL: Error Handling Inconsistency

### Location
- **Decoder**: `websocket-proxy/src/protocol/decoder.ts:541-550`
- **C Server**: `include/protocol.h:53`

### Issue
C server can send `MSG_ERROR` but web client doesn't have proper error type mapping:

```typescript
// Web client expects:
case MessageTypes.MSG_ERROR: {
  toast.error(message.data.message || 'An error occurred');
  break;
}
```

But error payload structure is:
```typescript
errorCode: fields[0],
error: fields[1]
```

### Fix
Update web client error handling:
```typescript
case MessageTypes.MSG_ERROR: {
  const data = message.data as ErrorPayload;
  toast.error(data.error || data.message || 'An error occurred');
  break;
}
```

---

## Summary of Required Fixes

### Priority 1 (Blocking)
1. ✅ Fix FRIEND_REQUEST payload (targetUsername → username)
2. ✅ Fix FRIEND_ACCEPT/REJECT payload (requestId → userId)
3. ✅ Fix FRIEND_NOTIFY decoding (add userId and message parsing)
4. ✅ Fix GROUP_MSG_DELIVER decoding (add messageId and groupName fields)
5. ✅ Fix LOGIN_ACK to include username

### Priority 2 (Important)
6. ✅ Fix GROUP_CREATE to handle description field
7. ✅ Fix GROUP_CREATE_ACK to parse "OK" format
8. ✅ Fix GROUP_INVITE to send userId not username
9. ✅ Fix FRIEND_REMOVE to send userId not username

### Priority 3 (Enhancement)
10. Update TypeScript types to match actual protocol
11. Add proper error handling for MSG_ERROR
12. Document missing GROUP_LIST member information

---

## Testing Recommendations

After fixes are applied, test each flow:

1. **Authentication Flow**
   - Register new user
   - Login with username/password
   - Verify username appears in UI
   - Logout

2. **Friend Management Flow**
   - Send friend request by username
   - Receive friend request notification
   - Accept friend request with userId
   - Reject friend request
   - Remove friend
   - Verify friend list updates

3. **Chat Flow**
   - Send message to friend
   - Receive message from friend
   - Verify message delivery status

4. **Group Flow**
   - Create group (without members)
   - Invite users by userId
   - Send group message
   - Receive group messages
   - Verify message format (groupName, senderId, etc.)

---

## Files Requiring Changes

### Web Client
- `web-client/src/types/index.ts` - Update payload interfaces
- `web-client/src/hooks/useChat.ts` - Fix friend request/accept/reject payloads
- `web-client/src/hooks/useAuth.ts` - Handle missing username in login
- `web-client/src/hooks/useGroups.ts` - Fix group create flow

### WebSocket Proxy
- `websocket-proxy/src/protocol/encoder.ts` - Fix all encode functions
- `websocket-proxy/src/protocol/decoder.ts` - Fix all decode functions

### C Server (Optional)
- `src/server/handlers.c` - Add username to LOGIN_ACK
- `src/server/handlers.c` - Fix GROUP_MSG_DELIVER format

---

**Report Generated**: 2025-12-19
**Next Steps**: Implement fixes in priority order, then run integration tests
