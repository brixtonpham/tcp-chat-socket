#include "common.h"
#include "protocol.h"
#include <string.h>

// External client functions
extern int client_register(void *client, const char *username, const char *password, const char *email);
extern int client_login(void *client, const char *username, const char *password);
extern int client_friend_request(void *client, const char *username);
extern int client_friend_list(void *client);
extern int client_send_message(void *client, int recipient_id, const char *content);
extern int client_group_create(void *client, const char *name, const char *description);
extern int client_group_send(void *client, int group_id, const char *content);
extern void client_disconnect(void *client);
extern int send_message(int sockfd, uint16_t type, const char *data, int data_len);

typedef struct {
    int sockfd;
    int user_id;
    char username[50];
    char session_token[65];
    int running;
} ChatClient;

/**
 * Show help menu
 */
void show_help(void) {
    printf("\n=== Available Commands ===\n");
    printf("Authentication:\n");
    printf("  register <username> <password> <email> - Register new account\n");
    printf("  login <username> <password>            - Login to account\n");
    printf("  logout                                 - Logout and disconnect\n");
    printf("\nFriends:\n");
    printf("  friend add <username>                  - Send friend request\n");
    printf("  friend accept <user_id>                - Accept friend request\n");
    printf("  friend reject <user_id>                - Reject friend request\n");
    printf("  friend remove <user_id>                - Remove friend\n");
    printf("  friend list                            - Show friends list\n");
    printf("\nMessaging:\n");
    printf("  msg <user_id> <message>                - Send message to user\n");
    printf("\nGroups:\n");
    printf("  group create <name> [description]      - Create new group\n");
    printf("  group join <group_id>                  - Join a group\n");
    printf("  group leave <group_id>                 - Leave a group\n");
    printf("  group invite <group_id> <user_id>      - Invite user to group\n");
    printf("  group remove <group_id> <user_id>      - Remove user from group (admin)\n");
    printf("  group msg <group_id> <message>         - Send message to group\n");
    printf("\nOther:\n");
    printf("  help                                   - Show this help\n");
    printf("  quit                                   - Exit application\n");
    printf("=========================\n\n");
}

/**
 * Process user command
 */
void process_command(ChatClient *client, const char *command) {
    char cmd[20], arg1[100], arg2[100], arg3[100];
    char rest[4000];

    // Clear buffers
    memset(cmd, 0, sizeof(cmd));
    memset(arg1, 0, sizeof(arg1));
    memset(arg2, 0, sizeof(arg2));
    memset(arg3, 0, sizeof(arg3));
    memset(rest, 0, sizeof(rest));

    // Parse command
    sscanf(command, "%19s", cmd);

    if (strcmp(cmd, "help") == 0) {
        show_help();
    }
    else if (strcmp(cmd, "register") == 0) {
        if (sscanf(command, "%*s %99s %99s %99s", arg1, arg2, arg3) == 3) {
            client_register(client, arg1, arg2, arg3);
        } else {
            printf("Usage: register <username> <password> <email>\n");
        }
    }
    else if (strcmp(cmd, "login") == 0) {
        if (sscanf(command, "%*s %99s %99s", arg1, arg2) == 2) {
            client_login(client, arg1, arg2);
        } else {
            printf("Usage: login <username> <password>\n");
        }
    }
    else if (strcmp(cmd, "logout") == 0) {
        client_disconnect(client);
    }
    else if (strcmp(cmd, "friend") == 0) {
        char subcmd[20];
        if (sscanf(command, "%*s %19s", subcmd) == 1) {
            if (strcmp(subcmd, "add") == 0) {
                if (sscanf(command, "%*s %*s %99s", arg1) == 1) {
                    client_friend_request(client, arg1);
                } else {
                    printf("Usage: friend add <username>\n");
                }
            }
            else if (strcmp(subcmd, "accept") == 0) {
                if (sscanf(command, "%*s %*s %99s", arg1) == 1) {
                    int user_id = atoi(arg1);
                    char payload[20];
                    snprintf(payload, sizeof(payload), "%d", user_id);
                    send_message(client->sockfd, MSG_FRIEND_ACCEPT, payload, strlen(payload));
                    printf("Friend request accepted\n");
                } else {
                    printf("Usage: friend accept <user_id>\n");
                }
            }
            else if (strcmp(subcmd, "reject") == 0) {
                if (sscanf(command, "%*s %*s %99s", arg1) == 1) {
                    int user_id = atoi(arg1);
                    char payload[20];
                    snprintf(payload, sizeof(payload), "%d", user_id);
                    send_message(client->sockfd, MSG_FRIEND_REJECT, payload, strlen(payload));
                    printf("Friend request rejected\n");
                } else {
                    printf("Usage: friend reject <user_id>\n");
                }
            }
            else if (strcmp(subcmd, "remove") == 0) {
                if (sscanf(command, "%*s %*s %99s", arg1) == 1) {
                    int user_id = atoi(arg1);
                    char payload[20];
                    snprintf(payload, sizeof(payload), "%d", user_id);
                    send_message(client->sockfd, MSG_FRIEND_REMOVE, payload, strlen(payload));
                    printf("Friend removed\n");
                } else {
                    printf("Usage: friend remove <user_id>\n");
                }
            }
            else if (strcmp(subcmd, "list") == 0) {
                client_friend_list(client);
            }
            else {
                printf("Unknown friend command. Use 'help' for list of commands.\n");
            }
        } else {
            printf("Usage: friend <add|accept|reject|remove|list> ...\n");
        }
    }
    else if (strcmp(cmd, "msg") == 0) {
        int recipient_id;
        if (sscanf(command, "%*s %d %3999[^\n]", &recipient_id, rest) == 2) {
            client_send_message(client, recipient_id, rest);
        } else {
            printf("Usage: msg <user_id> <message>\n");
        }
    }
    else if (strcmp(cmd, "group") == 0) {
        char subcmd[20];
        if (sscanf(command, "%*s %19s", subcmd) == 1) {
            if (strcmp(subcmd, "create") == 0) {
                if (sscanf(command, "%*s %*s %99s %3999[^\n]", arg1, rest) >= 1) {
                    client_group_create(client, arg1, rest);
                } else {
                    printf("Usage: group create <name> [description]\n");
                }
            }
            else if (strcmp(subcmd, "join") == 0) {
                if (sscanf(command, "%*s %*s %99s", arg1) == 1) {
                    int group_id = atoi(arg1);
                    char payload[20];
                    snprintf(payload, sizeof(payload), "%d", group_id);
                    send_message(client->sockfd, MSG_GROUP_JOIN, payload, strlen(payload));
                    printf("Joining group...\n");
                } else {
                    printf("Usage: group join <group_id>\n");
                }
            }
            else if (strcmp(subcmd, "leave") == 0) {
                if (sscanf(command, "%*s %*s %99s", arg1) == 1) {
                    int group_id = atoi(arg1);
                    char payload[20];
                    snprintf(payload, sizeof(payload), "%d", group_id);
                    send_message(client->sockfd, MSG_GROUP_LEAVE, payload, strlen(payload));
                    printf("Leaving group...\n");
                } else {
                    printf("Usage: group leave <group_id>\n");
                }
            }
            else if (strcmp(subcmd, "invite") == 0) {
                int group_id, user_id;
                if (sscanf(command, "%*s %*s %d %d", &group_id, &user_id) == 2) {
                    char payload[50];
                    snprintf(payload, sizeof(payload), "%d|%d", group_id, user_id);
                    send_message(client->sockfd, MSG_GROUP_INVITE, payload, strlen(payload));
                    printf("Invitation sent\n");
                } else {
                    printf("Usage: group invite <group_id> <user_id>\n");
                }
            }
            else if (strcmp(subcmd, "msg") == 0) {
                int group_id;
                if (sscanf(command, "%*s %*s %d %3999[^\n]", &group_id, rest) == 2) {
                    client_group_send(client, group_id, rest);
                } else {
                    printf("Usage: group msg <group_id> <message>\n");
                }
            }
            else if (strcmp(subcmd, "remove") == 0) {
                int group_id, user_id;
                if (sscanf(command, "%*s %*s %d %d", &group_id, &user_id) == 2) {
                    char payload[50];
                    snprintf(payload, sizeof(payload), "%d|%d", group_id, user_id);
                    send_message(client->sockfd, MSG_GROUP_REMOVE_USER, payload, strlen(payload));
                    printf("Removing user from group...\n");
                } else {
                    printf("Usage: group remove <group_id> <user_id>\n");
                }
            }
            else {
                printf("Unknown group command. Use 'help' for list of commands.\n");
            }
        } else {
            printf("Usage: group <create|join|leave|invite|msg> ...\n");
        }
    }
    else if (strcmp(cmd, "quit") == 0) {
        client_disconnect(client);
        exit(0);
    }
    else if (strlen(cmd) > 0) {
        printf("Unknown command: %s. Type 'help' for list of commands.\n", cmd);
    }
}

/**
 * Run command-line interface
 */
void run_ui(ChatClient *client) {
    char input[4096];

    printf("\nWelcome to TCP Chat Client!\n");
    printf("Type 'help' for list of commands.\n\n");

    while (client->running) {
        printf("> ");
        fflush(stdout);

        if (fgets(input, sizeof(input), stdin) == NULL) {
            break;
        }

        // Remove trailing newline
        input[strcspn(input, "\n")] = '\0';

        // Skip empty input
        if (strlen(input) == 0) {
            continue;
        }

        process_command(client, input);
    }
}
