/**
 * MessageBuffer tests - verify TCP stream fragmentation handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MessageBuffer } from '../decoder';
import {
  MSG_LOGIN,
  MSG_LOGOUT,
  MSG_CHAT_SEND,
  MSG_HEARTBEAT,
  MSG_REGISTER,
} from '../types';

/**
 * Helper: Create a complete binary message buffer
 */
function createCompleteMessage(type: number, payloadStr: string): Buffer {
  const payload = Buffer.from(payloadStr, 'utf8');
  const header = Buffer.alloc(6);
  const totalLength = 6 + payload.length;

  header.writeUInt32BE(totalLength, 0);
  header.writeUInt16BE(type, 4);

  return Buffer.concat([header, payload]);
}

/**
 * Helper: Create a header-only message (no payload)
 */
function createHeaderOnlyMessage(type: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt32BE(6, 0); // Length = 6 (header only)
  header.writeUInt16BE(type, 4);
  return header;
}

describe('MessageBuffer', () => {
  let buffer: MessageBuffer;

  beforeEach(() => {
    buffer = new MessageBuffer();
  });

  describe('Basic operations', () => {
    it('should start with size 0', () => {
      expect(buffer.size()).toBe(0);
    });

    it('should track size after append', () => {
      buffer.append(Buffer.from([0x01, 0x02, 0x03]));
      expect(buffer.size()).toBe(3);
    });

    it('should accumulate size on multiple appends', () => {
      buffer.append(Buffer.from([0x01, 0x02]));
      buffer.append(Buffer.from([0x03, 0x04, 0x05]));
      expect(buffer.size()).toBe(5);
    });

    it('should clear buffer', () => {
      buffer.append(Buffer.from([0x01, 0x02, 0x03]));
      buffer.clear();
      expect(buffer.size()).toBe(0);
    });
  });

  describe('Single complete message', () => {
    it('should extract single complete message', () => {
      const message = createCompleteMessage(MSG_LOGIN, 'user|pass');
      buffer.append(message);

      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(MSG_LOGIN);
      expect(messages[0].payload.toString('utf8')).toBe('user|pass');
      expect(buffer.size()).toBe(0);
    });

    it('should extract header-only message', () => {
      const message = createHeaderOnlyMessage(MSG_HEARTBEAT);
      buffer.append(message);

      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(MSG_HEARTBEAT);
      expect(messages[0].payload.length).toBe(0);
      expect(buffer.size()).toBe(0);
    });
  });

  describe('Multiple complete messages', () => {
    it('should extract multiple messages in single append', () => {
      const msg1 = createCompleteMessage(MSG_LOGIN, 'user|pass');
      const msg2 = createHeaderOnlyMessage(MSG_HEARTBEAT);
      const msg3 = createCompleteMessage(MSG_CHAT_SEND, '123|Hello!');

      buffer.append(Buffer.concat([msg1, msg2, msg3]));

      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(3);
      expect(messages[0].type).toBe(MSG_LOGIN);
      expect(messages[1].type).toBe(MSG_HEARTBEAT);
      expect(messages[2].type).toBe(MSG_CHAT_SEND);
      expect(buffer.size()).toBe(0);
    });

    it('should extract messages across multiple appends', () => {
      const msg1 = createCompleteMessage(MSG_LOGIN, 'user|pass');
      const msg2 = createCompleteMessage(MSG_REGISTER, 'new|pass123');

      buffer.append(msg1);
      const firstBatch = buffer.extractMessages();

      buffer.append(msg2);
      const secondBatch = buffer.extractMessages();

      expect(firstBatch).toHaveLength(1);
      expect(firstBatch[0].type).toBe(MSG_LOGIN);

      expect(secondBatch).toHaveLength(1);
      expect(secondBatch[0].type).toBe(MSG_REGISTER);
    });
  });

  describe('Fragmented messages', () => {
    it('should wait for complete header before extracting', () => {
      // Send only 4 bytes of header (need 6)
      buffer.append(Buffer.from([0x00, 0x00, 0x00, 0x0F]));

      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(0);
      expect(buffer.size()).toBe(4);
    });

    it('should wait for complete payload before extracting', () => {
      const fullMessage = createCompleteMessage(MSG_LOGIN, 'username|password123');
      // Send just the header + partial payload
      buffer.append(fullMessage.subarray(0, 10));

      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(0);
      expect(buffer.size()).toBe(10);
    });

    it('should reassemble fragmented message', () => {
      const fullMessage = createCompleteMessage(MSG_LOGIN, 'testuser|testpass');

      // Fragment into 3 parts
      const part1 = fullMessage.subarray(0, 4); // Part of header
      const part2 = fullMessage.subarray(4, 10); // Rest of header + some payload
      const part3 = fullMessage.subarray(10); // Rest of payload

      buffer.append(part1);
      expect(buffer.extractMessages()).toHaveLength(0);

      buffer.append(part2);
      expect(buffer.extractMessages()).toHaveLength(0);

      buffer.append(part3);
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(MSG_LOGIN);
      expect(messages[0].payload.toString('utf8')).toBe('testuser|testpass');
      expect(buffer.size()).toBe(0);
    });

    it('should handle byte-by-byte append', () => {
      const fullMessage = createCompleteMessage(MSG_LOGOUT, '');

      // Append one byte at a time
      for (let i = 0; i < fullMessage.length; i++) {
        buffer.append(Buffer.from([fullMessage[i]]));
        const messages = buffer.extractMessages();

        if (i < fullMessage.length - 1) {
          expect(messages).toHaveLength(0);
        } else {
          expect(messages).toHaveLength(1);
          expect(messages[0].type).toBe(MSG_LOGOUT);
        }
      }
    });

    it('should handle fragmented followed by complete message', () => {
      const msg1 = createCompleteMessage(MSG_LOGIN, 'user|pass');
      const msg2 = createCompleteMessage(MSG_HEARTBEAT, '');

      // Send first half of msg1
      buffer.append(msg1.subarray(0, 8));
      expect(buffer.extractMessages()).toHaveLength(0);

      // Send rest of msg1 + complete msg2
      buffer.append(Buffer.concat([msg1.subarray(8), msg2]));
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0].type).toBe(MSG_LOGIN);
      expect(messages[1].type).toBe(MSG_HEARTBEAT);
    });

    it('should handle complete followed by fragmented message', () => {
      const msg1 = createCompleteMessage(MSG_LOGIN, 'user|pass');
      const msg2 = createCompleteMessage(MSG_CHAT_SEND, '1|Hello there!');

      // Send complete msg1 + first half of msg2
      buffer.append(Buffer.concat([msg1, msg2.subarray(0, 10)]));
      const firstBatch = buffer.extractMessages();

      expect(firstBatch).toHaveLength(1);
      expect(firstBatch[0].type).toBe(MSG_LOGIN);
      expect(buffer.size()).toBeGreaterThan(0);

      // Send rest of msg2
      buffer.append(msg2.subarray(10));
      const secondBatch = buffer.extractMessages();

      expect(secondBatch).toHaveLength(1);
      expect(secondBatch[0].type).toBe(MSG_CHAT_SEND);
      expect(buffer.size()).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should return empty array when buffer is empty', () => {
      const messages = buffer.extractMessages();
      expect(messages).toEqual([]);
    });

    it('should return empty array when buffer has less than header size', () => {
      buffer.append(Buffer.from([0x00, 0x00, 0x00, 0x10, 0x00])); // 5 bytes, need 6
      const messages = buffer.extractMessages();
      expect(messages).toEqual([]);
    });

    it('should handle large messages', () => {
      const largePayload = 'X'.repeat(100000);
      const message = createCompleteMessage(MSG_CHAT_SEND, `1|${largePayload}`);

      buffer.append(message);
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].payload.length).toBe(largePayload.length + 2); // 1| prefix
    });

    it('should handle many small messages', () => {
      const messageCount = 100;
      const allMessages = Buffer.concat(
        Array.from({ length: messageCount }, () => createHeaderOnlyMessage(MSG_HEARTBEAT))
      );

      buffer.append(allMessages);
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(messageCount);
      expect(buffer.size()).toBe(0);
    });

    it('should correctly read message length in big-endian', () => {
      // Create message with specific length to test endianness
      const payload = 'test';
      const message = createCompleteMessage(MSG_LOGIN, payload);

      // Verify the length bytes are in big-endian order
      // Length = 6 + 4 = 10 = 0x0000000A
      expect(message[0]).toBe(0x00);
      expect(message[1]).toBe(0x00);
      expect(message[2]).toBe(0x00);
      expect(message[3]).toBe(10);

      buffer.append(message);
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].payload.toString('utf8')).toBe('test');
    });

    it('should correctly read message type in big-endian', () => {
      // MSG_LOGIN = 0x03 should be stored as 0x00 0x03
      const message = createCompleteMessage(MSG_LOGIN, 'test');

      expect(message[4]).toBe(0x00);
      expect(message[5]).toBe(MSG_LOGIN);

      buffer.append(message);
      const messages = buffer.extractMessages();

      expect(messages[0].type).toBe(MSG_LOGIN);
    });

    it('should handle messages with high type codes', () => {
      // MSG_HEARTBEAT_ACK = 0xFF
      const header = Buffer.alloc(6);
      header.writeUInt32BE(6, 0);
      header.writeUInt16BE(0xFF, 4);

      buffer.append(header);
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(0xFF);
    });
  });

  describe('Memory safety', () => {
    it('should not retain references to original buffers', () => {
      const original = createCompleteMessage(MSG_LOGIN, 'user|pass');
      buffer.append(original);

      // Modify original buffer
      original[6] = 0xFF;

      const messages = buffer.extractMessages();

      // Extracted message should have original data
      expect(messages[0].payload[0]).not.toBe(0xFF);
    });

    it('should properly clean up after extraction', () => {
      const msg1 = createCompleteMessage(MSG_LOGIN, 'user|pass');
      const msg2 = createCompleteMessage(MSG_REGISTER, 'new|pass');

      buffer.append(msg1);
      buffer.extractMessages();

      // Buffer should be empty, new message should work correctly
      buffer.append(msg2);
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(MSG_REGISTER);
    });

    it('should handle clear during fragmentation', () => {
      const message = createCompleteMessage(MSG_LOGIN, 'user|pass');

      buffer.append(message.subarray(0, 5));
      expect(buffer.size()).toBe(5);

      buffer.clear();
      expect(buffer.size()).toBe(0);

      // Should be able to receive new complete message
      buffer.append(message);
      const messages = buffer.extractMessages();

      expect(messages).toHaveLength(1);
    });
  });

  describe('Concurrent extraction patterns', () => {
    it('should handle alternating append and extract', () => {
      const messages: Buffer[] = [];
      for (let i = 0; i < 10; i++) {
        messages.push(createCompleteMessage(MSG_HEARTBEAT, ''));
      }

      let totalExtracted = 0;
      for (const msg of messages) {
        buffer.append(msg);
        totalExtracted += buffer.extractMessages().length;
      }

      expect(totalExtracted).toBe(10);
      expect(buffer.size()).toBe(0);
    });

    it('should handle batch append then single extract', () => {
      const messages = [
        createCompleteMessage(MSG_LOGIN, 'user|pass'),
        createCompleteMessage(MSG_HEARTBEAT, ''),
        createCompleteMessage(MSG_LOGOUT, ''),
      ];

      for (const msg of messages) {
        buffer.append(msg);
      }

      const extracted = buffer.extractMessages();
      expect(extracted).toHaveLength(3);
    });
  });
});

describe('Round-trip encoding/decoding', () => {
  it('should correctly round-trip LOGIN message through MessageBuffer', async () => {
    const { encodeMessage } = await import('../encoder');
    // decoder import removed - not needed for this test

    const original = {
      type: 'MSG_LOGIN',
      data: { username: 'testuser', password: 'testpass' },
    };

    // Encode
    const encoded = encodeMessage(original);

    // Simulate TCP receive via MessageBuffer
    const msgBuffer = new MessageBuffer();
    msgBuffer.append(encoded);
    const binaryMessages = msgBuffer.extractMessages();

    expect(binaryMessages).toHaveLength(1);

    // This tests that the binary format is consistent
    // Note: decodeMessage handles server responses, not client requests
    // So we just verify the binary structure
    expect(binaryMessages[0].type).toBe(0x03); // MSG_LOGIN
    expect(binaryMessages[0].payload.toString('utf8')).toBe('testuser|testpass');
  });

  it('should correctly round-trip CHAT_SEND message through MessageBuffer', async () => {
    const { encodeMessage } = await import('../encoder');

    const original = {
      type: 'MSG_CHAT_SEND',
      data: { recipientId: '42', content: 'Hello, World!' },
    };

    const encoded = encodeMessage(original);

    const msgBuffer = new MessageBuffer();
    msgBuffer.append(encoded);
    const binaryMessages = msgBuffer.extractMessages();

    expect(binaryMessages).toHaveLength(1);
    expect(binaryMessages[0].type).toBe(0x30); // MSG_CHAT_SEND
    expect(binaryMessages[0].payload.toString('utf8')).toBe('42|Hello, World!');
  });

  it('should handle fragmented round-trip', async () => {
    const { encodeMessage } = await import('../encoder');

    const original = {
      type: 'MSG_REGISTER',
      data: { username: 'newuser', password: 'secretpass123' },
    };

    const encoded = encodeMessage(original);

    const msgBuffer = new MessageBuffer();

    // Simulate fragmentation
    msgBuffer.append(encoded.subarray(0, 4));
    expect(msgBuffer.extractMessages()).toHaveLength(0);

    msgBuffer.append(encoded.subarray(4, 10));
    expect(msgBuffer.extractMessages()).toHaveLength(0);

    msgBuffer.append(encoded.subarray(10));
    const binaryMessages = msgBuffer.extractMessages();

    expect(binaryMessages).toHaveLength(1);
    expect(binaryMessages[0].type).toBe(0x01); // MSG_REGISTER
    expect(binaryMessages[0].payload.toString('utf8')).toBe('newuser|secretpass123');
  });

  it('should handle multiple encoded messages in sequence', async () => {
    const { encodeMessage } = await import('../encoder');

    const messages = [
      { type: 'MSG_LOGIN', data: { username: 'user1', password: 'pass1' } },
      { type: 'MSG_HEARTBEAT', data: {} },
      { type: 'MSG_FRIEND_LIST', data: {} },
      { type: 'MSG_CHAT_SEND', data: { recipientId: '1', content: 'Hi!' } },
    ];

    const encoded = Buffer.concat(messages.map(m => encodeMessage(m)));

    const msgBuffer = new MessageBuffer();
    msgBuffer.append(encoded);
    const binaryMessages = msgBuffer.extractMessages();

    expect(binaryMessages).toHaveLength(4);
    expect(binaryMessages[0].type).toBe(0x03); // MSG_LOGIN
    expect(binaryMessages[1].type).toBe(0xFE); // MSG_HEARTBEAT
    expect(binaryMessages[2].type).toBe(0x28); // MSG_FRIEND_LIST
    expect(binaryMessages[3].type).toBe(0x30); // MSG_CHAT_SEND
  });
});
