#include "user.h"
#include "logger.h"

// Global user data
User g_users[MAX_USERS];
int g_user_count = 0;
Session g_sessions[MAX_SESSIONS];
int g_session_count = 0;

/**
 * Load users from file
 */
int load_users_from_file(void) {
    FILE *f = fopen(USER_FILE, "rb");
    if (f == NULL) {
        // File doesn't exist yet - not an error
        return 0;
    }

    g_user_count = fread(g_users, sizeof(User), MAX_USERS, f);
    fclose(f);

    printf("Loaded %d users from file\n", g_user_count);
    return g_user_count;
}

/**
 * Save users to file
 */
int save_users_to_file(void) {
    FILE *f = fopen(USER_FILE, "wb");
    if (f == NULL) {
        perror("Failed to open user file for writing");
        return -1;
    }

    fwrite(g_users, sizeof(User), g_user_count, f);
    fclose(f);

    return 0;
}

/**
 * Get user by ID
 */
User* get_user_by_id(int user_id) {
    for (int i = 0; i < g_user_count; i++) {
        if (g_users[i].user_id == user_id) {
            return &g_users[i];
        }
    }
    return NULL;
}

/**
 * Get user by username
 */
User* get_user_by_username(const char *username) {
    for (int i = 0; i < g_user_count; i++) {
        if (strcmp(g_users[i].username, username) == 0) {
            return &g_users[i];
        }
    }
    return NULL;
}

/**
 * Create new user
 *
 * @return user_id on success, -1 on error
 */
int create_user(const char *username, const char *password, const char *email) {
    if (g_user_count >= MAX_USERS) {
        return -1;
    }

    // Check if username already exists
    if (get_user_by_username(username) != NULL) {
        return -1;
    }

    User *new_user = &g_users[g_user_count];
    new_user->user_id = g_user_count + 1;
    strncpy(new_user->username, username, sizeof(new_user->username) - 1);
    strncpy(new_user->email, email, sizeof(new_user->email) - 1);
    strcpy(new_user->status, "offline");
    new_user->created_at = time(NULL);
    new_user->last_login = 0;

    // Hash password
    hash_password(password, new_user->password_hash);

    g_user_count++;

    // Save to file
    save_users_to_file();

    return new_user->user_id;
}

/**
 * Hash password
 *
 * NOTE: This is a simple hash for educational purposes.
 * In production, use bcrypt or argon2id!
 *
 * @param password Plain text password
 * @param hash_out Output buffer (at least 128 bytes)
 */
void hash_password(const char *password, char *hash_out) {
    // Simple DJB2 hash with salt
    unsigned long hash = 5381;
    int c;

    const char *p = password;
    while ((c = *p++)) {
        hash = ((hash << 5) + hash) + c;  // hash * 33 + c
    }

    sprintf(hash_out, "%016lx", hash);
}

/**
 * Verify password
 *
 * @return 1 if valid, 0 if invalid
 */
int verify_password(const char *password, const char *stored_hash) {
    char computed_hash[128];
    hash_password(password, computed_hash);
    return strcmp(computed_hash, stored_hash) == 0;
}

/**
 * Create new session
 *
 * @return Session pointer on success, NULL on error
 */
Session* create_session(int user_id, int socket_fd) {
    if (g_session_count >= MAX_SESSIONS) {
        return NULL;
    }

    Session *session = &g_sessions[g_session_count];
    session->session_id = g_session_count + 1;
    session->user_id = user_id;
    session->socket_fd = socket_fd;
    session->created_at = time(NULL);
    session->last_activity = time(NULL);
    session->is_valid = 1;

    // Generate random token
    generate_random_token(session->token);

    g_session_count++;

    return session;
}

/**
 * Find session by user ID
 */
Session* find_session_by_user_id(int user_id) {
    for (int i = 0; i < g_session_count; i++) {
        if (g_sessions[i].user_id == user_id && g_sessions[i].is_valid) {
            return &g_sessions[i];
        }
    }
    return NULL;
}

/**
 * Invalidate session
 */
void invalidate_session(Session *session) {
    if (session) {
        session->is_valid = 0;
    }
}

/**
 * Invalidate all sessions for a user
 */
void invalidate_session_by_user(int user_id) {
    for (int i = 0; i < g_session_count; i++) {
        if (g_sessions[i].user_id == user_id) {
            g_sessions[i].is_valid = 0;
        }
    }
}

/**
 * Generate random token
 *
 * @param token Output buffer (at least 65 bytes)
 */
void generate_random_token(char *token) {
    const char charset[] = "abcdef0123456789";

    srand(time(NULL) ^ getpid());

    for (int i = 0; i < 64; i++) {
        token[i] = charset[rand() % 16];
    }
    token[64] = '\0';
}
