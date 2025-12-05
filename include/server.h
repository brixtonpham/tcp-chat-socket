#ifndef SERVER_H
#define SERVER_H

#include "common.h"
#include "protocol.h"
#include "user.h"
#include "friend.h"
#include "group.h"
#include "message.h"
#include "logger.h"

// Client information
typedef struct {
    int fd;                         // Socket descriptor
    int user_id;                    // User ID (0 if not logged in)
    char username[50];              // Username
    char recv_buffer[BUFFER_SIZE];  // Receive buffer
    int recv_len;                   // Bytes in buffer
    time_t last_activity;           // Last activity timestamp
} ClientInfo;

// Server state
typedef struct {
    int listen_fd;                  // Listening socket
    ClientInfo clients[MAX_CLIENTS];
    int client_count;
    fd_set master_set;              // Master fd_set for select()
    int max_fd;                     // Maximum fd for select()
} ChatServer;

// Server functions
int server_init(ChatServer *server, int port);
void server_loop(ChatServer *server);
void handle_new_connection(ChatServer *server);
void handle_client_data(ChatServer *server, int client_index);
void disconnect_client(ChatServer *server, int client_index);
void check_client_timeouts(ChatServer *server);
int find_client_by_user_id(ChatServer *server, int user_id);
void send_response(ChatServer *server, int client_idx, uint16_t type, const char *data);

// Message handlers
int handle_register(ChatServer *server, int client_idx, const char *payload);
int handle_login(ChatServer *server, int client_idx, const char *payload);
int handle_logout(ChatServer *server, int client_idx);
int handle_friend_request(ChatServer *server, int client_idx, const char *payload);
int handle_friend_accept(ChatServer *server, int client_idx, const char *payload);
int handle_friend_reject(ChatServer *server, int client_idx, const char *payload);
int handle_friend_remove(ChatServer *server, int client_idx, const char *payload);
int handle_friend_list(ChatServer *server, int client_idx);
int handle_chat_send(ChatServer *server, int client_idx, const char *payload);
int handle_group_create(ChatServer *server, int client_idx, const char *payload);
int handle_group_invite(ChatServer *server, int client_idx, const char *payload);
int handle_group_join(ChatServer *server, int client_idx, const char *payload);
int handle_group_leave(ChatServer *server, int client_idx, const char *payload);
int handle_group_remove_user(ChatServer *server, int client_idx, const char *payload);
int handle_group_message(ChatServer *server, int client_idx, const char *payload);

// Helper functions
void broadcast_status_change(ChatServer *server, int user_id, const char *status);
void send_online_friends_list(ChatServer *server, int client_idx);
void deliver_message(ChatServer *server, int client_idx, Message *msg);
void deliver_offline_messages(ChatServer *server, int client_idx);
void notify_group_members(ChatServer *server, int group_id, int exclude_user_id,
                         const char *event_type, const char *data);

#endif // SERVER_H
