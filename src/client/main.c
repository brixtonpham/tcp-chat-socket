#include "common.h"
#include "protocol.h"
#include <signal.h>

// External functions
extern int client_connect(void *client, const char *host, int port);
extern void client_disconnect(void *client);
extern void run_ui(void *client);

typedef struct {
    int sockfd;
    int user_id;
    char username[50];
    char session_token[65];
    int running;
} ChatClient;

ChatClient g_client;

/**
 * Signal handler for graceful shutdown
 */
void signal_handler(int signum) {
    printf("\nReceived signal %d, shutting down...\n", signum);
    client_disconnect(&g_client);
    exit(0);
}

/**
 * Main entry point for the client
 */
int main(int argc, char *argv[]) {
    char host[100] = "127.0.0.1";
    int port = PORT;

    // Parse command line arguments
    if (argc > 1) {
        strncpy(host, argv[1], sizeof(host) - 1);
    }
    if (argc > 2) {
        port = atoi(argv[2]);
        if (port <= 0 || port > 65535) {
            fprintf(stderr, "Invalid port number: %s\n", argv[2]);
            return 1;
        }
    }

    // Setup signal handlers
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    signal(SIGPIPE, SIG_IGN);

    printf("===========================================\n");
    printf("  TCP Chat Client\n");
    printf("===========================================\n\n");

    // Connect to server
    if (client_connect(&g_client, host, port) < 0) {
        fprintf(stderr, "Failed to connect to server\n");
        return 1;
    }

    // Run UI
    run_ui(&g_client);

    // Cleanup
    client_disconnect(&g_client);

    return 0;
}
