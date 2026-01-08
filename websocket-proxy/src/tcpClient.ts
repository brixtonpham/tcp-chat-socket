/**
 * TCP client - manages connection to C chat server
 */

import { Socket } from 'net';
import { EventEmitter } from 'events';
import { logger } from './utils/logger';
import { config } from './utils/config';
import { MessageBuffer, decodeMessage } from './protocol/decoder';
import { encodeMessage } from './protocol/encoder';
import { WebSocketMessage } from './protocol/types';

export interface TCPClientEvents {
  message: (message: WebSocketMessage) => void;
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
}

export declare interface TCPClient {
  on<U extends keyof TCPClientEvents>(event: U, listener: TCPClientEvents[U]): this;
  emit<U extends keyof TCPClientEvents>(event: U, ...args: Parameters<TCPClientEvents[U]>): boolean;
}

/**
 * TCP client for connecting to C chat server
 */
export class TCPClient extends EventEmitter {
  private socket: Socket | null = null;
  private messageBuffer: MessageBuffer;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isReconnecting = false;
  private clientId: string;
  private loginUsername: string | null = null;

  constructor(clientId: string) {
    super();
    this.clientId = clientId;
    this.messageBuffer = new MessageBuffer();
  }

  /**
   * Connect to TCP server
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.socket) {
      logger.warn('TCP client already connected', { clientId: this.clientId });
      return;
    }

    return new Promise((resolve, reject) => {
      logger.info('Connecting to TCP server', {
        clientId: this.clientId,
        host: config.tcpHost,
        port: config.tcpPort
      });

      this.socket = new Socket();

      // Set socket timeout
      this.socket.setTimeout(config.tcpTimeout);

      // Connection established
      this.socket.on('connect', () => {
        logger.info('TCP connection established', { clientId: this.clientId });
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;

        // Start heartbeat
        this.startHeartbeat();

        this.emit('connected');
        resolve();
      });

      // Data received
      this.socket.on('data', (data: Buffer) => {
        this.handleData(data);
      });

      // Connection closed
      this.socket.on('close', (hadError: boolean) => {
        logger.info('TCP connection closed', {
          clientId: this.clientId,
          hadError
        });
        this.handleDisconnect();
      });

      // Error handling
      this.socket.on('error', (error: Error) => {
        logger.error('TCP socket error', {
          clientId: this.clientId,
          error: error.message
        });
        this.emit('error', error);

        // If connection hasn't been established yet, reject the promise
        if (!this.isConnected) {
          reject(error);
        }
      });

      // Timeout handling
      this.socket.on('timeout', () => {
        logger.warn('TCP socket timeout', { clientId: this.clientId });
        this.socket?.destroy();
      });

      // Initiate connection
      this.socket.connect(config.tcpPort, config.tcpHost);
    });
  }

  /**
   * Handle incoming data
   */
  private handleData(data: Buffer): void {
    logger.debug('Received TCP data', {
      clientId: this.clientId,
      bytes: data.length
    });

    // Append to buffer
    this.messageBuffer.append(data);

    // Extract complete messages
    const messages = this.messageBuffer.extractMessages();

    // Decode and emit each message
    for (const binaryMessage of messages) {
      try {
        const jsonMessage = decodeMessage(binaryMessage);

        // Add username to LOGIN_ACK if we have it stored
        if (jsonMessage.type === 'MSG_LOGIN_ACK' && this.loginUsername && jsonMessage.data) {
          (jsonMessage.data as any).username = this.loginUsername;
        }

        logger.debug('Emitting decoded message', {
          clientId: this.clientId,
          type: jsonMessage.type
        });
        this.emit('message', jsonMessage);
      } catch (error) {
        logger.error('Failed to decode message', {
          clientId: this.clientId,
          error: error instanceof Error ? error.message : String(error),
          messageType: binaryMessage.type
        });
      }
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();
    this.messageBuffer.clear();

    this.emit('disconnected');

    // Attempt reconnection if not already reconnecting
    if (!this.isReconnecting) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= config.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', {
        clientId: this.clientId,
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = config.reconnectDelay * this.reconnectAttempts;

    logger.info('Scheduling reconnection', {
      clientId: this.clientId,
      attempt: this.reconnectAttempts,
      delay
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  /**
   * Attempt to reconnect
   */
  private async reconnect(): Promise<void> {
    logger.info('Attempting to reconnect', {
      clientId: this.clientId,
      attempt: this.reconnectAttempts
    });

    try {
      // Clean up old socket
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.destroy();
        this.socket = null;
      }

      await this.connect();
    } catch (error) {
      logger.error('Reconnection failed', {
        clientId: this.clientId,
        error: error instanceof Error ? error.message : String(error)
      });
      this.scheduleReconnect();
    }
  }

  /**
   * Send message to TCP server
   */
  sendMessage(message: WebSocketMessage): void {
    if (!this.isConnected || !this.socket) {
      logger.warn('Cannot send message: not connected', {
        clientId: this.clientId,
        messageType: message.type
      });
      throw new Error('Not connected to TCP server');
    }

    try {
      // Store username from login request for later use
      if (message.type === 'MSG_LOGIN' && message.data) {
        this.loginUsername = (message.data as any).username || null;
      }

      const binaryData = encodeMessage(message);

      logger.debug('Sending TCP message', {
        clientId: this.clientId,
        type: message.type,
        bytes: binaryData.length
      });

      this.socket.write(binaryData);
    } catch (error) {
      logger.error('Failed to send message', {
        clientId: this.clientId,
        error: error instanceof Error ? error.message : String(error),
        messageType: message.type
      });
      throw error;
    }
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        logger.debug('Sending heartbeat', { clientId: this.clientId });
        try {
          this.sendMessage({ type: 'MSG_HEARTBEAT' });
        } catch (error) {
          logger.error('Heartbeat failed', {
            clientId: this.clientId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }, config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Disconnect from TCP server
   */
  disconnect(): void {
    logger.info('Disconnecting TCP client', { clientId: this.clientId });

    this.isReconnecting = false;

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();

    // Close socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = null;
    }

    this.isConnected = false;
    this.messageBuffer.clear();
  }

  /**
   * Check if connected
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.clientId;
  }
}
