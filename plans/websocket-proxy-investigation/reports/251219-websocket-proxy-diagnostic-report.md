# WebSocket Proxy Diagnostic Report

**Date:** 2025-12-19
**Investigation Target:** WebSocket Proxy (Node.js/TypeScript) in `websocket-proxy/` directory
**Status:** CRITICAL ISSUES IDENTIFIED

---

## Executive Summary

The WebSocket proxy implementation has **MULTIPLE CRITICAL BUGS** that prevent proper communication with the C TCP server. The issues span protocol encoding/decoding, message format mismatches, and payload handling errors.

**Severity:** HIGH - Proxy is non-functional for most operations
**Root Causes:** Protocol format mismatches, incomplete payload encoding, incorrect field parsing

---

## Critical Issues Found

### 1. CRITICAL: Encoder - Missing Null Terminators in Pipe-Separated Fields

**Location:** `websocket-proxy/src/protocol/encoder.ts`

**Problem:**
The encoder function `writePipeSeparatedFields()` (line 129-132) does NOT add null terminators after pipe-separated content, but the C server expects null-terminated strings.

**Evidence from C Server:**
```c
// From handlers.c line 11
if (sscanf(payload, "%49[^|]|%49[^|]|%99s", username, password, email) != 3) {
    send_response(server, client_idx, MSG_REGISTER_ACK, "FAIL|0|Invalid format");
    return -1;
}
```

The C server uses `sscanf` which requires null-terminated strings. The current encoder sends:
- Current: `username|password|email` (NO null terminator)
- Expected: `username|password|email\0` (WITH null terminator)

**Affected Functions:**
- `encodeRegister()` - line 144-154
- `encodeLogin()` - line 159-168
- `encodeChatSend()` - line 232-241
- `encodeGroupInvite()` - line 259-268
- `encodeGroupRemoveUser()` - line 299-308
- `encodeGroupMessage()` - line 313-322

**Impact:** Registration, login, chat, and group operations will FAIL with "Invalid format" errors.

---

### 2. CRITICAL: Encoder - Wrong Payload Format for Group Create

**Location:** `websocket-proxy/src/protocol/encoder.ts`, line 246-254

**Problem:**
The encoder expects only `group_name` but the C server handler (handlers.c line 434-449) expects `group_name|description`.

**Current Implementation:**
```typescript
function encodeGroupCreate(data: Record<string, unknown>): Buffer {
  const groupName = String(data.groupName || data.group_name || '');
  if (!groupName) {
    throw new Error('Group create requires group name');
  }
  return writeNullTerminatedString(groupName);
}
```

**Expected by C Server:**
```c
// handlers.c line 434-449
char name[100], description[256];
char *delimiter = strchr(payload, '|');

if (delimiter) {
    strncpy(name, payload, delimiter - payload);
    // ... expects description after |
}
```

**Impact:** Group creation will fail or have undefined behavior.

---

### 3. CRITICAL: Decoder - Wrong Field Order in MSG_LOGIN_ACK

**Location:** `websocket-proxy/src/protocol/decoder.ts`, line 245-257

**Problem:**
The decoder parses fields in wrong order. C server sends: `OK|token|user_id|message` but decoder expects different order.

**C Server Response (handlers.c line 98):**
```c
snprintf(response, sizeof(response), "OK|%s|%d|Login successful", session->token, user->user_id);
```

**Current Decoder:**
```typescript
function decodeLoginAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === 'OK' || fields[0] === '1';

  return {
    type: 'MSG_LOGIN_ACK',
    success,
    userId: success ? parseInt(fields[2]) : undefined,  // CORRECT
    token: success ? fields[1] : undefined,              // CORRECT
    username: undefined, // Username not in this response format
    message: fields[3] || (success ? 'Login successful' : fields[1] || 'Login failed')
  };
}
```

**Analysis:** Actually the field order is CORRECT (token=fields[1], userId=fields[2]), but there's an issue with failure handling - it tries to use fields[1] as error message when it should be empty on failure.

**Impact:** Login failure messages may be incorrectly displayed.

---

### 4. CRITICAL: Decoder - Wrong Success Flag Parsing

**Location:** `websocket-proxy/src/protocol/decoder.ts`, multiple functions

**Problem:**
Different ACK messages use different success indicators. Some use "OK"/"FAIL", others use "1"/"0", but decoder inconsistently checks both or only one.

**Examples:**

Line 232 (Register ACK):
```typescript
const success = fields[0] === 'OK' || fields[0] === '1';
```

Line 277 (Friend Request ACK):
```typescript
const success = fields[0] === '1';  // ONLY checks '1', NOT 'OK'
```

Line 263 (Logout ACK):
```typescript
const success = parseSuccessStatus(payload);  // Checks payload[0] === 1 (byte)
```

**C Server Responses:**
- Register: sends "OK" or "FAIL" (handlers.c line 35-36)
- Login: sends "OK" or "FAIL" (handlers.c line 98)
- Logout: sends "OK|Goodbye" (handlers.c line 146)
- Friend operations: send "1|message" or "0|message" format

**Impact:** Inconsistent success/failure detection across different message types.

---

### 5. MAJOR: Decoder - Incorrect Logout ACK Parsing

**Location:** `websocket-proxy/src/protocol/decoder.ts`, line 262-270

**Problem:**
Uses `parseSuccessStatus()` which checks first byte (0x00 or 0x01), but C server sends "OK|Goodbye" (string format).

**Current Decoder:**
```typescript
function decodeLogoutAck(payload: Buffer): WebSocketMessage {
  const success = parseSuccessStatus(payload);  // Checks payload[0] === 1
  return {
    type: 'MSG_LOGOUT_ACK',
    success,
    message: success ? 'Logout successful' : 'Logout failed'
  };
}
```

**C Server Response (handlers.c line 146):**
```c
send_response(server, client_idx, MSG_LOGOUT_ACK, "OK|Goodbye");
```

**Expected Parsing:**
```typescript
const fields = parsePipeSeparatedFields(payload);
const success = fields[0] === 'OK';
const message = fields[1] || 'Logout successful';
```

**Impact:** Logout acknowledgments will always be parsed incorrectly.

---

### 6. MAJOR: Decoder - Wrong Friend List Response Format

**Location:** `websocket-proxy/src/protocol/decoder.ts`, line 331-357

**Problem:**
The decoder expects format `friend1_id|friend1_name|friend1_status,friend2_id|...` but C server sends different format.

**C Server Response (handlers.c line 350-360):**
```c
char final_response[BUFFER_SIZE];
snprintf(final_response, sizeof(final_response), "%d|%s", count, response);
send_response(server, client_idx, MSG_FRIEND_LIST_RSP, final_response);
```

The C server sends: `count|friend1_id|friend1_name|friend1_status,friend2_id|...`

**Current Decoder:**
```typescript
function decodeFriendListResponse(payload: Buffer): WebSocketMessage {
  const text = payload.toString('utf8').replace(/\0/g, '');

  if (!text || text.length === 0) {
    return { type: 'MSG_FRIEND_LIST_RSP', success: true, friends: [] };
  }

  const friendEntries = text.split(',');  // Missing count prefix handling
  const friends = friendEntries.map(entry => {
    const [id, username, status] = entry.split('|');
    return { userId: parseInt(id), username, status: status || 'offline' };
  });

  return { type: 'MSG_FRIEND_LIST_RSP', success: true, friends };
}
```

**Impact:** Friend list will include the count as the first "friend" entry, corrupting the data.

---

### 7. MAJOR: Decoder - Missing Chat ACK Success Field Parsing

**Location:** `websocket-proxy/src/protocol/decoder.ts`, line 404-413

**Problem:**
Expects format `success|message_id` but C server sends "OK|message_id".

**C Server Response (handlers.c line 410-412):**
```c
char ack[50];
snprintf(ack, sizeof(ack), "OK|%d", message_id);
send_response(server, client_idx, MSG_CHAT_ACK, ack);
```

**Current Decoder:**
```typescript
function decodeChatAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';  // WRONG: should check for 'OK'

  return {
    type: 'MSG_CHAT_ACK',
    success,
    messageId: success ? fields[1] : undefined
  };
}
```

**Expected:**
```typescript
const success = fields[0] === 'OK';
```

**Impact:** Chat acknowledgments will always fail to parse correctly.

---

### 8. MINOR: Encoder - Missing Default Email in Register

**Location:** `websocket-proxy/src/protocol/encoder.ts`, line 147

**Problem:**
The encoder provides a default email `${username}@example.com` which is good, but this should be documented or the default might not match expectations.

**Current:**
```typescript
const email = String(data.email || `${username}@example.com`);
```

**Impact:** LOW - This is actually a reasonable default, but should be documented.

---

### 9. DOCUMENTATION: Comment Says "null-terminated" but Uses Pipe-Separated

**Location:** `websocket-proxy/src/protocol/encoder.ts`, line 6

**Problem:**
File header says "null-terminated strings separated by |" which is confusing. They should be "pipe-separated fields with null terminator at end".

**Current Comment:**
```typescript
 * - Payload: Variable length, null-terminated strings separated by |
```

**Correct Comment:**
```typescript
 * - Payload: Variable length, pipe-separated fields, null-terminated
```

**Impact:** DOCUMENTATION - May confuse future maintainers.

---

### 10. MISSING: No Validation of Required TCP Connection State

**Location:** `websocket-proxy/src/server.ts`, line 98-124

**Problem:**
The code connects to TCP first, which is good, but if TCP connection fails during initial connection, error handling is present. However, there's no check for TCP connection state before setting up handlers.

**Current Code (line 98-124):**
```typescript
try {
  await tcpClient.connect();
  logger.info('TCP connection established for WebSocket client', { clientId });

  // Set up WebSocket event handlers AFTER TCP connection is established
  this.setupWebSocketHandlers(connection);
  this.setupTCPHandlers(connection);
} catch (error) {
  // Error handling
}
```

**Analysis:** This is actually CORRECT - handlers are only set up if TCP connect succeeds. No issue here.

**Impact:** NONE - This is implemented correctly.

---

## Summary of Issues by Severity

### CRITICAL (Must Fix Immediately)
1. Missing null terminators in pipe-separated fields (encoder)
2. Wrong payload format for group create (encoder)
3. Incorrect logout ACK parsing (decoder)
4. Wrong chat ACK success parsing (decoder)
5. Wrong friend list format parsing (decoder)

### MAJOR (Should Fix Soon)
6. Inconsistent success flag parsing across decoders
7. Login ACK failure message handling

### MINOR (Nice to Have)
8. Missing documentation for default email

### DOCUMENTATION
9. Confusing comment about payload format

---

## Recommended Fix Priority

1. **FIRST:** Fix encoder null terminator issue - affects all pipe-separated messages
2. **SECOND:** Fix decoder ACK parsing for logout, chat, friend list
3. **THIRD:** Fix group create payload format
4. **FOURTH:** Standardize success flag parsing across all decoders
5. **FIFTH:** Update documentation

---

## Testing Recommendations

After fixes:
1. Test register flow with C server
2. Test login flow with C server
3. Test logout flow
4. Test friend operations (request, accept, list)
5. Test chat messaging
6. Test group operations (create, invite, message)
7. Test heartbeat mechanism
8. Test reconnection logic

---

## Evidence Chain

All findings based on:
1. C server protocol implementation (`src/common/protocol.c`)
2. C server message handlers (`src/server/handlers.c`)
3. WebSocket proxy encoder (`websocket-proxy/src/protocol/encoder.ts`)
4. WebSocket proxy decoder (`websocket-proxy/src/protocol/decoder.ts`)
5. Protocol header definitions (`include/protocol.h`)

---

## Conclusion

The WebSocket proxy has **systematic protocol implementation errors** that prevent proper communication with the C server. The primary issues are:

1. **Encoder doesn't add null terminators** to pipe-separated payloads
2. **Decoder uses inconsistent parsing logic** for success/failure indicators
3. **Decoder expects wrong formats** for several message types (logout, chat ack, friend list)

These issues will cause registration, login, chat, and group operations to fail or behave incorrectly.

**Recommendation:** Fix all CRITICAL issues before deployment. The proxy is currently NON-FUNCTIONAL for most operations.
