#include "friend.h"
#include "logger.h"

// Global friendship data
Friendship g_friendships[MAX_FRIENDSHIPS];
int g_friendship_count = 0;

/**
 * Load friendships from file
 */
int load_friendships_from_file(void) {
    FILE *f = fopen(FRIEND_FILE, "rb");
    if (f == NULL) {
        return 0;
    }

    g_friendship_count = fread(g_friendships, sizeof(Friendship), MAX_FRIENDSHIPS, f);
    fclose(f);

    printf("Loaded %d friendships from file\n", g_friendship_count);
    return g_friendship_count;
}

/**
 * Save friendships to file
 */
int save_friendships_to_file(void) {
    FILE *f = fopen(FRIEND_FILE, "wb");
    if (f == NULL) {
        perror("Failed to open friend file for writing");
        return -1;
    }

    fwrite(g_friendships, sizeof(Friendship), g_friendship_count, f);
    fclose(f);

    return 0;
}

/**
 * Find friendship (one direction)
 */
Friendship* find_friendship(int user_id, int friend_id) {
    for (int i = 0; i < g_friendship_count; i++) {
        if (g_friendships[i].user_id == user_id &&
            g_friendships[i].friend_id == friend_id &&
            g_friendships[i].status[0] != '\0') {
            return &g_friendships[i];
        }
    }
    return NULL;
}

/**
 * Find friendship (both directions)
 */
Friendship* find_friendship_bidirectional(int user_id, int friend_id) {
    for (int i = 0; i < g_friendship_count; i++) {
        if (g_friendships[i].status[0] == '\0') continue;

        if ((g_friendships[i].user_id == user_id && g_friendships[i].friend_id == friend_id) ||
            (g_friendships[i].user_id == friend_id && g_friendships[i].friend_id == user_id)) {
            return &g_friendships[i];
        }
    }
    return NULL;
}

/**
 * Check if two users are friends
 *
 * @return 1 if friends, 0 otherwise
 */
int are_friends(int user_id, int friend_id) {
    Friendship *f = find_friendship_bidirectional(user_id, friend_id);
    return (f != NULL && strcmp(f->status, "accepted") == 0);
}

/**
 * Get list of friends
 *
 * @param user_id User ID
 * @param friend_ids Output array for friend IDs
 * @param max_count Maximum number of friends to return
 * @return Number of friends found
 */
int get_friends(int user_id, int *friend_ids, int max_count) {
    int count = 0;

    for (int i = 0; i < g_friendship_count && count < max_count; i++) {
        if (strcmp(g_friendships[i].status, "accepted") != 0) {
            continue;
        }

        if (g_friendships[i].user_id == user_id) {
            friend_ids[count++] = g_friendships[i].friend_id;
        } else if (g_friendships[i].friend_id == user_id) {
            friend_ids[count++] = g_friendships[i].user_id;
        }
    }

    return count;
}

/**
 * Create friendship request
 *
 * @return friendship ID on success, -1 on error
 */
int create_friendship(int user_id, int friend_id) {
    if (g_friendship_count >= MAX_FRIENDSHIPS) {
        return -1;
    }

    // Check if already exists
    if (find_friendship_bidirectional(user_id, friend_id) != NULL) {
        return -1;
    }

    Friendship *f = &g_friendships[g_friendship_count];
    f->id = g_friendship_count + 1;
    f->user_id = user_id;
    f->friend_id = friend_id;
    strcpy(f->status, "pending");
    f->created_at = time(NULL);
    f->updated_at = time(NULL);

    g_friendship_count++;

    save_friendships_to_file();

    return f->id;
}

/**
 * Update friendship status
 *
 * @return 0 on success, -1 on error
 */
int update_friendship_status(int user_id, int friend_id, const char *status) {
    Friendship *f = find_friendship(user_id, friend_id);
    if (f == NULL) {
        return -1;
    }

    strncpy(f->status, status, sizeof(f->status) - 1);
    f->updated_at = time(NULL);

    save_friendships_to_file();

    return 0;
}

/**
 * Remove friendship
 *
 * @return 0 on success, -1 on error
 */
int remove_friendship(int user_id, int friend_id) {
    Friendship *f = find_friendship_bidirectional(user_id, friend_id);
    if (f == NULL) {
        return -1;
    }

    // Mark as deleted
    f->status[0] = '\0';
    f->updated_at = time(NULL);

    save_friendships_to_file();

    return 0;
}
