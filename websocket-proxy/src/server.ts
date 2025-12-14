/**
 * WebSocket server - bridges browser clients to C TCP server
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from './utils/logger';
import { config } from './utils/config';
import { TCPClient } from './tcpClient';
import { WebSocketMessage } from './protocol/types';

/**
 * Client connection info
 */
interface ClientConnection {
  ws: WebSocket;
  tcp: TCPClient;
  clientId: string;
  isAlive: boolean;
}

/**
 * WebSocket proxy server
 */
export class ProxyServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Start WebSocket server
   */
  start(): void {
    logger.info('Starting WebSocket proxy server', {
      port: config.wsPort,
      host: config.wsHost
    });

    this.wss = new WebSocketServer({
      host: config.wsHost,
      port: config.wsPort,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024
      }
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error', { error: error.message });
    });

    // Start ping interval for connection health check
    this.startPingInterval();

    logger.info('WebSocket proxy server started', {
      port: config.wsPort,
      host: config.wsHost
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    const clientId = this.generateClientId();
    const clientIp = request.socket.remoteAddress || 'unknown';

    logger.info('New WebSocket connection', { clientId, clientIp });

    // Create TCP client
    const tcpClient = new TCPClient(clientId);

    // Store client connection
    const connection: ClientConnection = {
      ws,
      tcp: tcpClient,
      clientId,
      isAlive: true
    };
    this.clients.set(clientId, connection);

    // Set up WebSocket event handlers
    this.setupWebSocketHandlers(connection);

    // Set up TCP event handlers
    this.setupTCPHandlers(connection);

    // Connect to TCP server
    try {
      await tcpClient.connect();
      logger.info('TCP connection established for WebSocket client', { clientId });
    } catch (error) {
      logger.error('Failed to connect to TCP server', {
        clientId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Send error to client
      this.sendToClient(ws, {
        type: 'MSG_ERROR',
        success: false,
        error: 'Failed to connect to chat server'
      });

      // Close WebSocket connection
      ws.close(1011, 'TCP connection failed');
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(connection: ClientConnection): void {
    const { ws, tcp, clientId } = connection;

    // Handle incoming messages from browser
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString('utf8'));

        logger.debug('Received WebSocket message', {
          clientId,
          type: message.type
        });

        // Forward to TCP server
        tcp.sendMessage(message);
      } catch (error) {
        logger.error('Failed to process WebSocket message', {
          clientId,
          error: error instanceof Error ? error.message : String(error)
        });

        this.sendToClient(ws, {
          type: 'MSG_ERROR',
          success: false,
          error: 'Invalid message format'
        });
      }
    });

    // Handle pong responses
    ws.on('pong', () => {
      connection.isAlive = true;
    });

    // Handle WebSocket close
    ws.on('close', (code: number, reason: Buffer) => {
      logger.info('WebSocket connection closed', {
        clientId,
        code,
        reason: reason.toString()
      });
      this.handleClientDisconnect(clientId);
    });

    // Handle WebSocket errors
    ws.on('error', (error: Error) => {
      logger.error('WebSocket error', {
        clientId,
        error: error.message
      });
    });
  }

  /**
   * Set up TCP event handlers
   */
  private setupTCPHandlers(connection: ClientConnection): void {
    const { ws, tcp, clientId } = connection;

    // Handle messages from TCP server
    tcp.on('message', (message: WebSocketMessage) => {
      logger.debug('Received TCP message', {
        clientId,
        type: message.type
      });

      // Forward to WebSocket client
      this.sendToClient(ws, message);
    });

    // Handle TCP connection events
    tcp.on('connected', () => {
      logger.info('TCP reconnected', { clientId });
      this.sendToClient(ws, {
        type: 'MSG_ERROR',
        success: true,
        message: 'Reconnected to server'
      });
    });

    tcp.on('disconnected', () => {
      logger.warn('TCP disconnected', { clientId });
      this.sendToClient(ws, {
        type: 'MSG_ERROR',
        success: false,
        error: 'Disconnected from server, attempting to reconnect...'
      });
    });

    tcp.on('error', (error: Error) => {
      logger.error('TCP client error', {
        clientId,
        error: error.message
      });
      this.sendToClient(ws, {
        type: 'MSG_ERROR',
        success: false,
        error: error.message
      });
    });
  }

  /**
   * Send message to WebSocket client
   */
  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send message to WebSocket client', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(clientId: string): void {
    const connection = this.clients.get(clientId);

    if (connection) {
      // Disconnect TCP client
      connection.tcp.disconnect();

      // Remove from clients map
      this.clients.delete(clientId);

      logger.info('Client disconnected and cleaned up', {
        clientId,
        remainingClients: this.clients.size
      });
    }
  }

  /**
   * Start ping interval for connection health checks
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.clients.forEach((connection, clientId) => {
        if (!connection.isAlive) {
          logger.warn('Client failed ping check, terminating', { clientId });
          connection.ws.terminate();
          return;
        }

        connection.isAlive = false;
        connection.ws.ping();
      });
    }, 30000); // 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Stop server and cleanup
   */
  stop(): void {
    logger.info('Stopping WebSocket proxy server');

    this.stopPingInterval();

    // Disconnect all clients
    this.clients.forEach((connection, clientId) => {
      logger.info('Disconnecting client', { clientId });
      connection.tcp.disconnect();
      connection.ws.close(1001, 'Server shutting down');
    });

    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
      });
    }
  }

  /**
   * Get server stats
   */
  getStats(): { connectedClients: number } {
    return {
      connectedClients: this.clients.size
    };
  }
}
