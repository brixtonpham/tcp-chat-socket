// Message Types matching C server protocol
export const MessageTypes = {
  // Auth
  MSG_REGISTER: 'MSG_REGISTER',
  MSG_REGISTER_ACK: 'MSG_REGISTER_ACK',
  MSG_LOGIN: 'MSG_LOGIN',
  MSG_LOGIN_ACK: 'MSG_LOGIN_ACK',
  MSG_LOGOUT: 'MSG_LOGOUT',
  MSG_LOGOUT_ACK: 'MSG_LOGOUT_ACK',

  // Friends
  MSG_FRIEND_REQUEST: 'MSG_FRIEND_REQUEST',
  MSG_FRIEND_REQUEST_ACK: 'MSG_FRIEND_REQUEST_ACK',
  MSG_FRIEND_ACCEPT: 'MSG_FRIEND_ACCEPT',
  MSG_FRIEND_ACCEPT_ACK: 'MSG_FRIEND_ACCEPT_ACK',
  MSG_FRIEND_REJECT: 'MSG_FRIEND_REJECT',
  MSG_FRIEND_LIST: 'MSG_FRIEND_LIST',
  MSG_FRIEND_LIST_RSP: 'MSG_FRIEND_LIST_RSP',
  MSG_FRIEND_NOTIFY: 'MSG_FRIEND_NOTIFY',
  MSG_STATUS_NOTIFY: 'MSG_STATUS_NOTIFY',

  // Chat
  MSG_CHAT_SEND: 'MSG_CHAT_SEND',
  MSG_CHAT_DELIVER: 'MSG_CHAT_DELIVER',

  // Groups
  MSG_GROUP_CREATE: 'MSG_GROUP_CREATE',
  MSG_GROUP_CREATE_ACK: 'MSG_GROUP_CREATE_ACK',
  MSG_GROUP_MSG: 'MSG_GROUP_MSG',
  MSG_GROUP_MSG_DELIVER: 'MSG_GROUP_MSG_DELIVER',
  MSG_GROUP_LIST: 'MSG_GROUP_LIST',
  MSG_GROUP_LIST_RSP: 'MSG_GROUP_LIST_RSP',

  // System
  MSG_ERROR: 'MSG_ERROR',
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

// User Types
export interface User {
  userId: number;
  username: string;
  email?: string;
  status: 'online' | 'offline';
}

export interface AuthUser extends User {
  token: string;
}

// Friend Types
export interface Friend extends User {
  lastSeen?: string;
}

export interface FriendRequest {
  requestId: number;
  fromUserId: number;
  fromUsername: string;
  toUserId: number;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Message Types
export interface Message {
  messageId: string;
  senderId: number;
  senderUsername: string;
  recipientId: number;
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface GroupMessage extends Omit<Message, 'recipientId'> {
  groupId: number;
}

// Group Types
export interface Group {
  groupId: number;
  groupName: string;
  creatorId: number;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: number;
  username: string;
  status: 'online' | 'offline';
}

// WebSocket Message Payloads
export interface WSMessage<T = any> {
  type: MessageType;
  data: T;
}

// Auth Payloads
export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
}

export interface RegisterAckPayload {
  success: boolean;
  message: string;
  userId?: number;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginAckPayload {
  success: boolean;
  message: string;
  userId?: number;
  username?: string;
  token?: string;
}

// Friend Payloads
export interface FriendRequestPayload {
  targetUsername: string;
}

export interface FriendRequestAckPayload {
  success: boolean;
  message: string;
}

export interface FriendNotifyPayload {
  fromUserId: number;
  fromUsername: string;
  requestId: number;
}

export interface FriendListRspPayload {
  friends: Friend[];
  pendingRequests: FriendRequest[];
}

export interface StatusNotifyPayload {
  userId: number;
  username: string;
  status: 'online' | 'offline';
}

// Chat Payloads
export interface ChatSendPayload {
  recipientId: number;
  content: string;
}

export interface ChatDeliverPayload {
  messageId: string;
  senderId: number;
  senderUsername: string;
  content: string;
  timestamp: string;
}

// Group Payloads
export interface GroupCreatePayload {
  groupName: string;
  memberIds: number[];
}

export interface GroupCreateAckPayload {
  success: boolean;
  message: string;
  groupId?: number;
}

export interface GroupMsgPayload {
  groupId: number;
  content: string;
}

export interface GroupMsgDeliverPayload {
  groupId: number;
  messageId: string;
  senderId: number;
  senderUsername: string;
  content: string;
  timestamp: string;
}

export interface GroupListRspPayload {
  groups: Group[];
}

// Error Payload
export interface ErrorPayload {
  code: string;
  message: string;
}

// Theme
export type Theme = 'light' | 'dark';
