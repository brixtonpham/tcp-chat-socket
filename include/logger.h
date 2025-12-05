#ifndef LOGGER_H
#define LOGGER_H

#include "common.h"

// Activity log structure
typedef struct {
    time_t timestamp;
    int user_id;
    char event_type[50];
    char event_data[256];
    char client_ip[46];
} ActivityLog;

// Logging functions
void log_activity(int user_id, const char *event_type, const char *event_data);
void log_error(const char *message);
void log_info(const char *message);

// Event types
#define LOG_REGISTER        "REGISTER"
#define LOG_LOGIN           "LOGIN"
#define LOG_LOGIN_FAIL      "LOGIN_FAIL"
#define LOG_LOGOUT          "LOGOUT"
#define LOG_CHAT_SEND       "CHAT_SEND"
#define LOG_GROUP_MSG       "GROUP_MSG"
#define LOG_FRIEND_REQUEST  "FRIEND_REQUEST"
#define LOG_FRIEND_ACCEPT   "FRIEND_ACCEPT"
#define LOG_FRIEND_REJECT   "FRIEND_REJECT"
#define LOG_FRIEND_REMOVE   "FRIEND_REMOVE"
#define LOG_GROUP_CREATE    "GROUP_CREATE"
#define LOG_GROUP_JOIN      "GROUP_JOIN"
#define LOG_GROUP_LEAVE     "GROUP_LEAVE"
#define LOG_GROUP_INVITE    "GROUP_INVITE"
#define LOG_CONNECT         "CONNECT"
#define LOG_DISCONNECT      "DISCONNECT"
#define LOG_ERROR           "ERROR"

#endif // LOGGER_H
