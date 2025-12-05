#ifndef MESSAGE_H
#define MESSAGE_H

#include "common.h"

// Message structure
typedef struct {
    int message_id;
    int sender_id;
    int recipient_id;           // Positive for user, negative for group
    char content[MAX_PAYLOAD];
    time_t sent_at;
    int delivered;
    int read;
} Message;

// Offline queue structure
typedef struct {
    int queue_id;
    int message_id;
    int recipient_id;
    time_t queued_at;
    int delivered;
} OfflineQueue;

// Global message data
extern Message g_messages[MAX_MESSAGES];
extern int g_message_count;
extern OfflineQueue g_offline_queue[MAX_OFFLINE_QUEUE];
extern int g_offline_count;

// Message management functions
int load_messages_from_file(void);
int save_messages_to_file(void);
Message* get_message_by_id(int message_id);
int create_message(int sender_id, int recipient_id, const char *content);
void queue_offline_message(Message *msg);
void queue_offline_group_message(int recipient_id, Message *msg);

#endif // MESSAGE_H
