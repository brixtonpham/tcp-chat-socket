/**
 * Application configuration
 */

export interface Config {
  // WebSocket server settings
  wsPort: number;
  wsHost: string;

  // TCP connection settings
  tcpHost: string;
  tcpPort: number;

  // Connection management
  heartbeatInterval: number; // milliseconds
  reconnectDelay: number; // milliseconds
  maxReconnectAttempts: number;
  tcpTimeout: number; // milliseconds

  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Default configuration
 */
export const config: Config = {
  // WebSocket server
  wsPort: parseInt(process.env.WS_PORT || '3000'),
  wsHost: process.env.WS_HOST || '0.0.0.0',

  // TCP connection to C server
  tcpHost: process.env.TCP_HOST || 'localhost',
  tcpPort: parseInt(process.env.TCP_PORT || '8888'),

  // Connection management
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'),
  reconnectDelay: parseInt(process.env.RECONNECT_DELAY || '5000'),
  maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '5'),
  tcpTimeout: parseInt(process.env.TCP_TIMEOUT || '60000'),

  // Logging
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
};

/**
 * Validate configuration
 */
export function validateConfig(cfg: Config): void {
  if (cfg.wsPort < 1 || cfg.wsPort > 65535) {
    throw new Error(`Invalid WebSocket port: ${cfg.wsPort}`);
  }

  if (cfg.tcpPort < 1 || cfg.tcpPort > 65535) {
    throw new Error(`Invalid TCP port: ${cfg.tcpPort}`);
  }

  if (cfg.heartbeatInterval < 1000) {
    throw new Error('Heartbeat interval must be at least 1000ms');
  }

  if (cfg.reconnectDelay < 100) {
    throw new Error('Reconnect delay must be at least 100ms');
  }

  if (cfg.maxReconnectAttempts < 1) {
    throw new Error('Max reconnect attempts must be at least 1');
  }
}
