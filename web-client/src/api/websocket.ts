import type { WSMessage, MessageType } from '../types';

export type MessageHandler = (message: WSMessage) => void;

// Store reference to logs store (will be set during initialization)
let logsStoreRef: any = null;

export function setLogsStore(store: any) {
  logsStoreRef = store;
}

// Get WebSocket URL from environment or derive from current origin
const getWebSocketUrl = (): string => {
  // If VITE_WS_URL is set, use it
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // For production: derive WebSocket URL from current origin
  // This allows the same build to work on any domain (ngrok, etc.)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  // Default for local development
  return 'ws://localhost:3000';
};

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private isIntentionallyClosed: boolean = false;
  private pendingRequests: Map<string, number> = new Map();

  constructor(url: string = getWebSocketUrl()) {
    this.url = url;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      console.log('Connecting to WebSocket:', this.url);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.notifyConnectionHandlers(true);

        // Log connection event
        if (logsStoreRef) {
          logsStoreRef.addLog({
            type: 'MSG_CONNECT' as MessageType,
            category: 'system',
            direction: 'response',
            payload: { status: 'connected', url: this.url },
          });
        }

        // Clear reconnect timer if exists
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('Received message:', message);

          // Log incoming message
          if (logsStoreRef) {
            const requestKey = this.getRequestKey(message.type);
            const latency = this.pendingRequests.has(requestKey)
              ? Date.now() - this.pendingRequests.get(requestKey)!
              : undefined;

            if (latency !== undefined) {
              this.pendingRequests.delete(requestKey);
            }

            logsStoreRef.addLog({
              type: message.type,
              direction: 'response',
              payload: message.data,
              latency,
              category: 'system', // Will be auto-determined by store
            });
          }

          this.notifyMessageHandlers(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.notifyConnectionHandlers(false);

        // Log disconnection event
        if (logsStoreRef) {
          logsStoreRef.addLog({
            type: 'MSG_DISCONNECT' as MessageType,
            category: 'system',
            direction: 'response',
            payload: { status: 'disconnected' },
          });
        }

        // Auto-reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          console.log(`Reconnecting in ${this.reconnectInterval}ms...`);
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, this.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.notifyConnectionHandlers(false);
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send<T = any>(type: MessageType, data: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: WSMessage<T> = { type, data };
    console.log('Sending message:', message);

    // Log outgoing message
    if (logsStoreRef) {
      logsStoreRef.addLog({
        type: message.type,
        direction: 'request',
        payload: message.data,
        category: 'system', // Will be auto-determined by store
      });

      // Track request timestamp for latency calculation
      const requestKey = this.getRequestKey(type);
      this.pendingRequests.set(requestKey, Date.now());
    }

    this.ws.send(JSON.stringify(message));
  }

  private getRequestKey(type: MessageType): string {
    // Remove _ACK, _RSP suffixes to match request with response
    return type.replace(/_ACK$|_RSP$|_DELIVER$|_NOTIFY$/, '');
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);

    // Immediately notify current state
    handler(this.isConnected());

    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private notifyMessageHandlers(message: WSMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
