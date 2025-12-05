#include "message.h"
#include "logger.h"

// Global message data
Message g_messages[MAX_MESSAGES];
int g_message_count = 0;
OfflineQueue g_offline_queue[MAX_OFFLINE_QUEUE];
int g_offline_count = 0;

/**
 * Load messages from file
 */
int load_messages_from_file(void) {
    FILE *f = fopen(MESSAGE_FILE, "rb");
    if (f == NULL) {
        return 0;
    }

    g_message_count = fread(g_messages, sizeof(Message), MAX_MESSAGES, f);
    fclose(f);

    printf("Loaded %d messages from file\n", g_message_count);
    return g_message_count;
}

/**
 * Save messages to file
 */
int save_messages_to_file(void) {
    FILE *f = fopen(MESSAGE_FILE, "wb");
    if (f == NULL) {
        perror("Failed to open message file for writing");
        return -1;
    }

    fwrite(g_messages, sizeof(Message), g_message_count, f);
    fclose(f);

    return 0;
}

/**
 * Get message by ID
 */
Message* get_message_by_id(int message_id) {
    for (int i = 0; i < g_message_count; i++) {
        if (g_messages[i].message_id == message_id) {
            return &g_messages[i];
        }
    }
    return NULL;
}

/**
 * Create new message
 *
 * @param sender_id Sender user ID
 * @param recipient_id Recipient (positive = user, negative = group)
 * @param content Message content
 * @return message_id on success, -1 on error
 */
int create_message(int sender_id, int recipient_id, const char *content) {
    if (g_message_count >= MAX_MESSAGES) {
        return -1;
    }

    Message *msg = &g_messages[g_message_count];
    msg->message_id = g_message_count + 1;
    msg->sender_id = sender_id;
    msg->recipient_id = recipient_id;
    strncpy(msg->content, content, sizeof(msg->content) - 1);
    msg->sent_at = time(NULL);
    msg->delivered = 0;
    msg->read = 0;

    g_message_count++;

    save_messages_to_file();

    return msg->message_id;
}

/**
 * Queue message for offline delivery
 */
void queue_offline_message(Message *msg) {
    if (g_offline_count >= MAX_OFFLINE_QUEUE) {
        log_error("Offline queue is full");
        return;
    }

    OfflineQueue *entry = &g_offline_queue[g_offline_count];
    entry->queue_id = g_offline_count + 1;
    entry->message_id = msg->message_id;
    entry->recipient_id = msg->recipient_id;
    entry->queued_at = time(NULL);
    entry->delivered = 0;

    g_offline_count++;
}

/**
 * Queue group message for offline delivery
 */
void queue_offline_group_message(int recipient_id, Message *msg) {
    if (g_offline_count >= MAX_OFFLINE_QUEUE) {
        log_error("Offline queue is full");
        return;
    }

    OfflineQueue *entry = &g_offline_queue[g_offline_count];
    entry->queue_id = g_offline_count + 1;
    entry->message_id = msg->message_id;
    entry->recipient_id = recipient_id;
    entry->queued_at = time(NULL);
    entry->delivered = 0;

    g_offline_count++;
}
