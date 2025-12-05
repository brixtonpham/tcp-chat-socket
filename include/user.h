#ifndef USER_H
#define USER_H

#include "common.h"

// User structure
typedef struct {
    int user_id;
    char username[50];
    char email[100];
    char password_hash[128];
    char status[20];            // "online", "offline", "away"
    time_t created_at;
    time_t last_login;
} User;

// Session structure
typedef struct {
    int session_id;
    int user_id;
    char token[65];             // 64 hex chars + null
    int socket_fd;
    time_t created_at;
    time_t last_activity;
    int is_valid;
} Session;

// Global user data
extern User g_users[MAX_USERS];
extern int g_user_count;
extern Session g_sessions[MAX_SESSIONS];
extern int g_session_count;

// User management functions
int load_users_from_file(void);
int save_users_to_file(void);
User* get_user_by_id(int user_id);
User* get_user_by_username(const char *username);
int create_user(const char *username, const char *password, const char *email);

// Password functions
void hash_password(const char *password, char *hash_out);
int verify_password(const char *password, const char *stored_hash);

// Session management functions
Session* create_session(int user_id, int socket_fd);
Session* find_session_by_user_id(int user_id);
void invalidate_session(Session *session);
void invalidate_session_by_user(int user_id);
void generate_random_token(char *token);

#endif // USER_H
