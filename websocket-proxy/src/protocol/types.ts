/**
 * Protocol message type constants
 * These hex values match the C server's binary protocol
 */

// Authentication messages
export const MSG_REGISTER = 0x01;
export const MSG_REGISTER_ACK = 0x02;
export const MSG_LOGIN = 0x03;
export const MSG_LOGIN_ACK = 0x04;
export const MSG_LOGOUT = 0x05;
export const MSG_LOGOUT_ACK = 0x06;

// Friend management messages
export const MSG_FRIEND_REQUEST = 0x20;
export const MSG_FRIEND_REQUEST_ACK = 0x21;
export const MSG_FRIEND_ACCEPT = 0x22;
export const MSG_FRIEND_ACCEPT_ACK = 0x23;
export const MSG_FRIEND_REJECT = 0x24;
export const MSG_FRIEND_REJECT_ACK = 0x25;
export const MSG_FRIEND_REMOVE = 0x26;
export const MSG_FRIEND_REMOVE_ACK = 0x27;
export const MSG_FRIEND_LIST = 0x28;
export const MSG_FRIEND_LIST_RSP = 0x29;
export const MSG_FRIEND_NOTIFY = 0x2A;
export const MSG_STATUS_NOTIFY = 0x2B;

// Chat messages
export const MSG_CHAT_SEND = 0x30;
export const MSG_CHAT_DELIVER = 0x31;
export const MSG_CHAT_ACK = 0x32;

// Group messages
export const MSG_GROUP_CREATE = 0x40;
export const MSG_GROUP_CREATE_ACK = 0x41;
export const MSG_GROUP_INVITE = 0x42;
export const MSG_GROUP_INVITE_ACK = 0x43;
export const MSG_GROUP_JOIN = 0x44;
export const MSG_GROUP_JOIN_ACK = 0x45;
export const MSG_GROUP_LEAVE = 0x46;
export const MSG_GROUP_LEAVE_ACK = 0x47;
export const MSG_GROUP_REMOVE_USER = 0x48;
export const MSG_GROUP_REMOVE_ACK = 0x49;
export const MSG_GROUP_MSG = 0x4A;
export const MSG_GROUP_MSG_DELIVER = 0x4B;
export const MSG_GROUP_LIST = 0x4C;
export const MSG_GROUP_LIST_RSP = 0x4D;

// System messages
export const MSG_ERROR = 0xF0;
export const MSG_HEARTBEAT = 0xFE;
export const MSG_HEARTBEAT_ACK = 0xFF;

/**
 * Map of message type codes to names for logging
 */
export const MESSAGE_TYPE_NAMES: Record<number, string> = {
  [MSG_REGISTER]: 'MSG_REGISTER',
  [MSG_REGISTER_ACK]: 'MSG_REGISTER_ACK',
  [MSG_LOGIN]: 'MSG_LOGIN',
  [MSG_LOGIN_ACK]: 'MSG_LOGIN_ACK',
  [MSG_LOGOUT]: 'MSG_LOGOUT',
  [MSG_LOGOUT_ACK]: 'MSG_LOGOUT_ACK',
  [MSG_FRIEND_REQUEST]: 'MSG_FRIEND_REQUEST',
  [MSG_FRIEND_REQUEST_ACK]: 'MSG_FRIEND_REQUEST_ACK',
  [MSG_FRIEND_ACCEPT]: 'MSG_FRIEND_ACCEPT',
  [MSG_FRIEND_ACCEPT_ACK]: 'MSG_FRIEND_ACCEPT_ACK',
  [MSG_FRIEND_REJECT]: 'MSG_FRIEND_REJECT',
  [MSG_FRIEND_REJECT_ACK]: 'MSG_FRIEND_REJECT_ACK',
  [MSG_FRIEND_REMOVE]: 'MSG_FRIEND_REMOVE',
  [MSG_FRIEND_REMOVE_ACK]: 'MSG_FRIEND_REMOVE_ACK',
  [MSG_FRIEND_LIST]: 'MSG_FRIEND_LIST',
  [MSG_FRIEND_LIST_RSP]: 'MSG_FRIEND_LIST_RSP',
  [MSG_FRIEND_NOTIFY]: 'MSG_FRIEND_NOTIFY',
  [MSG_STATUS_NOTIFY]: 'MSG_STATUS_NOTIFY',
  [MSG_CHAT_SEND]: 'MSG_CHAT_SEND',
  [MSG_CHAT_DELIVER]: 'MSG_CHAT_DELIVER',
  [MSG_CHAT_ACK]: 'MSG_CHAT_ACK',
  [MSG_GROUP_CREATE]: 'MSG_GROUP_CREATE',
  [MSG_GROUP_CREATE_ACK]: 'MSG_GROUP_CREATE_ACK',
  [MSG_GROUP_INVITE]: 'MSG_GROUP_INVITE',
  [MSG_GROUP_INVITE_ACK]: 'MSG_GROUP_INVITE_ACK',
  [MSG_GROUP_JOIN]: 'MSG_GROUP_JOIN',
  [MSG_GROUP_JOIN_ACK]: 'MSG_GROUP_JOIN_ACK',
  [MSG_GROUP_LEAVE]: 'MSG_GROUP_LEAVE',
  [MSG_GROUP_LEAVE_ACK]: 'MSG_GROUP_LEAVE_ACK',
  [MSG_GROUP_REMOVE_USER]: 'MSG_GROUP_REMOVE_USER',
  [MSG_GROUP_REMOVE_ACK]: 'MSG_GROUP_REMOVE_ACK',
  [MSG_GROUP_MSG]: 'MSG_GROUP_MSG',
  [MSG_GROUP_MSG_DELIVER]: 'MSG_GROUP_MSG_DELIVER',
  [MSG_GROUP_LIST]: 'MSG_GROUP_LIST',
  [MSG_GROUP_LIST_RSP]: 'MSG_GROUP_LIST_RSP',
  [MSG_ERROR]: 'MSG_ERROR',
  [MSG_HEARTBEAT]: 'MSG_HEARTBEAT',
  [MSG_HEARTBEAT_ACK]: 'MSG_HEARTBEAT_ACK',
};

/**
 * Reverse map for name to type code lookup
 */
export const MESSAGE_NAME_TO_TYPE: Record<string, number> = Object.fromEntries(
  Object.entries(MESSAGE_TYPE_NAMES).map(([code, name]) => [name, parseInt(code)])
);

/**
 * WebSocket message interface (JSON format from browser)
 */
export interface WebSocketMessage {
  type: string; // Message type name (e.g., "MSG_LOGIN")
  data?: Record<string, unknown>; // Message payload
  success?: boolean; // For acknowledgment messages
  error?: string; // For error responses
  [key: string]: unknown; // Allow additional fields
}

/**
 * Binary message structure (C server format)
 * Header: 4-byte length (network byte order) + 2-byte type
 * Payload: Variable length, null-terminated strings
 */
export interface BinaryMessage {
  type: number; // 2-byte message type code
  payload: Buffer; // Raw payload data
}

/**
 * Get message type name from code
 */
export function getMessageTypeName(type: number): string {
  return MESSAGE_TYPE_NAMES[type] || `UNKNOWN_${type.toString(16).toUpperCase()}`;
}

/**
 * Get message type code from name
 */
export function getMessageTypeCode(name: string): number | null {
  const code = MESSAGE_NAME_TO_TYPE[name];
  return code !== undefined ? code : null;
}
