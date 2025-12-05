#include "server.h"
#include <signal.h>

ChatServer g_server;

/**
 * Signal handler for graceful shutdown
 */
void signal_handler(int signum) {
    printf("\nReceived signal %d, shutting down server...\n", signum);

    // Close all client connections
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (g_server.clients[i].fd > 0) {
            disconnect_client(&g_server, i);
        }
    }

    // Close listening socket
    if (g_server.listen_fd > 0) {
        close(g_server.listen_fd);
    }

    // Save all data
    save_users_to_file();
    save_friendships_to_file();
    save_groups_to_file();
    save_messages_to_file();

    log_info("Server shut down gracefully");

    exit(0);
}

/**
 * Main entry point for the server
 */
int main(int argc, char *argv[]) {
    int port = PORT;

    // Parse command line arguments
    if (argc > 1) {
        port = atoi(argv[1]);
        if (port <= 0 || port > 65535) {
            fprintf(stderr, "Invalid port number: %s\n", argv[1]);
            return 1;
        }
    }

    // Setup signal handlers
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    // Ignore SIGPIPE (broken pipe when client disconnects)
    signal(SIGPIPE, SIG_IGN);

    printf("===========================================\n");
    printf("  TCP Chat Server\n");
    printf("===========================================\n\n");

    // Initialize server
    if (server_init(&g_server, port) < 0) {
        fprintf(stderr, "Failed to initialize server\n");
        return 1;
    }

    printf("\nServer ready. Press Ctrl+C to stop.\n\n");

    // Run server loop
    server_loop(&g_server);

    return 0;
}
