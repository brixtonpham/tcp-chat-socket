/**
 * WebSocket Proxy Server Entry Point
 *
 * Bridges WebSocket connections from browsers to C TCP chat server
 */

import { ProxyServer } from './server';
import { logger } from './utils/logger';
import { config, validateConfig } from './utils/config';

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Validate configuration
    logger.info('Validating configuration');
    validateConfig(config);

    logger.info('Configuration loaded', {
      wsPort: config.wsPort,
      wsHost: config.wsHost,
      tcpHost: config.tcpHost,
      tcpPort: config.tcpPort,
      heartbeatInterval: config.heartbeatInterval,
      logLevel: config.logLevel
    });

    // Create and start proxy server
    const server = new ProxyServer();

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      server.stop();

      // Give a short delay for cleanup
      setTimeout(() => {
        logger.info('Shutdown complete');
        process.exit(0);
      }, 1000);
    };

    // Register signal handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : String(reason)
      });
      shutdown('unhandledRejection');
    });

    // Start server
    server.start();

    logger.info('WebSocket proxy server is running', {
      wsUrl: `ws://${config.wsHost}:${config.wsPort}`,
      tcpTarget: `${config.tcpHost}:${config.tcpPort}`
    });

    // Log stats periodically
    setInterval(() => {
      const stats = server.getStats();
      logger.info('Server stats', stats);
    }, 60000); // Every minute

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the server
main();
