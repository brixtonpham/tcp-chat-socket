#ifndef FRIEND_H
#define FRIEND_H

#include "common.h"

// Friendship structure
typedef struct {
    int id;
    int user_id;                // Sender of friend request
    int friend_id;              // Receiver of friend request
    char status[20];            // "pending", "accepted", "rejected", "blocked"
    time_t created_at;
    time_t updated_at;
} Friendship;

// Global friendship data
extern Friendship g_friendships[MAX_FRIENDSHIPS];
extern int g_friendship_count;

// Friendship management functions
int load_friendships_from_file(void);
int save_friendships_to_file(void);
Friendship* find_friendship(int user_id, int friend_id);
Friendship* find_friendship_bidirectional(int user_id, int friend_id);
int are_friends(int user_id, int friend_id);
int get_friends(int user_id, int *friend_ids, int max_count);
int create_friendship(int user_id, int friend_id);
int update_friendship_status(int user_id, int friend_id, const char *status);
int remove_friendship(int user_id, int friend_id);

#endif // FRIEND_H
