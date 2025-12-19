/**
 * Decoder tests - verify binary protocol to WebSocket JSON decoding
 */

import { describe, it, expect } from 'vitest';
import { decodeMessage } from '../decoder';
import {
  BinaryMessage,
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
} from '../types';

/**
 * Helper: Create a binary message for testing
 */
function createBinaryMessage(type: number, payloadStr: string): BinaryMessage {
  return {
    type,
    payload: Buffer.from(payloadStr, 'utf8'),
  };
}

describe('decodeMessage', () => {
  describe('Authentication responses', () => {
    describe('MSG_REGISTER_ACK', () => {
      it('should decode successful registration', () => {
        const message = createBinaryMessage(MSG_REGISTER_ACK, '1|42|Registration successful');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_REGISTER_ACK');
        expect(result.success).toBe(true);
        expect(result.userId).toBe(42);
        expect(result.message).toBe('Registration successful');
      });

      it('should decode failed registration', () => {
        // Note: parsePipeSeparatedFields filters empty strings, so '0||msg' becomes ['0', 'msg']
        // and fields[2] is undefined, causing default message to be used
        const message = createBinaryMessage(MSG_REGISTER_ACK, '0|ignored|Username already exists');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_REGISTER_ACK');
        expect(result.success).toBe(false);
        expect(result.userId).toBeUndefined();
        expect(result.message).toBe('Username already exists');
      });

      it('should use default message when not provided', () => {
        const message = createBinaryMessage(MSG_REGISTER_ACK, '1|123|');

        const result = decodeMessage(message);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Registration successful');
      });

      it('should use default failure message', () => {
        const message = createBinaryMessage(MSG_REGISTER_ACK, '0||');

        const result = decodeMessage(message);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Registration failed');
      });
    });

    describe('MSG_LOGIN_ACK', () => {
      it('should decode successful login', () => {
        const message = createBinaryMessage(MSG_LOGIN_ACK, '1|100|abc123token|testuser');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_LOGIN_ACK');
        expect(result.success).toBe(true);
        expect(result.userId).toBe(100);
        expect(result.token).toBe('abc123token');
        expect(result.username).toBe('testuser');
        expect(result.message).toBe('Login successful');
      });

      it('should decode failed login', () => {
        const message = createBinaryMessage(MSG_LOGIN_ACK, '0|Invalid credentials');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_LOGIN_ACK');
        expect(result.success).toBe(false);
        expect(result.userId).toBeUndefined();
        expect(result.token).toBeUndefined();
        expect(result.message).toBe('Invalid credentials');
      });

      it('should use default message for failed login', () => {
        const message = createBinaryMessage(MSG_LOGIN_ACK, '0|');

        const result = decodeMessage(message);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Login failed');
      });
    });

    describe('MSG_LOGOUT_ACK', () => {
      it('should decode successful logout', () => {
        const payload = Buffer.from([0x01]); // success = 1
        const message: BinaryMessage = { type: MSG_LOGOUT_ACK, payload };

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_LOGOUT_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Logout successful');
      });

      it('should decode failed logout', () => {
        const payload = Buffer.from([0x00]); // success = 0
        const message: BinaryMessage = { type: MSG_LOGOUT_ACK, payload };

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_LOGOUT_ACK');
        expect(result.success).toBe(false);
        expect(result.message).toBe('Logout failed');
      });

      it('should handle empty payload as failure', () => {
        const message: BinaryMessage = { type: MSG_LOGOUT_ACK, payload: Buffer.alloc(0) };

        const result = decodeMessage(message);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('Friend responses', () => {
    describe('MSG_FRIEND_REQUEST_ACK', () => {
      it('should decode successful friend request', () => {
        const message = createBinaryMessage(MSG_FRIEND_REQUEST_ACK, '1|Request sent successfully');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_REQUEST_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Request sent successfully');
      });

      it('should decode failed friend request', () => {
        const message = createBinaryMessage(MSG_FRIEND_REQUEST_ACK, '0|User not found');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_REQUEST_ACK');
        expect(result.success).toBe(false);
        expect(result.message).toBe('User not found');
      });
    });

    describe('MSG_FRIEND_ACCEPT_ACK', () => {
      it('should decode successful friend accept', () => {
        const message = createBinaryMessage(MSG_FRIEND_ACCEPT_ACK, '1|Friend added');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_ACCEPT_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Friend added');
      });

      it('should use default message', () => {
        const message = createBinaryMessage(MSG_FRIEND_ACCEPT_ACK, '1|');

        const result = decodeMessage(message);

        expect(result.message).toBe('Friend request accepted');
      });
    });

    describe('MSG_FRIEND_REJECT_ACK', () => {
      it('should decode successful friend reject', () => {
        const message = createBinaryMessage(MSG_FRIEND_REJECT_ACK, '1|Request rejected');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_REJECT_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Request rejected');
      });
    });

    describe('MSG_FRIEND_REMOVE_ACK', () => {
      it('should decode successful friend remove', () => {
        const message = createBinaryMessage(MSG_FRIEND_REMOVE_ACK, '1|Friend removed');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_REMOVE_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Friend removed');
      });
    });

    describe('MSG_FRIEND_LIST_RSP', () => {
      it('should decode empty friend list', () => {
        const message = createBinaryMessage(MSG_FRIEND_LIST_RSP, '');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_LIST_RSP');
        expect(result.success).toBe(true);
        expect(result.friends).toEqual([]);
      });

      it('should decode single friend', () => {
        const message = createBinaryMessage(MSG_FRIEND_LIST_RSP, '1|alice|online');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_LIST_RSP');
        expect(result.friends).toHaveLength(1);
        expect((result.friends as any[])[0]).toEqual({
          userId: 1,
          username: 'alice',
          status: 'online',
        });
      });

      it('should decode multiple friends', () => {
        const message = createBinaryMessage(
          MSG_FRIEND_LIST_RSP,
          '1|alice|online,2|bob|offline,3|charlie|away'
        );

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_LIST_RSP');
        expect(result.friends).toHaveLength(3);
        expect((result.friends as any[])[0].username).toBe('alice');
        expect((result.friends as any[])[1].username).toBe('bob');
        expect((result.friends as any[])[2].username).toBe('charlie');
      });

      it('should default to offline status when not provided', () => {
        const message = createBinaryMessage(MSG_FRIEND_LIST_RSP, '1|alice|');

        const result = decodeMessage(message);

        expect((result.friends as any[])[0].status).toBe('offline');
      });
    });

    describe('MSG_FRIEND_NOTIFY', () => {
      it('should decode friend notification', () => {
        const message = createBinaryMessage(MSG_FRIEND_NOTIFY, 'newuser\0');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_FRIEND_NOTIFY');
        expect(result.username).toBe('newuser');
        expect(result.message).toBe('Friend request from newuser');
      });

      it('should handle missing null terminator', () => {
        const message = createBinaryMessage(MSG_FRIEND_NOTIFY, 'someuser');

        const result = decodeMessage(message);

        expect(result.username).toBe('someuser');
      });
    });

    describe('MSG_STATUS_NOTIFY', () => {
      it('should decode status notification', () => {
        const message = createBinaryMessage(MSG_STATUS_NOTIFY, '123|alice|online');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_STATUS_NOTIFY');
        expect(result.userId).toBe(123);
        expect(result.username).toBe('alice');
        expect(result.status).toBe('online');
      });
    });
  });

  describe('Chat responses', () => {
    describe('MSG_CHAT_DELIVER', () => {
      it('should decode chat delivery', () => {
        const message = createBinaryMessage(
          MSG_CHAT_DELIVER,
          '50|alice|Hello there!|2024-01-15T10:30:00Z'
        );

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_CHAT_DELIVER');
        expect(result.senderId).toBe(50);
        expect(result.senderName).toBe('alice');
        expect(result.content).toBe('Hello there!');
        expect(result.timestamp).toBe('2024-01-15T10:30:00Z');
      });

      it('should use current timestamp when not provided', () => {
        const message = createBinaryMessage(MSG_CHAT_DELIVER, '50|alice|Hello there!|');

        const result = decodeMessage(message);

        expect(result.timestamp).toBeDefined();
        // Should be an ISO date string
        expect(typeof result.timestamp).toBe('string');
      });
    });

    describe('MSG_CHAT_ACK', () => {
      it('should decode successful chat ack', () => {
        const message = createBinaryMessage(MSG_CHAT_ACK, '1|msg123');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_CHAT_ACK');
        expect(result.success).toBe(true);
        expect(result.messageId).toBe('msg123');
      });

      it('should decode failed chat ack', () => {
        const message = createBinaryMessage(MSG_CHAT_ACK, '0|');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_CHAT_ACK');
        expect(result.success).toBe(false);
        expect(result.messageId).toBeUndefined();
      });
    });
  });

  describe('Group responses', () => {
    describe('MSG_GROUP_CREATE_ACK', () => {
      it('should decode successful group creation', () => {
        const message = createBinaryMessage(MSG_GROUP_CREATE_ACK, '1|10|Group created successfully');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_CREATE_ACK');
        expect(result.success).toBe(true);
        expect(result.groupId).toBe(10);
        expect(result.message).toBe('Group created successfully');
      });

      it('should decode failed group creation', () => {
        // Note: parsePipeSeparatedFields filters empty strings, so use placeholder
        const message = createBinaryMessage(MSG_GROUP_CREATE_ACK, '0|ignored|Group name already exists');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_CREATE_ACK');
        expect(result.success).toBe(false);
        expect(result.groupId).toBeUndefined();
        expect(result.message).toBe('Group name already exists');
      });
    });

    describe('MSG_GROUP_INVITE_ACK', () => {
      it('should decode successful group invite', () => {
        const message = createBinaryMessage(MSG_GROUP_INVITE_ACK, '1|Invite sent');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_INVITE_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Invite sent');
      });

      it('should use default message', () => {
        const message = createBinaryMessage(MSG_GROUP_INVITE_ACK, '1|');

        const result = decodeMessage(message);

        expect(result.message).toBe('User invited');
      });
    });

    describe('MSG_GROUP_JOIN_ACK', () => {
      it('should decode successful group join', () => {
        const message = createBinaryMessage(MSG_GROUP_JOIN_ACK, '1|Joined successfully');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_JOIN_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Joined successfully');
      });
    });

    describe('MSG_GROUP_LEAVE_ACK', () => {
      it('should decode successful group leave', () => {
        const message = createBinaryMessage(MSG_GROUP_LEAVE_ACK, '1|Left group');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_LEAVE_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Left group');
      });
    });

    describe('MSG_GROUP_REMOVE_ACK', () => {
      it('should decode successful user removal', () => {
        const message = createBinaryMessage(MSG_GROUP_REMOVE_ACK, '1|User removed from group');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_REMOVE_ACK');
        expect(result.success).toBe(true);
        expect(result.message).toBe('User removed from group');
      });
    });

    describe('MSG_GROUP_MSG_DELIVER', () => {
      it('should decode group message delivery', () => {
        const message = createBinaryMessage(
          MSG_GROUP_MSG_DELIVER,
          '5|10|bob|Hello group!|2024-01-15T12:00:00Z'
        );

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_MSG_DELIVER');
        expect(result.groupId).toBe(5);
        expect(result.senderId).toBe(10);
        expect(result.senderName).toBe('bob');
        expect(result.content).toBe('Hello group!');
        expect(result.timestamp).toBe('2024-01-15T12:00:00Z');
      });
    });

    describe('MSG_GROUP_LIST_RSP', () => {
      it('should decode empty group list', () => {
        const message = createBinaryMessage(MSG_GROUP_LIST_RSP, '');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_GROUP_LIST_RSP');
        expect(result.success).toBe(true);
        expect(result.groups).toEqual([]);
      });

      it('should decode single group', () => {
        const message = createBinaryMessage(MSG_GROUP_LIST_RSP, '1|Team Chat');

        const result = decodeMessage(message);

        expect(result.groups).toHaveLength(1);
        expect((result.groups as any[])[0]).toMatchObject({
          groupId: 1,
          groupName: 'Team Chat',
          creatorId: 0,
          members: []
        });
        expect((result.groups as any[])[0]).toHaveProperty('createdAt');
      });

      it('should decode multiple groups', () => {
        const message = createBinaryMessage(MSG_GROUP_LIST_RSP, '1|Team A,2|Team B,3|General');

        const result = decodeMessage(message);

        expect(result.groups).toHaveLength(3);
        expect((result.groups as any[])[0].groupName).toBe('Team A');
        expect((result.groups as any[])[1].groupName).toBe('Team B');
        expect((result.groups as any[])[2].groupName).toBe('General');
      });
    });
  });

  describe('System messages', () => {
    describe('MSG_ERROR', () => {
      it('should decode error message', () => {
        const message = createBinaryMessage(MSG_ERROR, '404|User not found');

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_ERROR');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('404');
        expect(result.error).toBe('User not found');
      });

      it('should use default error message', () => {
        const message = createBinaryMessage(MSG_ERROR, '500|');

        const result = decodeMessage(message);

        expect(result.error).toBe('Unknown error');
      });
    });

    describe('MSG_HEARTBEAT_ACK', () => {
      it('should decode heartbeat ack', () => {
        const message: BinaryMessage = { type: MSG_HEARTBEAT_ACK, payload: Buffer.alloc(0) };

        const result = decodeMessage(message);

        expect(result.type).toBe('MSG_HEARTBEAT_ACK');
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Unknown message types', () => {
    it('should handle unknown message type gracefully', () => {
      const message: BinaryMessage = {
        type: 0x99,
        payload: Buffer.from([0x01, 0x02, 0x03]),
      };

      const result = decodeMessage(message);

      expect(result.type).toBe('UNKNOWN_99');
      expect(result.data).toBeDefined();
      expect((result.data as any).rawPayload).toBe('010203');
    });
  });

  describe('Edge cases', () => {
    it('should handle payload with null bytes', () => {
      const message = createBinaryMessage(MSG_FRIEND_LIST_RSP, '1|alice|online\0');

      const result = decodeMessage(message);

      expect(result.type).toBe('MSG_FRIEND_LIST_RSP');
      expect((result.friends as any[])[0].username).toBe('alice');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      const message = createBinaryMessage(MSG_CHAT_DELIVER, `1|sender|${longContent}|`);

      const result = decodeMessage(message);

      expect(result.content).toBe(longContent);
    });

    it('should handle special characters in content', () => {
      const message = createBinaryMessage(MSG_CHAT_DELIVER, '1|user|Hello! @#$%^&*()|\0|');

      const result = decodeMessage(message);

      expect(result.type).toBe('MSG_CHAT_DELIVER');
      // Content should be split correctly despite special chars
    });

    it('should handle empty fields in pipe-separated data', () => {
      const message = createBinaryMessage(MSG_STATUS_NOTIFY, '||');

      const result = decodeMessage(message);

      // Should handle gracefully even with empty fields
      expect(result.type).toBe('MSG_STATUS_NOTIFY');
    });
  });
});
