#include "common.h"
#include "protocol.h"
#include <pthread.h>

typedef struct {
    int sockfd;
    int user_id;
    char username[50];
    char session_token[65];
    int running;
    pthread_t recv_thread;
} ChatClient;

// Global client instance
ChatClient g_client;

/**
 * Receive thread - handles incoming messages from server
 */
void* receive_thread(void *arg) {
    ChatClient *client = (ChatClient*)arg;
    char buffer[BUFFER_SIZE];
    uint16_t type;
    int msg_len;

    while (client->running) {
        int result = recv_message(client->sockfd, &type, buffer, &msg_len);

        if (result < 0) {
            if (client->running) {
                printf("\n[ERROR] Connection lost\n");
                client->running = 0;
            }
            break;
        }

        // Handle different message types
        switch (type) {
            case MSG_CHAT_DELIVER: {
                // Format: message_id|username|sender_id|content|timestamp
                int msg_id, sender_id;
                char username[50], content[MAX_PAYLOAD];
                long timestamp;

                sscanf(buffer, "%d|%49[^|]|%d|%4095[^|]|%ld",
                       &msg_id, username, &sender_id, content, &timestamp);

                printf("\n[MESSAGE from %s]: %s\n", username, content);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_GROUP_MSG_DELIVER: {
                // Format: message_id|group_name|sender_id|username|content|timestamp
                int msg_id, sender_id;
                char group_name[100], username[50], content[MAX_PAYLOAD];
                long timestamp;

                sscanf(buffer, "%d|%99[^|]|%d|%49[^|]|%4095[^|]|%ld",
                       &msg_id, group_name, &sender_id, username, content, &timestamp);

                printf("\n[GROUP %s - %s]: %s\n", group_name, username, content);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_FRIEND_NOTIFY: {
                // Format: user_id|username|message
                int user_id;
                char username[50], message[200];

                sscanf(buffer, "%d|%49[^|]|%199[^\n]", &user_id, username, message);

                printf("\n[FRIEND NOTIFICATION] %s %s\n", username, message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_STATUS_NOTIFY: {
                // Format: user_id|username|status
                int user_id;
                char username[50], status[20];

                sscanf(buffer, "%d|%49[^|]|%19s", &user_id, username, status);

                printf("\n[STATUS] %s is now %s\n", username, status);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_GROUP_INVITE: {
                // Format: INVITE|group_id|group_name|inviter_id|inviter_name
                char invite_type[20];
                int group_id, inviter_id;
                char group_name[100], inviter_name[50];

                sscanf(buffer, "%19[^|]|%d|%99[^|]|%d|%49s",
                       invite_type, &group_id, group_name, &inviter_id, inviter_name);

                printf("\n[GROUP INVITE] %s invited you to join '%s' (ID: %d)\n",
                       inviter_name, group_name, group_id);
                printf("Use 'group join %d' to accept\n", group_id);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_ERROR: {
                printf("\n[ERROR] %s\n", buffer);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_REGISTER_ACK: {
                char status[10];
                int user_id;
                char message[100];
                sscanf(buffer, "%9[^|]|%d|%99[^\n]", status, &user_id, message);
                if (strcmp(status, "OK") == 0) {
                    printf("\nRegistration successful! User ID: %d\n", user_id);
                } else {
                    printf("\nRegistration failed: %s\n", message);
                }
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_LOGIN_ACK: {
                char status[10];
                char token[65];
                int user_id;
                if (sscanf(buffer, "%9[^|]|%64[^|]|%d", status, token, &user_id) >= 2) {
                    if (strcmp(status, "OK") == 0) {
                        client->user_id = user_id;
                        strncpy(client->session_token, token, sizeof(client->session_token) - 1);
                        printf("\nLogin successful! Welcome (ID: %d)\n", user_id);
                    } else {
                        char message[100];
                        sscanf(buffer, "%*[^|]|%99[^\n]", message);
                        printf("\nLogin failed: %s\n", message);
                    }
                }
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_LOGOUT_ACK: {
                printf("\nLogged out successfully. Goodbye!\n");
                client->running = 0;
                break;
            }

            case MSG_FRIEND_REQUEST_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_FRIEND_ACCEPT_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_FRIEND_REJECT_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_FRIEND_REMOVE_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_FRIEND_LIST_RSP: {
                int count;
                char friends_data[BUFFER_SIZE];
                sscanf(buffer, "%d|%4095[^\n]", &count, friends_data);
                printf("\n=== Friends List (%d) ===\n", count);
                if (count > 0) {
                    char *token = strtok(friends_data, ",");
                    while (token != NULL) {
                        int friend_id;
                        char username[50], status[20];
                        sscanf(token, "%d|%49[^|]|%19s", &friend_id, username, status);
                        printf("  %s (ID: %d) - %s\n", username, friend_id, status);
                        token = strtok(NULL, ",");
                    }
                }
                printf("=======================\n");
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_CHAT_ACK: {
                printf("\nMessage sent successfully\n");
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_GROUP_CREATE_ACK: {
                char status[10];
                int group_id;
                char group_name[100];
                sscanf(buffer, "%9[^|]|%d|%99[^\n]", status, &group_id, group_name);
                if (strcmp(status, "OK") == 0) {
                    printf("\nGroup created successfully! Group ID: %d\n", group_id);
                } else {
                    printf("\nFailed to create group\n");
                }
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_GROUP_JOIN_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_GROUP_LEAVE_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_GROUP_INVITE_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            case MSG_GROUP_REMOVE_ACK: {
                char status[10], message[100];
                sscanf(buffer, "%9[^|]|%99[^\n]", status, message);
                printf("\n%s\n", message);
                printf("> ");
                fflush(stdout);
                break;
            }

            default:
                // Debug: show unknown message types
                printf("\n[DEBUG] Unknown message type: 0x%02X\n", type);
                printf("> ");
                fflush(stdout);
                break;
        }
    }

    return NULL;
}

/**
 * Connect to server
 */
int client_connect(ChatClient *client, const char *host, int port) {
    // Create socket
    client->sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (client->sockfd < 0) {
        perror("socket() failed");
        return -1;
    }

    // Setup server address
    SOCKADDR_IN saddr;
    memset(&saddr, 0, sizeof(saddr));
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(port);

    if (inet_pton(AF_INET, host, &saddr.sin_addr) <= 0) {
        perror("inet_pton() failed");
        close(client->sockfd);
        return -1;
    }

    // Connect to server
    if (connect(client->sockfd, (SOCKADDR*)&saddr, sizeof(saddr)) < 0) {
        perror("connect() failed");
        close(client->sockfd);
        return -1;
    }

    client->running = 1;
    client->user_id = 0;

    // Start receive thread
    if (pthread_create(&client->recv_thread, NULL, receive_thread, client) != 0) {
        perror("pthread_create() failed");
        close(client->sockfd);
        return -1;
    }

    printf("Connected to server at %s:%d\n", host, port);

    return 0;
}

/**
 * Disconnect from server
 */
void client_disconnect(ChatClient *client) {
    if (client->running) {
        client->running = 0;

        // Send logout message if logged in
        if (client->user_id > 0) {
            send_message(client->sockfd, MSG_LOGOUT, "", 0);
        }

        // Wait for receive thread to finish
        pthread_join(client->recv_thread, NULL);

        close(client->sockfd);
    }
}

/**
 * Register new account
 */
int client_register(ChatClient *client, const char *username, const char *password, const char *email) {
    char payload[300];
    snprintf(payload, sizeof(payload), "%s|%s|%s", username, password, email);
    send_message(client->sockfd, MSG_REGISTER, payload, strlen(payload));
    // Response will be handled by receive_thread
    return 0;
}

/**
 * Login
 */
int client_login(ChatClient *client, const char *username, const char *password) {
    char payload[150];
    snprintf(payload, sizeof(payload), "%s|%s", username, password);
    strncpy(client->username, username, sizeof(client->username) - 1);
    send_message(client->sockfd, MSG_LOGIN, payload, strlen(payload));
    // Response will be handled by receive_thread
    return 0;
}

/**
 * Send friend request
 */
int client_friend_request(ChatClient *client, const char *username) {
    send_message(client->sockfd, MSG_FRIEND_REQUEST, username, strlen(username));
    // Response will be handled by receive_thread
    return 0;
}

/**
 * Get friend list
 */
int client_friend_list(ChatClient *client) {
    send_message(client->sockfd, MSG_FRIEND_LIST, "", 0);
    // Response will be handled by receive_thread
    return 0;
}

/**
 * Send chat message
 */
int client_send_message(ChatClient *client, int recipient_id, const char *content) {
    char payload[BUFFER_SIZE];
    snprintf(payload, sizeof(payload), "%d|%s", recipient_id, content);
    send_message(client->sockfd, MSG_CHAT_SEND, payload, strlen(payload));
    // Response will be handled by receive_thread
    return 0;
}

/**
 * Create group
 */
int client_group_create(ChatClient *client, const char *name, const char *description) {
    char payload[400];
    snprintf(payload, sizeof(payload), "%s|%s", name, description);
    send_message(client->sockfd, MSG_GROUP_CREATE, payload, strlen(payload));
    // Response will be handled by receive_thread
    return 0;
}

/**
 * Send group message
 */
int client_group_send(ChatClient *client, int group_id, const char *content) {
    char payload[BUFFER_SIZE];
    snprintf(payload, sizeof(payload), "%d|%s", group_id, content);
    send_message(client->sockfd, MSG_GROUP_MSG, payload, strlen(payload));
    // Response will be handled by receive_thread
    return 0;
}
