/**
 * WebSocket server - bridges browser clients to C TCP server
 * Also serves static files for the web client
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { logger } from './utils/logger';
import { config } from './utils/config';
import { TCPClient } from './tcpClient';
import { WebSocketMessage } from './protocol/types';

// MIME types for static files
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

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
  private httpServer: ReturnType<typeof createServer> | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private staticDir: string;

  constructor() {
    // Static files directory (web-client/dist)
    this.staticDir = join(__dirname, '../../web-client/dist');
  }

  /**
   * Serve static files
   */
  private serveStatic(req: IncomingMessage, res: ServerResponse): void {
    let filePath = req.url || '/';

    // Default to index.html for root or SPA routes
    if (filePath === '/' || !filePath.includes('.')) {
      filePath = '/index.html';
    }

    const fullPath = join(this.staticDir, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(this.staticDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // Check if file exists
    if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
      // For SPA, serve index.html for unknown routes
      const indexPath = join(this.staticDir, 'index.html');
      if (existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not Found - Run "npm run build" in web-client first');
      }
      return;
    }

    // Get MIME type
    const ext = extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    createReadStream(fullPath).pipe(res);
  }

  /**
   * Start WebSocket server
   */
  start(): void {
    logger.info('Starting WebSocket proxy server', {
      port: config.wsPort,
      host: config.wsHost
    });

    // Create HTTP server for static files
    this.httpServer = createServer((req, res) => {
      // Add CORS headers for development
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      this.serveStatic(req, res);
    });

    // Attach WebSocket server to HTTP server
    this.wss = new WebSocketServer({
      server: this.httpServer,
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

    // Start HTTP server
    this.httpServer.listen(config.wsPort, config.wsHost, () => {
      logger.info('HTTP + WebSocket server started', {
        port: config.wsPort,
        host: config.wsHost
      });
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

    // Connect to TCP server FIRST, then set up handlers
    try {
      await tcpClient.connect();
      logger.info('TCP connection established for WebSocket client', { clientId });

      // Set up WebSocket event handlers AFTER TCP connection is established
      // This prevents race condition where client sends message before TCP is ready
      this.setupWebSocketHandlers(connection);

      // Set up TCP event handlers (for reconnection and message forwarding)
      this.setupTCPHandlers(connection);
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

    // Handle TCP reconnection events (not initial connect, which already happened)
    let hasDisconnected = false;

    tcp.on('connected', () => {
      // Only notify on REconnection, not initial connection
      if (hasDisconnected) {
        logger.info('TCP reconnected', { clientId });
        this.sendToClient(ws, {
          type: 'MSG_ERROR',
          success: true,
          message: 'Reconnected to server'
        });
      }
    });

    tcp.on('disconnected', () => {
      hasDisconnected = true;
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

    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.close(() => {
        logger.info('HTTP server closed');
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
