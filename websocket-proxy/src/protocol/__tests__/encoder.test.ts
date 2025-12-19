/**
 * Encoder tests - verify WebSocket JSON to binary protocol encoding
 */

import { describe, it, expect } from 'vitest';
import { encodeMessage } from '../encoder';
import {
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
} from '../types';

/**
 * Helper: Extract header information from encoded buffer
 */
function parseHeader(buffer: Buffer): { length: number; type: number } {
  return {
    length: buffer.readUInt32BE(0),
    type: buffer.readUInt16BE(4),
  };
}

/**
 * Helper: Extract payload from encoded buffer
 */
function getPayload(buffer: Buffer): Buffer {
  return buffer.subarray(6);
}

describe('encodeMessage', () => {
  describe('Authentication messages', () => {
    describe('MSG_REGISTER', () => {
      it('should encode register message with username, password, and email', () => {
        const message = {
          type: 'MSG_REGISTER',
          data: { username: 'testuser', password: 'testpass', email: 'test@test.com' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_REGISTER);
        expect(header.length).toBe(result.length);
        expect(payload.toString('utf8')).toBe('testuser|testpass|test@test.com');
      });

      it('should auto-generate email when not provided', () => {
        const message = {
          type: 'MSG_REGISTER',
          data: { username: 'testuser', password: 'testpass' },
        };

        const result = encodeMessage(message);
        const payload = getPayload(result);

        expect(payload.toString('utf8')).toBe('testuser|testpass|testuser@example.com');
      });

      it('should throw error when username is missing', () => {
        const message = {
          type: 'MSG_REGISTER',
          data: { password: 'testpass' },
        };

        expect(() => encodeMessage(message)).toThrow('Register requires username and password');
      });

      it('should throw error when password is missing', () => {
        const message = {
          type: 'MSG_REGISTER',
          data: { username: 'testuser' },
        };

        expect(() => encodeMessage(message)).toThrow('Register requires username and password');
      });

      it('should throw error when both fields are missing', () => {
        const message = {
          type: 'MSG_REGISTER',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Register requires username and password');
      });

      it('should handle special characters in username and password', () => {
        const message = {
          type: 'MSG_REGISTER',
          data: { username: 'user@test.com', password: 'p@ss!word#123', email: 'user@email.com' },
        };

        const result = encodeMessage(message);
        const payload = getPayload(result);

        expect(payload.toString('utf8')).toBe('user@test.com|p@ss!word#123|user@email.com');
      });

      it('should handle unicode characters', () => {
        const message = {
          type: 'MSG_REGISTER',
          data: { username: 'testuser', password: 'password123' },
        };

        const result = encodeMessage(message);
        const payload = getPayload(result);

        expect(payload.toString('utf8')).toBe('testuser|password123|testuser@example.com');
      });
    });

    describe('MSG_LOGIN', () => {
      it('should encode login message with username and password', () => {
        const message = {
          type: 'MSG_LOGIN',
          data: { username: 'testuser', password: 'testpass' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_LOGIN);
        expect(header.length).toBe(result.length);
        expect(payload.toString('utf8')).toBe('testuser|testpass');
      });

      it('should throw error when credentials are missing', () => {
        const message = {
          type: 'MSG_LOGIN',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Login requires username and password');
      });
    });

    describe('MSG_LOGOUT', () => {
      it('should encode logout message with empty payload', () => {
        const message = {
          type: 'MSG_LOGOUT',
          data: {},
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_LOGOUT);
        expect(header.length).toBe(6); // Header only
        expect(payload.length).toBe(0);
      });
    });
  });

  describe('Friend management messages', () => {
    describe('MSG_FRIEND_REQUEST', () => {
      it('should encode friend request with null-terminated username', () => {
        const message = {
          type: 'MSG_FRIEND_REQUEST',
          data: { username: 'frienduser' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_FRIEND_REQUEST);
        expect(payload.toString('utf8')).toBe('frienduser\0');
      });

      it('should throw error when username is missing', () => {
        const message = {
          type: 'MSG_FRIEND_REQUEST',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Friend request requires target username');
      });
    });

    describe('MSG_FRIEND_ACCEPT', () => {
      it('should encode friend accept with null-terminated username', () => {
        const message = {
          type: 'MSG_FRIEND_ACCEPT',
          data: { username: 'requester' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_FRIEND_ACCEPT);
        expect(payload.toString('utf8')).toBe('requester\0');
      });

      it('should throw error when username is missing', () => {
        const message = {
          type: 'MSG_FRIEND_ACCEPT',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Friend accept requires requester username');
      });
    });

    describe('MSG_FRIEND_REJECT', () => {
      it('should encode friend reject with null-terminated username', () => {
        const message = {
          type: 'MSG_FRIEND_REJECT',
          data: { username: 'requester' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_FRIEND_REJECT);
        expect(payload.toString('utf8')).toBe('requester\0');
      });

      it('should throw error when username is missing', () => {
        const message = {
          type: 'MSG_FRIEND_REJECT',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Friend reject requires requester username');
      });
    });

    describe('MSG_FRIEND_REMOVE', () => {
      it('should encode friend remove with null-terminated username', () => {
        const message = {
          type: 'MSG_FRIEND_REMOVE',
          data: { username: 'exfriend' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_FRIEND_REMOVE);
        expect(payload.toString('utf8')).toBe('exfriend\0');
      });

      it('should throw error when username is missing', () => {
        const message = {
          type: 'MSG_FRIEND_REMOVE',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Friend remove requires friend username');
      });
    });

    describe('MSG_FRIEND_LIST', () => {
      it('should encode friend list request with empty payload', () => {
        const message = {
          type: 'MSG_FRIEND_LIST',
          data: {},
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_FRIEND_LIST);
        expect(header.length).toBe(6);
        expect(payload.length).toBe(0);
      });
    });
  });

  describe('Chat messages', () => {
    describe('MSG_CHAT_SEND', () => {
      it('should encode chat message with recipientId and content', () => {
        const message = {
          type: 'MSG_CHAT_SEND',
          data: { recipientId: '123', content: 'Hello, world!' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_CHAT_SEND);
        expect(payload.toString('utf8')).toBe('123|Hello, world!');
      });

      it('should support recipient_id as an alternative field name', () => {
        const message = {
          type: 'MSG_CHAT_SEND',
          data: { recipient_id: '456', content: 'Alternative field' },
        };

        const result = encodeMessage(message);
        const payload = getPayload(result);

        expect(payload.toString('utf8')).toBe('456|Alternative field');
      });

      it('should throw error when recipientId is missing', () => {
        const message = {
          type: 'MSG_CHAT_SEND',
          data: { content: 'Hello!' },
        };

        expect(() => encodeMessage(message)).toThrow('Chat send requires recipientId and content');
      });

      it('should throw error when content is missing', () => {
        const message = {
          type: 'MSG_CHAT_SEND',
          data: { recipientId: '123' },
        };

        expect(() => encodeMessage(message)).toThrow('Chat send requires recipientId and content');
      });

      it('should handle multi-line content', () => {
        const message = {
          type: 'MSG_CHAT_SEND',
          data: { recipientId: '123', content: 'Line 1\nLine 2\nLine 3' },
        };

        const result = encodeMessage(message);
        const payload = getPayload(result);

        expect(payload.toString('utf8')).toBe('123|Line 1\nLine 2\nLine 3');
      });

      it('should handle empty string content correctly by throwing', () => {
        const message = {
          type: 'MSG_CHAT_SEND',
          data: { recipientId: '123', content: '' },
        };

        expect(() => encodeMessage(message)).toThrow('Chat send requires recipientId and content');
      });
    });
  });

  describe('Group messages', () => {
    describe('MSG_GROUP_CREATE', () => {
      it('should encode group create with null-terminated name', () => {
        const message = {
          type: 'MSG_GROUP_CREATE',
          data: { groupName: 'My Group' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_GROUP_CREATE);
        expect(payload.toString('utf8')).toBe('My Group\0');
      });

      it('should support group_name as an alternative field name', () => {
        const message = {
          type: 'MSG_GROUP_CREATE',
          data: { group_name: 'Alt Group' },
        };

        const result = encodeMessage(message);
        const payload = getPayload(result);

        expect(payload.toString('utf8')).toBe('Alt Group\0');
      });

      it('should throw error when group name is missing', () => {
        const message = {
          type: 'MSG_GROUP_CREATE',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Group create requires group name');
      });
    });

    describe('MSG_GROUP_INVITE', () => {
      it('should encode group invite with groupId and username', () => {
        const message = {
          type: 'MSG_GROUP_INVITE',
          data: { groupId: '1', username: 'invitee' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_GROUP_INVITE);
        expect(payload.toString('utf8')).toBe('1|invitee');
      });

      it('should throw error when groupId is missing', () => {
        const message = {
          type: 'MSG_GROUP_INVITE',
          data: { username: 'invitee' },
        };

        expect(() => encodeMessage(message)).toThrow('Group invite requires groupId and username');
      });

      it('should throw error when username is missing', () => {
        const message = {
          type: 'MSG_GROUP_INVITE',
          data: { groupId: '1' },
        };

        expect(() => encodeMessage(message)).toThrow('Group invite requires groupId and username');
      });
    });

    describe('MSG_GROUP_JOIN', () => {
      it('should encode group join with null-terminated groupId', () => {
        const message = {
          type: 'MSG_GROUP_JOIN',
          data: { groupId: '42' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_GROUP_JOIN);
        expect(payload.toString('utf8')).toBe('42\0');
      });

      it('should throw error when groupId is missing', () => {
        const message = {
          type: 'MSG_GROUP_JOIN',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Group join requires group ID');
      });
    });

    describe('MSG_GROUP_LEAVE', () => {
      it('should encode group leave with null-terminated groupId', () => {
        const message = {
          type: 'MSG_GROUP_LEAVE',
          data: { groupId: '42' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_GROUP_LEAVE);
        expect(payload.toString('utf8')).toBe('42\0');
      });

      it('should throw error when groupId is missing', () => {
        const message = {
          type: 'MSG_GROUP_LEAVE',
          data: {},
        };

        expect(() => encodeMessage(message)).toThrow('Group leave requires group ID');
      });
    });

    describe('MSG_GROUP_REMOVE_USER', () => {
      it('should encode group remove user with groupId and username', () => {
        const message = {
          type: 'MSG_GROUP_REMOVE_USER',
          data: { groupId: '1', username: 'targetuser' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_GROUP_REMOVE_USER);
        expect(payload.toString('utf8')).toBe('1|targetuser');
      });

      it('should throw error when groupId is missing', () => {
        const message = {
          type: 'MSG_GROUP_REMOVE_USER',
          data: { username: 'targetuser' },
        };

        expect(() => encodeMessage(message)).toThrow('Group remove user requires groupId and username');
      });
    });

    describe('MSG_GROUP_MSG', () => {
      it('should encode group message with groupId and content', () => {
        const message = {
          type: 'MSG_GROUP_MSG',
          data: { groupId: '5', content: 'Group message!' },
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_GROUP_MSG);
        expect(payload.toString('utf8')).toBe('5|Group message!');
      });

      it('should throw error when groupId is missing', () => {
        const message = {
          type: 'MSG_GROUP_MSG',
          data: { content: 'Hello!' },
        };

        expect(() => encodeMessage(message)).toThrow('Group message requires groupId and content');
      });

      it('should throw error when content is missing', () => {
        const message = {
          type: 'MSG_GROUP_MSG',
          data: { groupId: '5' },
        };

        expect(() => encodeMessage(message)).toThrow('Group message requires groupId and content');
      });
    });

    describe('MSG_GROUP_LIST', () => {
      it('should encode group list request with empty payload', () => {
        const message = {
          type: 'MSG_GROUP_LIST',
          data: {},
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_GROUP_LIST);
        expect(header.length).toBe(6);
        expect(payload.length).toBe(0);
      });
    });
  });

  describe('System messages', () => {
    describe('MSG_HEARTBEAT', () => {
      it('should encode heartbeat with empty payload', () => {
        const message = {
          type: 'MSG_HEARTBEAT',
          data: {},
        };

        const result = encodeMessage(message);
        const header = parseHeader(result);
        const payload = getPayload(result);

        expect(header.type).toBe(MSG_HEARTBEAT);
        expect(header.length).toBe(6);
        expect(payload.length).toBe(0);
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown message type', () => {
      const message = {
        type: 'MSG_UNKNOWN',
        data: {},
      };

      expect(() => encodeMessage(message)).toThrow('Unknown message type: MSG_UNKNOWN');
    });

    it('should throw error for empty message type', () => {
      const message = {
        type: '',
        data: {},
      };

      expect(() => encodeMessage(message)).toThrow('Unknown message type: ');
    });

    it('should handle message without data field', () => {
      const message = {
        type: 'MSG_LOGOUT',
      };

      const result = encodeMessage(message);
      const header = parseHeader(result);

      expect(header.type).toBe(MSG_LOGOUT);
      expect(header.length).toBe(6);
    });
  });

  describe('Binary format correctness', () => {
    it('should use network byte order (big-endian) for length', () => {
      const message = {
        type: 'MSG_LOGIN',
        data: { username: 'test', password: 'pass' },
      };

      const result = encodeMessage(message);

      // Total length = 6 (header) + 9 (test|pass) = 15
      // In big-endian: 0x00 0x00 0x00 0x0F
      expect(result[0]).toBe(0x00);
      expect(result[1]).toBe(0x00);
      expect(result[2]).toBe(0x00);
      expect(result[3]).toBe(15);
    });

    it('should use network byte order (big-endian) for message type', () => {
      const message = {
        type: 'MSG_LOGIN',
        data: { username: 'test', password: 'pass' },
      };

      const result = encodeMessage(message);

      // MSG_LOGIN = 0x03, in big-endian 2 bytes: 0x00 0x03
      expect(result[4]).toBe(0x00);
      expect(result[5]).toBe(0x03);
    });

    it('should correctly calculate total length including header', () => {
      const message = {
        type: 'MSG_REGISTER',
        data: { username: 'abcdefgh', password: '12345678', email: 'test@example.com' },
      };

      const result = encodeMessage(message);
      const header = parseHeader(result);

      // Expected: 6 (header) + 34 (abcdefgh|12345678|test@example.com) = 40
      expect(header.length).toBe(40);
      expect(result.length).toBe(40);
    });
  });
});
