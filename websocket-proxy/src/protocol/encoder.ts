/**
 * Binary encoder - converts WebSocket JSON messages to C server binary protocol
 *
 * Binary format:
 * - Header: 4-byte length (network byte order, big-endian) + 2-byte type
 * - Payload: Variable length, null-terminated strings separated by |
 */

import { logger } from '../utils/logger';
import {
  WebSocketMessage,
  getMessageTypeCode,
  MSG_REGISTER,
  MSG_LOGIN,
  MSG_LOGOUT,
  MSG_FRIEND_REQUEST,
  MSG_FRIEND_ACCEPT,
  MSG_FRIEND_REJECT,
  MSG_FRIEND_REMOVE,
  MSG_FRIEND_LIST,
  MSG_CHAT_SEND,
  MSG_GROUP_CREATE,
  MSG_GROUP_INVITE,
  MSG_GROUP_JOIN,
  MSG_GROUP_LEAVE,
  MSG_GROUP_REMOVE_USER,
  MSG_GROUP_MSG,
  MSG_GROUP_LIST,
  MSG_HEARTBEAT,
} from './types';

/**
 * Encode WebSocket JSON message to binary format
 */
export function encodeMessage(message: WebSocketMessage): Buffer {
  const typeCode = getMessageTypeCode(message.type);

  if (typeCode === null) {
    throw new Error(`Unknown message type: ${message.type}`);
  }

  logger.debug('Encoding message', { type: message.type, typeCode, data: message.data });

  const payload = encodePayload(typeCode, message.data || {});

  // Create header: 4-byte length + 2-byte type
  const header = Buffer.alloc(6);
  const totalLength = 6 + payload.length;

  header.writeUInt32BE(totalLength, 0); // Network byte order (big-endian)
  header.writeUInt16BE(typeCode, 4);

  const result = Buffer.concat([header, payload]);

  logger.debug('Encoded message', {
    length: result.length,
    typeCode,
    payloadSize: payload.length
  });

  return result;
}

/**
 * Encode payload based on message type
 */
function encodePayload(typeCode: number, data: Record<string, unknown>): Buffer {
  switch (typeCode) {
    // Authentication
    case MSG_REGISTER:
      return encodeRegister(data);
    case MSG_LOGIN:
      return encodeLogin(data);
    case MSG_LOGOUT:
      return encodeLogout(data);

    // Friends
    case MSG_FRIEND_REQUEST:
      return encodeFriendRequest(data);
    case MSG_FRIEND_ACCEPT:
      return encodeFriendAccept(data);
    case MSG_FRIEND_REJECT:
      return encodeFriendReject(data);
    case MSG_FRIEND_REMOVE:
      return encodeFriendRemove(data);
    case MSG_FRIEND_LIST:
      return encodeEmpty(); // No payload

    // Chat
    case MSG_CHAT_SEND:
      return encodeChatSend(data);

    // Groups
    case MSG_GROUP_CREATE:
      return encodeGroupCreate(data);
    case MSG_GROUP_INVITE:
      return encodeGroupInvite(data);
    case MSG_GROUP_JOIN:
      return encodeGroupJoin(data);
    case MSG_GROUP_LEAVE:
      return encodeGroupLeave(data);
    case MSG_GROUP_REMOVE_USER:
      return encodeGroupRemoveUser(data);
    case MSG_GROUP_MSG:
      return encodeGroupMessage(data);
    case MSG_GROUP_LIST:
      return encodeEmpty(); // No payload

    // System
    case MSG_HEARTBEAT:
      return encodeEmpty(); // No payload

    default:
      throw new Error(`Unsupported message type for encoding: ${typeCode}`);
  }
}

/**
 * Helper: Write null-terminated string
 */
function writeNullTerminatedString(str: string): Buffer {
  const buf = Buffer.from(str, 'utf8');
  return Buffer.concat([buf, Buffer.from([0x00])]);
}

/**
 * Helper: Write pipe-separated fields with null terminator
 */
function writePipeSeparatedFields(fields: string[]): Buffer {
  const content = fields.join('|');
  const buf = Buffer.from(content, 'utf8');
  return Buffer.concat([buf, Buffer.from([0x00])]);
}

/**
 * Helper: Empty payload
 */
function encodeEmpty(): Buffer {
  return Buffer.alloc(0);
}

/**
 * MSG_REGISTER: username|password|email
 */
function encodeRegister(data: Record<string, unknown>): Buffer {
  const username = String(data.username || '');
  const password = String(data.password || '');
  const email = String(data.email || `${username}@example.com`);

  if (!username || !password) {
    throw new Error('Register requires username and password');
  }

  return writePipeSeparatedFields([username, password, email]);
}

/**
 * MSG_LOGIN: username|password
 */
function encodeLogin(data: Record<string, unknown>): Buffer {
  const username = String(data.username || '');
  const password = String(data.password || '');

  if (!username || !password) {
    throw new Error('Login requires username and password');
  }

  return writePipeSeparatedFields([username, password]);
}

/**
 * MSG_LOGOUT: No payload (user identified by TCP connection)
 */
function encodeLogout(_data: Record<string, unknown>): Buffer {
  return encodeEmpty();
}

/**
 * MSG_FRIEND_REQUEST: username (target username)
 */
function encodeFriendRequest(data: Record<string, unknown>): Buffer {
  const username = String(data.username || data.targetUsername || '');

  if (!username) {
    throw new Error('Friend request requires target username');
  }

  return writeNullTerminatedString(username);
}

/**
 * MSG_FRIEND_ACCEPT: userId (requester user ID)
 */
function encodeFriendAccept(data: Record<string, unknown>): Buffer {
  const userId = String(data.userId || data.requesterId || '');

  if (!userId) {
    throw new Error('Friend accept requires requester userId');
  }

  return writeNullTerminatedString(userId);
}

/**
 * MSG_FRIEND_REJECT: userId (requester user ID)
 */
function encodeFriendReject(data: Record<string, unknown>): Buffer {
  const userId = String(data.userId || data.requesterId || '');

  if (!userId) {
    throw new Error('Friend reject requires requester userId');
  }

  return writeNullTerminatedString(userId);
}

/**
 * MSG_FRIEND_REMOVE: userId (friend user ID)
 */
function encodeFriendRemove(data: Record<string, unknown>): Buffer {
  const userId = String(data.userId || data.friendId || '');

  if (!userId) {
    throw new Error('Friend remove requires friend userId');
  }

  return writeNullTerminatedString(userId);
}

/**
 * MSG_CHAT_SEND: recipient_id|content
 */
function encodeChatSend(data: Record<string, unknown>): Buffer {
  const recipientId = String(data.recipientId || data.recipient_id || '');
  const content = String(data.content || '');

  if (!recipientId || !content) {
    throw new Error('Chat send requires recipientId and content');
  }

  return writePipeSeparatedFields([recipientId, content]);
}

/**
 * MSG_GROUP_CREATE: group_name|description
 */
function encodeGroupCreate(data: Record<string, unknown>): Buffer {
  const groupName = String(data.groupName || data.group_name || '');
  const description = String(data.description || '');

  if (!groupName) {
    throw new Error('Group create requires group name');
  }

  return writePipeSeparatedFields([groupName, description]);
}

/**
 * MSG_GROUP_INVITE: group_id|user_id
 */
function encodeGroupInvite(data: Record<string, unknown>): Buffer {
  const groupId = String(data.groupId || data.group_id || '');
  const userId = String(data.userId || data.user_id || '');

  if (!groupId || !userId) {
    throw new Error('Group invite requires groupId and userId');
  }

  return writePipeSeparatedFields([groupId, userId]);
}

/**
 * MSG_GROUP_JOIN: group_id
 */
function encodeGroupJoin(data: Record<string, unknown>): Buffer {
  const groupId = String(data.groupId || data.group_id || '');

  if (!groupId) {
    throw new Error('Group join requires group ID');
  }

  return writeNullTerminatedString(groupId);
}

/**
 * MSG_GROUP_LEAVE: group_id
 */
function encodeGroupLeave(data: Record<string, unknown>): Buffer {
  const groupId = String(data.groupId || data.group_id || '');

  if (!groupId) {
    throw new Error('Group leave requires group ID');
  }

  return writeNullTerminatedString(groupId);
}

/**
 * MSG_GROUP_REMOVE_USER: group_id|user_id
 */
function encodeGroupRemoveUser(data: Record<string, unknown>): Buffer {
  const groupId = String(data.groupId || data.group_id || '');
  const userId = String(data.userId || data.user_id || '');

  if (!groupId || !userId) {
    throw new Error('Group remove user requires groupId and userId');
  }

  return writePipeSeparatedFields([groupId, userId]);
}

/**
 * MSG_GROUP_MSG: group_id|content
 */
function encodeGroupMessage(data: Record<string, unknown>): Buffer {
  const groupId = String(data.groupId || data.group_id || '');
  const content = String(data.content || '');

  if (!groupId || !content) {
    throw new Error('Group message requires groupId and content');
  }

  return writePipeSeparatedFields([groupId, content]);
}
