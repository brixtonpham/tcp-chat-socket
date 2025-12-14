/**
 * Binary decoder - converts C server binary messages to WebSocket JSON
 *
 * Binary format:
 * - Header: 4-byte length (network byte order, big-endian) + 2-byte type
 * - Payload: Variable length, pipe-separated or null-terminated strings
 */

import { logger } from '../utils/logger';
import {
  WebSocketMessage,
  BinaryMessage,
  getMessageTypeName,
  MSG_REGISTER_ACK,
  MSG_LOGIN_ACK,
  MSG_LOGOUT_ACK,
  MSG_FRIEND_REQUEST_ACK,
  MSG_FRIEND_ACCEPT_ACK,
  MSG_FRIEND_REJECT_ACK,
  MSG_FRIEND_REMOVE_ACK,
  MSG_FRIEND_LIST_RSP,
  MSG_FRIEND_NOTIFY,
  MSG_STATUS_NOTIFY,
  MSG_CHAT_DELIVER,
  MSG_CHAT_ACK,
  MSG_GROUP_CREATE_ACK,
  MSG_GROUP_INVITE_ACK,
  MSG_GROUP_JOIN_ACK,
  MSG_GROUP_LEAVE_ACK,
  MSG_GROUP_REMOVE_ACK,
  MSG_GROUP_MSG_DELIVER,
  MSG_GROUP_LIST_RSP,
  MSG_ERROR,
  MSG_HEARTBEAT_ACK,
} from './types';

/**
 * Message buffer accumulator for handling TCP stream fragmentation
 */
export class MessageBuffer {
  private buffer: Buffer = Buffer.alloc(0);

  /**
   * Append data to buffer
   */
  append(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
  }

  /**
   * Try to extract complete messages from buffer
   */
  extractMessages(): BinaryMessage[] {
    const messages: BinaryMessage[] = [];

    while (true) {
      // Need at least 6 bytes for header (4-byte length + 2-byte type)
      if (this.buffer.length < 6) {
        break;
      }

      // Read message length (first 4 bytes, big-endian)
      const messageLength = this.buffer.readUInt32BE(0);

      // Check if we have the complete message
      if (this.buffer.length < messageLength) {
        logger.debug('Incomplete message in buffer', {
          expected: messageLength,
          available: this.buffer.length
        });
        break;
      }

      // Extract message type (2 bytes after length)
      const messageType = this.buffer.readUInt16BE(4);

      // Extract payload (everything after 6-byte header)
      const payloadLength = messageLength - 6;
      const payload = this.buffer.subarray(6, 6 + payloadLength);

      messages.push({
        type: messageType,
        payload: payload
      });

      logger.debug('Extracted message from buffer', {
        type: getMessageTypeName(messageType),
        typeCode: messageType,
        length: messageLength,
        payloadLength
      });

      // Remove processed message from buffer
      this.buffer = this.buffer.subarray(messageLength);
    }

    return messages;
  }

  /**
   * Get current buffer size
   */
  size(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = Buffer.alloc(0);
  }
}

/**
 * Decode binary message to WebSocket JSON format
 */
export function decodeMessage(message: BinaryMessage): WebSocketMessage {
  const typeName = getMessageTypeName(message.type);

  logger.debug('Decoding message', {
    type: typeName,
    typeCode: message.type,
    payloadLength: message.payload.length
  });

  const result = decodePayload(message.type, message.payload);

  logger.debug('Decoded message', { type: typeName, data: result });

  return result;
}

/**
 * Decode payload based on message type
 */
function decodePayload(typeCode: number, payload: Buffer): WebSocketMessage {
  switch (typeCode) {
    // Authentication responses
    case MSG_REGISTER_ACK:
      return decodeRegisterAck(payload);
    case MSG_LOGIN_ACK:
      return decodeLoginAck(payload);
    case MSG_LOGOUT_ACK:
      return decodeLogoutAck(payload);

    // Friend responses
    case MSG_FRIEND_REQUEST_ACK:
      return decodeFriendRequestAck(payload);
    case MSG_FRIEND_ACCEPT_ACK:
      return decodeFriendAcceptAck(payload);
    case MSG_FRIEND_REJECT_ACK:
      return decodeFriendRejectAck(payload);
    case MSG_FRIEND_REMOVE_ACK:
      return decodeFriendRemoveAck(payload);
    case MSG_FRIEND_LIST_RSP:
      return decodeFriendListResponse(payload);
    case MSG_FRIEND_NOTIFY:
      return decodeFriendNotify(payload);
    case MSG_STATUS_NOTIFY:
      return decodeStatusNotify(payload);

    // Chat responses
    case MSG_CHAT_DELIVER:
      return decodeChatDeliver(payload);
    case MSG_CHAT_ACK:
      return decodeChatAck(payload);

    // Group responses
    case MSG_GROUP_CREATE_ACK:
      return decodeGroupCreateAck(payload);
    case MSG_GROUP_INVITE_ACK:
      return decodeGroupInviteAck(payload);
    case MSG_GROUP_JOIN_ACK:
      return decodeGroupJoinAck(payload);
    case MSG_GROUP_LEAVE_ACK:
      return decodeGroupLeaveAck(payload);
    case MSG_GROUP_REMOVE_ACK:
      return decodeGroupRemoveAck(payload);
    case MSG_GROUP_MSG_DELIVER:
      return decodeGroupMessageDeliver(payload);
    case MSG_GROUP_LIST_RSP:
      return decodeGroupListResponse(payload);

    // System
    case MSG_ERROR:
      return decodeError(payload);
    case MSG_HEARTBEAT_ACK:
      return decodeHeartbeatAck(payload);

    default:
      logger.warn(`Unsupported message type for decoding: ${typeCode}`);
      return {
        type: getMessageTypeName(typeCode),
        data: { rawPayload: payload.toString('hex') }
      };
  }
}

/**
 * Helper: Parse pipe-separated fields
 */
function parsePipeSeparatedFields(payload: Buffer): string[] {
  const text = payload.toString('utf8').replace(/\0/g, ''); // Remove null terminators
  return text.split('|').filter(f => f.length > 0);
}

/**
 * Helper: Parse null-terminated string
 */
function parseNullTerminatedString(payload: Buffer): string {
  const nullIndex = payload.indexOf(0x00);
  if (nullIndex === -1) {
    return payload.toString('utf8');
  }
  return payload.subarray(0, nullIndex).toString('utf8');
}

/**
 * Helper: Parse success status (first byte: 0 = fail, 1 = success)
 */
function parseSuccessStatus(payload: Buffer): boolean {
  if (payload.length === 0) return false;
  return payload[0] === 1;
}

/**
 * MSG_REGISTER_ACK: success|user_id|message
 */
function decodeRegisterAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_REGISTER_ACK',
    success,
    userId: success ? parseInt(fields[1]) : undefined,
    message: fields[2] || (success ? 'Registration successful' : 'Registration failed')
  };
}

/**
 * MSG_LOGIN_ACK: success|user_id|token|username
 */
function decodeLoginAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_LOGIN_ACK',
    success,
    userId: success ? parseInt(fields[1]) : undefined,
    token: success ? fields[2] : undefined,
    username: success ? fields[3] : undefined,
    message: success ? 'Login successful' : fields[1] || 'Login failed'
  };
}

/**
 * MSG_LOGOUT_ACK: success
 */
function decodeLogoutAck(payload: Buffer): WebSocketMessage {
  const success = parseSuccessStatus(payload);

  return {
    type: 'MSG_LOGOUT_ACK',
    success,
    message: success ? 'Logout successful' : 'Logout failed'
  };
}

/**
 * MSG_FRIEND_REQUEST_ACK: success|message
 */
function decodeFriendRequestAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_FRIEND_REQUEST_ACK',
    success,
    message: fields[1] || (success ? 'Friend request sent' : 'Friend request failed')
  };
}

/**
 * MSG_FRIEND_ACCEPT_ACK: success|message
 */
function decodeFriendAcceptAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_FRIEND_ACCEPT_ACK',
    success,
    message: fields[1] || (success ? 'Friend request accepted' : 'Accept failed')
  };
}

/**
 * MSG_FRIEND_REJECT_ACK: success|message
 */
function decodeFriendRejectAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_FRIEND_REJECT_ACK',
    success,
    message: fields[1] || (success ? 'Friend request rejected' : 'Reject failed')
  };
}

/**
 * MSG_FRIEND_REMOVE_ACK: success|message
 */
function decodeFriendRemoveAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_FRIEND_REMOVE_ACK',
    success,
    message: fields[1] || (success ? 'Friend removed' : 'Remove failed')
  };
}

/**
 * MSG_FRIEND_LIST_RSP: friend1_id|friend1_name|friend1_status,friend2_id|...
 */
function decodeFriendListResponse(payload: Buffer): WebSocketMessage {
  const text = payload.toString('utf8').replace(/\0/g, '');

  if (!text || text.length === 0) {
    return {
      type: 'MSG_FRIEND_LIST_RSP',
      success: true,
      friends: []
    };
  }

  const friendEntries = text.split(',');
  const friends = friendEntries.map(entry => {
    const [id, username, status] = entry.split('|');
    return {
      userId: parseInt(id),
      username,
      status: status || 'offline'
    };
  });

  return {
    type: 'MSG_FRIEND_LIST_RSP',
    success: true,
    friends
  };
}

/**
 * MSG_FRIEND_NOTIFY: username (new friend request notification)
 */
function decodeFriendNotify(payload: Buffer): WebSocketMessage {
  const username = parseNullTerminatedString(payload);

  return {
    type: 'MSG_FRIEND_NOTIFY',
    username,
    message: `Friend request from ${username}`
  };
}

/**
 * MSG_STATUS_NOTIFY: user_id|username|status
 */
function decodeStatusNotify(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);

  return {
    type: 'MSG_STATUS_NOTIFY',
    userId: parseInt(fields[0]),
    username: fields[1],
    status: fields[2]
  };
}

/**
 * MSG_CHAT_DELIVER: sender_id|sender_name|content|timestamp
 */
function decodeChatDeliver(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);

  return {
    type: 'MSG_CHAT_DELIVER',
    senderId: parseInt(fields[0]),
    senderName: fields[1],
    content: fields[2],
    timestamp: fields[3] || new Date().toISOString()
  };
}

/**
 * MSG_CHAT_ACK: success|message_id
 */
function decodeChatAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_CHAT_ACK',
    success,
    messageId: success ? fields[1] : undefined
  };
}

/**
 * MSG_GROUP_CREATE_ACK: success|group_id|message
 */
function decodeGroupCreateAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_GROUP_CREATE_ACK',
    success,
    groupId: success ? parseInt(fields[1]) : undefined,
    message: fields[2] || (success ? 'Group created' : 'Group creation failed')
  };
}

/**
 * MSG_GROUP_INVITE_ACK: success|message
 */
function decodeGroupInviteAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_GROUP_INVITE_ACK',
    success,
    message: fields[1] || (success ? 'User invited' : 'Invite failed')
  };
}

/**
 * MSG_GROUP_JOIN_ACK: success|message
 */
function decodeGroupJoinAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_GROUP_JOIN_ACK',
    success,
    message: fields[1] || (success ? 'Joined group' : 'Join failed')
  };
}

/**
 * MSG_GROUP_LEAVE_ACK: success|message
 */
function decodeGroupLeaveAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_GROUP_LEAVE_ACK',
    success,
    message: fields[1] || (success ? 'Left group' : 'Leave failed')
  };
}

/**
 * MSG_GROUP_REMOVE_ACK: success|message
 */
function decodeGroupRemoveAck(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);
  const success = fields[0] === '1';

  return {
    type: 'MSG_GROUP_REMOVE_ACK',
    success,
    message: fields[1] || (success ? 'User removed' : 'Remove failed')
  };
}

/**
 * MSG_GROUP_MSG_DELIVER: group_id|sender_id|sender_name|content|timestamp
 */
function decodeGroupMessageDeliver(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);

  return {
    type: 'MSG_GROUP_MSG_DELIVER',
    groupId: parseInt(fields[0]),
    senderId: parseInt(fields[1]),
    senderName: fields[2],
    content: fields[3],
    timestamp: fields[4] || new Date().toISOString()
  };
}

/**
 * MSG_GROUP_LIST_RSP: group1_id|group1_name,group2_id|group2_name,...
 */
function decodeGroupListResponse(payload: Buffer): WebSocketMessage {
  const text = payload.toString('utf8').replace(/\0/g, '');

  if (!text || text.length === 0) {
    return {
      type: 'MSG_GROUP_LIST_RSP',
      success: true,
      groups: []
    };
  }

  const groupEntries = text.split(',');
  const groups = groupEntries.map(entry => {
    const [id, name] = entry.split('|');
    return {
      groupId: parseInt(id),
      groupName: name
    };
  });

  return {
    type: 'MSG_GROUP_LIST_RSP',
    success: true,
    groups
  };
}

/**
 * MSG_ERROR: error_code|error_message
 */
function decodeError(payload: Buffer): WebSocketMessage {
  const fields = parsePipeSeparatedFields(payload);

  return {
    type: 'MSG_ERROR',
    success: false,
    errorCode: fields[0],
    error: fields[1] || 'Unknown error'
  };
}

/**
 * MSG_HEARTBEAT_ACK: No payload
 */
function decodeHeartbeatAck(_payload: Buffer): WebSocketMessage {
  return {
    type: 'MSG_HEARTBEAT_ACK',
    success: true
  };
}
