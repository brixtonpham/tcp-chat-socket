import type { WSMessage, MessageType } from '../types';

export type MessageHandler = (message: WSMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private isIntentionallyClosed: boolean = false;

  constructor(url: string = 'ws://localhost:3000') {
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
    this.ws.send(JSON.stringify(message));
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
