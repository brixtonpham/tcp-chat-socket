#include "server.h"

/**
 * Initialize server
 *
 * Steps following TCP server flow:
 * socket() → bind() → listen()
 *
 * @param server Server structure
 * @param port Port to listen on
 * @return 0 on success, -1 on error
 */
int server_init(ChatServer *server, int port) {
    // Step 1: Create socket (AF_INET = IPv4, SOCK_STREAM = TCP)
    server->listen_fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server->listen_fd < 0) {
        perror("socket() failed");
        return -1;
    }

    // Allow reusing address (avoid "Address already in use" error)
    int opt = 1;
    setsockopt(server->listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // Step 2: Bind socket to address
    SOCKADDR_IN saddr;
    memset(&saddr, 0, sizeof(saddr));
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(port);           // Network byte order
    saddr.sin_addr.s_addr = INADDR_ANY;     // Accept connections on any interface

    if (bind(server->listen_fd, (SOCKADDR*)&saddr, sizeof(saddr)) < 0) {
        perror("bind() failed");
        close(server->listen_fd);
        return -1;
    }

    // Step 3: Listen for connections
    if (listen(server->listen_fd, 10) < 0) {
        perror("listen() failed");
        close(server->listen_fd);
        return -1;
    }

    // Initialize fd_set
    FD_ZERO(&server->master_set);
    FD_SET(server->listen_fd, &server->master_set);
    server->max_fd = server->listen_fd;
    server->client_count = 0;

    // Initialize client array
    for (int i = 0; i < MAX_CLIENTS; i++) {
        server->clients[i].fd = -1;
        server->clients[i].user_id = 0;
    }

    // Load data from files
    load_users_from_file();
    load_friendships_from_file();
    load_groups_from_file();
    load_messages_from_file();

    log_info("Server initialized successfully");
    printf("Server listening on port %d\n", port);

    return 0;
}

/**
 * Main server loop using select()
 *
 * select() allows monitoring multiple sockets simultaneously.
 * It blocks until at least one socket is ready for I/O.
 */
void server_loop(ChatServer *server) {
    fd_set read_fds;
    struct timeval timeout;

    log_info("Server loop started");

    while (1) {
        // Copy master_set because select() modifies it
        read_fds = server->master_set;

        // Set timeout (for periodic tasks like heartbeat check)
        timeout.tv_sec = 30;
        timeout.tv_usec = 0;

        // select() blocks until:
        // - At least one socket is ready for reading
        // - Timeout expires
        // - Signal is received
        int ready = select(server->max_fd + 1, &read_fds, NULL, NULL, &timeout);

        if (ready < 0) {
            perror("select() error");
            continue;
        }

        if (ready == 0) {
            // Timeout - check for inactive clients
            check_client_timeouts(server);
            continue;
        }

        // Check listening socket for new connections
        if (FD_ISSET(server->listen_fd, &read_fds)) {
            handle_new_connection(server);
        }

        // Check client sockets for data
        for (int i = 0; i < MAX_CLIENTS; i++) {
            int fd = server->clients[i].fd;
            if (fd > 0 && FD_ISSET(fd, &read_fds)) {
                handle_client_data(server, i);
            }
        }
    }
}

/**
 * Handle new connection
 *
 * accept() creates a new socket for the connection
 */
void handle_new_connection(ChatServer *server) {
    SOCKADDR_IN client_addr;
    socklen_t addr_len = sizeof(client_addr);

    // accept() returns new socket descriptor for this connection
    int new_fd = accept(server->listen_fd, (SOCKADDR*)&client_addr, &addr_len);

    if (new_fd < 0) {
        perror("accept() failed");
        return;
    }

    char client_ip[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &client_addr.sin_addr, client_ip, INET_ADDRSTRLEN);

    printf("New connection from %s:%d (fd=%d)\n",
           client_ip,
           ntohs(client_addr.sin_port),
           new_fd);

    // Find empty slot in client array
    int slot = -1;
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (server->clients[i].fd < 0) {
            slot = i;
            break;
        }
    }

    if (slot < 0) {
        printf("Server full, rejecting connection\n");
        send_message(new_fd, MSG_ERROR, "Server is full", 14);
        close(new_fd);
        return;
    }

    // Add client to array
    server->clients[slot].fd = new_fd;
    server->clients[slot].user_id = 0;  // Not logged in yet
    server->clients[slot].recv_len = 0;
    server->clients[slot].last_activity = time(NULL);
    memset(server->clients[slot].username, 0, sizeof(server->clients[slot].username));

    // Add to master_set for select()
    FD_SET(new_fd, &server->master_set);
    if (new_fd > server->max_fd) {
        server->max_fd = new_fd;
    }

    server->client_count++;

    log_activity(0, LOG_CONNECT, client_ip);
}

/**
 * Handle data from client
 */
void handle_client_data(ChatServer *server, int client_index) {
    ClientInfo *client = &server->clients[client_index];
    char buffer[BUFFER_SIZE];
    uint16_t type;
    int msg_len;

    // Receive message
    int result = recv_message(client->fd, &type, buffer, &msg_len);

    if (result < 0) {
        // Client disconnected or error
        printf("Client %d disconnected\n", client_index);
        disconnect_client(server, client_index);
        return;
    }

    // Update last activity
    client->last_activity = time(NULL);

    // Route message to appropriate handler
    switch (type) {
        case MSG_REGISTER:
            handle_register(server, client_index, buffer);
            break;
        case MSG_LOGIN:
            handle_login(server, client_index, buffer);
            break;
        case MSG_LOGOUT:
            handle_logout(server, client_index);
            break;
        case MSG_FRIEND_REQUEST:
            handle_friend_request(server, client_index, buffer);
            break;
        case MSG_FRIEND_ACCEPT:
            handle_friend_accept(server, client_index, buffer);
            break;
        case MSG_FRIEND_REJECT:
            handle_friend_reject(server, client_index, buffer);
            break;
        case MSG_FRIEND_REMOVE:
            handle_friend_remove(server, client_index, buffer);
            break;
        case MSG_FRIEND_LIST:
            handle_friend_list(server, client_index);
            break;
        case MSG_CHAT_SEND:
            handle_chat_send(server, client_index, buffer);
            break;
        case MSG_GROUP_CREATE:
            handle_group_create(server, client_index, buffer);
            break;
        case MSG_GROUP_INVITE:
            handle_group_invite(server, client_index, buffer);
            break;
        case MSG_GROUP_JOIN:
            handle_group_join(server, client_index, buffer);
            break;
        case MSG_GROUP_LEAVE:
            handle_group_leave(server, client_index, buffer);
            break;
        case MSG_GROUP_REMOVE_USER:
            handle_group_remove_user(server, client_index, buffer);
            break;
        case MSG_GROUP_MSG:
            handle_group_message(server, client_index, buffer);
            break;
        case MSG_GROUP_LIST:
            handle_group_list(server, client_index);
            break;
        case MSG_HEARTBEAT:
            send_response(server, client_index, MSG_HEARTBEAT_ACK, "");
            break;
        default:
            printf("Unknown message type: 0x%02X\n", type);
            send_response(server, client_index, MSG_ERROR, "Unknown message type");
            break;
    }
}

/**
 * Disconnect client
 */
void disconnect_client(ChatServer *server, int client_index) {
    ClientInfo *client = &server->clients[client_index];

    if (client->fd <= 0) {
        return;
    }

    // Notify friends if user was logged in
    if (client->user_id > 0) {
        User *user = get_user_by_id(client->user_id);
        if (user) {
            strcpy(user->status, "offline");
            save_users_to_file();
        }

        broadcast_status_change(server, client->user_id, "offline");
        invalidate_session_by_user(client->user_id);

        log_activity(client->user_id, LOG_DISCONNECT, "Client disconnected");
    }

    // Remove from master_set
    FD_CLR(client->fd, &server->master_set);
    close(client->fd);

    client->fd = -1;
    client->user_id = 0;
    server->client_count--;

    printf("Client %d disconnected (total clients: %d)\n", client_index, server->client_count);
}

/**
 * Check for inactive clients (timeout)
 */
void check_client_timeouts(ChatServer *server) {
    time_t now = time(NULL);

    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (server->clients[i].fd > 0) {
            time_t inactive = now - server->clients[i].last_activity;

            if (inactive > 300) {  // 5 minutes timeout
                printf("Client %d timed out\n", i);
                disconnect_client(server, i);
            }
        }
    }
}

/**
 * Find client by user ID
 *
 * @return client index on success, -1 if not found
 */
int find_client_by_user_id(ChatServer *server, int user_id) {
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (server->clients[i].fd > 0 && server->clients[i].user_id == user_id) {
            return i;
        }
    }
    return -1;
}

/**
 * Send response to client
 */
void send_response(ChatServer *server, int client_idx, uint16_t type, const char *data) {
    if (client_idx < 0 || client_idx >= MAX_CLIENTS) {
        return;
    }

    int fd = server->clients[client_idx].fd;
    if (fd <= 0) {
        return;
    }

    int data_len = data ? strlen(data) : 0;
    send_message(fd, type, data, data_len);
}

/**
 * Broadcast status change to friends
 */
void broadcast_status_change(ChatServer *server, int user_id, const char *status) {
    // Get friends list
    int friend_ids[100];
    int friend_count = get_friends(user_id, friend_ids, 100);

    User *user = get_user_by_id(user_id);
    if (!user) return;

    for (int i = 0; i < friend_count; i++) {
        int friend_client = find_client_by_user_id(server, friend_ids[i]);

        if (friend_client >= 0) {
            char notify[150];
            snprintf(notify, sizeof(notify), "%d|%s|%s", user_id, user->username, status);
            send_response(server, friend_client, MSG_STATUS_NOTIFY, notify);
        }
    }
}

/**
 * Send online friends list
 */
void send_online_friends_list(ChatServer *server, int client_idx) {
    int user_id = server->clients[client_idx].user_id;

    // Get friends
    int friend_ids[100];
    int friend_count = get_friends(user_id, friend_ids, 100);

    // Build response
    char response[BUFFER_SIZE] = "";
    int online_count = 0;

    for (int i = 0; i < friend_count; i++) {
        User *friend = get_user_by_id(friend_ids[i]);
        if (friend && strcmp(friend->status, "online") == 0) {
            char entry[100];
            snprintf(entry, sizeof(entry), "%d:%s,", friend->user_id, friend->username);
            strcat(response, entry);
            online_count++;
        }
    }

    send_response(server, client_idx, MSG_FRIEND_LIST_RSP, response);
}

/**
 * Deliver message to client
 */
void deliver_message(ChatServer *server, int client_idx, Message *msg) {
    User *sender = get_user_by_id(msg->sender_id);
    if (!sender) return;

    char payload[BUFFER_SIZE];
    snprintf(payload, sizeof(payload), "%d|%s|%d|%s|%ld",
            msg->message_id,
            sender->username,
            msg->sender_id,
            msg->content,
            msg->sent_at);

    send_response(server, client_idx, MSG_CHAT_DELIVER, payload);
}

/**
 * Deliver offline messages when user logs in
 */
void deliver_offline_messages(ChatServer *server, int client_idx) {
    int user_id = server->clients[client_idx].user_id;

    for (int i = 0; i < g_offline_count; i++) {
        if (g_offline_queue[i].recipient_id == user_id &&
            g_offline_queue[i].delivered == 0) {

            Message *msg = get_message_by_id(g_offline_queue[i].message_id);

            if (msg) {
                deliver_message(server, client_idx, msg);
                g_offline_queue[i].delivered = 1;
                msg->delivered = 1;
            }
        }
    }
}

/**
 * Notify group members
 */
void notify_group_members(ChatServer *server, int group_id, int exclude_user_id,
                         const char *event_type, const char *data) {
    int member_ids[100];
    int member_count = get_group_members(group_id, member_ids, 100);

    for (int i = 0; i < member_count; i++) {
        if (member_ids[i] == exclude_user_id) {
            continue;
        }

        int member_client = find_client_by_user_id(server, member_ids[i]);
        if (member_client >= 0) {
            char notify[200];
            snprintf(notify, sizeof(notify), "%s|%s", event_type, data);
            send_response(server, member_client, MSG_GROUP_MSG, notify);
        }
    }
}
