#include "logger.h"

/**
 * Log activity to file
 *
 * Log format: [timestamp] User=user_id Event=event_type Data=event_data
 *
 * @param user_id User ID (0 for system events)
 * @param event_type Event type (see LOG_* constants)
 * @param event_data Additional event data
 */
void log_activity(int user_id, const char *event_type, const char *event_data) {
    FILE *f = fopen(LOG_FILE, "a");
    if (f == NULL) {
        perror("Failed to open log file");
        return;
    }

    time_t now = time(NULL);
    char time_str[30];
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&now));

    fprintf(f, "[%s] User=%d Event=%s Data=%s\n",
            time_str, user_id, event_type, event_data);

    fclose(f);
}

/**
 * Log error message
 */
void log_error(const char *message) {
    FILE *f = fopen(LOG_FILE, "a");
    if (f == NULL) {
        perror("Failed to open log file");
        return;
    }

    time_t now = time(NULL);
    char time_str[30];
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&now));

    fprintf(f, "[%s] ERROR: %s\n", time_str, message);

    fclose(f);

    // Also print to stderr
    fprintf(stderr, "[ERROR] %s\n", message);
}

/**
 * Log info message
 */
void log_info(const char *message) {
    FILE *f = fopen(LOG_FILE, "a");
    if (f == NULL) {
        perror("Failed to open log file");
        return;
    }

    time_t now = time(NULL);
    char time_str[30];
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&now));

    fprintf(f, "[%s] INFO: %s\n", time_str, message);

    fclose(f);

    // Also print to stdout
    printf("[INFO] %s\n", message);
}
