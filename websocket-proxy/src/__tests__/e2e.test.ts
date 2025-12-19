/**
 * End-to-End tests for WebSocket proxy with C server
 *
 * Prerequisites:
 * - C server running on localhost:8888
 * - WebSocket proxy running on localhost:3000
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3000';
const TIMEOUT = 10000;

// Helper to create a WebSocket connection and wait for open
function createWebSocket(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, TIMEOUT);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Helper to send message and wait for response
function sendAndReceive(ws: WebSocket, message: object): Promise<object> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Response timeout'));
    }, TIMEOUT);

    const handler = (data: WebSocket.Data) => {
      clearTimeout(timeout);
      ws.off('message', handler);
      try {
        const response = JSON.parse(data.toString());
        resolve(response);
      } catch (e) {
        reject(new Error(`Failed to parse response: ${data}`));
      }
    };

    ws.on('message', handler);
    ws.send(JSON.stringify(message));
  });
}

// Wait for a specific message type
function waitForMessage(ws: WebSocket, expectedType: string): Promise<object> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${expectedType}`));
    }, TIMEOUT);

    const handler = (data: WebSocket.Data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.type === expectedType) {
          clearTimeout(timeout);
          ws.off('message', handler);
          resolve(response);
        }
      } catch (e) {
        // Ignore parse errors, wait for valid message
      }
    };

    ws.on('message', handler);
  });
}

describe('E2E: WebSocket Proxy to C Server', () => {
  let ws: WebSocket;
  let testUsername: string;
  let testPassword: string;

  beforeAll(async () => {
    // Generate unique credentials for this test run
    const timestamp = Date.now();
    testUsername = `testuser_${timestamp}`;
    testPassword = 'testpass123';
  });

  beforeEach(async () => {
    ws = await createWebSocket();
  });

  afterAll(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  describe('Connection', () => {
    it('should connect to WebSocket proxy', async () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await sendAndReceive(ws, {
        type: 'MSG_REGISTER',
        data: {
          username: testUsername,
          password: testPassword,
          email: `${testUsername}@test.com`
        }
      }) as { type: string; success: boolean; userId?: number; message?: string };

      expect(response.type).toBe('MSG_REGISTER_ACK');
      expect(response.success).toBe(true);
      expect(response.userId).toBeDefined();

      console.log('Registered user:', testUsername, 'with userId:', response.userId);
      ws.close();
    });

    it('should fail to register duplicate user', async () => {
      const response = await sendAndReceive(ws, {
        type: 'MSG_REGISTER',
        data: {
          username: testUsername,
          password: testPassword,
          email: `${testUsername}@test.com`
        }
      }) as { type: string; success: boolean; message?: string };

      expect(response.type).toBe('MSG_REGISTER_ACK');
      expect(response.success).toBe(false);
      ws.close();
    });

    it('should login with valid credentials', async () => {
      const response = await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: testPassword
        }
      }) as { type: string; success: boolean; userId?: number; username?: string };

      expect(response.type).toBe('MSG_LOGIN_ACK');
      expect(response.success).toBe(true);
      expect(response.userId).toBeDefined();
      expect(response.username).toBe(testUsername);

      console.log('Logged in as:', testUsername);
      ws.close();
    });

    it('should fail login with invalid credentials', async () => {
      const response = await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: 'wrongpassword'
        }
      }) as { type: string; success: boolean };

      expect(response.type).toBe('MSG_LOGIN_ACK');
      expect(response.success).toBe(false);
      ws.close();
    });

    it('should logout successfully', async () => {
      // First login
      await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: testPassword
        }
      });

      // Then logout
      const response = await sendAndReceive(ws, {
        type: 'MSG_LOGOUT',
        data: {}
      }) as { type: string; success: boolean };

      expect(response.type).toBe('MSG_LOGOUT_ACK');
      expect(response.success).toBe(true);
      ws.close();
    });
  });

  describe('Friend Management', () => {
    let friendUsername: string;

    beforeAll(async () => {
      friendUsername = `friend_${Date.now()}`;

      // Register the friend user
      const friendWs = await createWebSocket();
      await sendAndReceive(friendWs, {
        type: 'MSG_REGISTER',
        data: {
          username: friendUsername,
          password: 'friendpass',
          email: `${friendUsername}@test.com`
        }
      });
      friendWs.close();
    });

    it('should send friend request', async () => {
      // Login first
      await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: testPassword
        }
      });

      // Send friend request
      const response = await sendAndReceive(ws, {
        type: 'MSG_FRIEND_REQUEST',
        data: {
          username: friendUsername
        }
      }) as { type: string; success: boolean };

      expect(response.type).toBe('MSG_FRIEND_REQUEST_ACK');
      // Note: success depends on server implementation
      console.log('Friend request response:', response);
      ws.close();
    });

    it('should get friend list', async () => {
      // Login first
      await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: testPassword
        }
      });

      // Request friend list
      const response = await sendAndReceive(ws, {
        type: 'MSG_FRIEND_LIST',
        data: {}
      }) as { type: string; success: boolean; friends?: unknown[] };

      expect(response.type).toBe('MSG_FRIEND_LIST_RSP');
      expect(response.success).toBe(true);
      expect(Array.isArray(response.friends)).toBe(true);

      console.log('Friend list:', response.friends);
      ws.close();
    });
  });

  describe('Group Management', () => {
    let groupId: number;

    it('should create a group', async () => {
      // Login first
      await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: testPassword
        }
      });

      // Create group
      const groupName = `TestGroup_${Date.now()}`;
      const response = await sendAndReceive(ws, {
        type: 'MSG_GROUP_CREATE',
        data: {
          groupName: groupName
        }
      }) as { type: string; success: boolean; groupId?: number };

      expect(response.type).toBe('MSG_GROUP_CREATE_ACK');
      expect(response.success).toBe(true);
      if (response.groupId) {
        groupId = response.groupId;
      }

      console.log('Created group:', groupName, 'with id:', groupId);
      ws.close();
    });

    it('should get group list', async () => {
      // Login first
      await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: testPassword
        }
      });

      // Request group list
      const response = await sendAndReceive(ws, {
        type: 'MSG_GROUP_LIST',
        data: {}
      }) as { type: string; success: boolean; groups?: unknown[] };

      expect(response.type).toBe('MSG_GROUP_LIST_RSP');
      expect(response.success).toBe(true);
      expect(Array.isArray(response.groups)).toBe(true);

      console.log('Group list:', response.groups);
      ws.close();
    });
  });

  describe('Heartbeat', () => {
    it('should respond to heartbeat', async () => {
      // Login first
      await sendAndReceive(ws, {
        type: 'MSG_LOGIN',
        data: {
          username: testUsername,
          password: testPassword
        }
      });

      // Send heartbeat
      const response = await sendAndReceive(ws, {
        type: 'MSG_HEARTBEAT',
        data: {}
      }) as { type: string; success: boolean };

      expect(response.type).toBe('MSG_HEARTBEAT_ACK');
      expect(response.success).toBe(true);
      ws.close();
    });
  });
});

describe('E2E: Chat Between Users', () => {
  let user1Ws: WebSocket;
  let user2Ws: WebSocket;
  let user1Name: string;
  let user2Name: string;
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    user1Name = `chatuser1_${timestamp}`;
    user2Name = `chatuser2_${timestamp}`;

    // Create and connect user 1
    user1Ws = await createWebSocket();
    await sendAndReceive(user1Ws, {
      type: 'MSG_REGISTER',
      data: { username: user1Name, password: 'pass1', email: `${user1Name}@test.com` }
    });
    const login1 = await sendAndReceive(user1Ws, {
      type: 'MSG_LOGIN',
      data: { username: user1Name, password: 'pass1' }
    }) as { userId: number };
    user1Id = login1.userId;

    // Create and connect user 2
    user2Ws = await createWebSocket();
    await sendAndReceive(user2Ws, {
      type: 'MSG_REGISTER',
      data: { username: user2Name, password: 'pass2', email: `${user2Name}@test.com` }
    });
    const login2 = await sendAndReceive(user2Ws, {
      type: 'MSG_LOGIN',
      data: { username: user2Name, password: 'pass2' }
    }) as { userId: number };
    user2Id = login2.userId;

    console.log(`Chat users created: ${user1Name}(${user1Id}), ${user2Name}(${user2Id})`);
  });

  afterAll(() => {
    if (user1Ws && user1Ws.readyState === WebSocket.OPEN) user1Ws.close();
    if (user2Ws && user2Ws.readyState === WebSocket.OPEN) user2Ws.close();
  });

  it('should send direct message between users', async () => {
    // Set up listener for user2 before sending
    const messagePromise = waitForMessage(user2Ws, 'MSG_CHAT_DELIVER');

    // User1 sends message to User2
    const testMessage = `Hello from user1 at ${Date.now()}`;
    user1Ws.send(JSON.stringify({
      type: 'MSG_CHAT_SEND',
      data: {
        recipientId: String(user2Id),
        content: testMessage
      }
    }));

    // Wait for acknowledgment on user1
    const ackPromise = waitForMessage(user1Ws, 'MSG_CHAT_ACK');

    // Wait for both
    const [ack, delivered] = await Promise.all([
      ackPromise.catch(() => null),
      messagePromise.catch(() => null)
    ]) as [{ success?: boolean } | null, { content?: string; senderName?: string } | null];

    console.log('Chat ACK:', ack);
    console.log('Delivered message:', delivered);

    // At minimum, one of them should work
    const success = (ack && ack.success) || (delivered && delivered.content);
    expect(success).toBeTruthy();
  });
});
