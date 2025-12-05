#ifndef PROTOCOL_H
#define PROTOCOL_H

#include "common.h"

// Message header size: 4 bytes (length) + 2 bytes (type) = 6 bytes
#define HEADER_SIZE 6

// Message types - Authentication (0x01-0x0F)
#define MSG_REGISTER        0x01
#define MSG_REGISTER_ACK    0x02
#define MSG_LOGIN           0x03
#define MSG_LOGIN_ACK       0x04
#define MSG_LOGOUT          0x05
#define MSG_LOGOUT_ACK      0x06

// Message types - Friends (0x20-0x2F)
#define MSG_FRIEND_REQUEST      0x20
#define MSG_FRIEND_REQUEST_ACK  0x21
#define MSG_FRIEND_ACCEPT       0x22
#define MSG_FRIEND_ACCEPT_ACK   0x23
#define MSG_FRIEND_REJECT       0x24
#define MSG_FRIEND_REJECT_ACK   0x25
#define MSG_FRIEND_REMOVE       0x26
#define MSG_FRIEND_REMOVE_ACK   0x27
#define MSG_FRIEND_LIST         0x28
#define MSG_FRIEND_LIST_RSP     0x29
#define MSG_FRIEND_NOTIFY       0x2A
#define MSG_STATUS_NOTIFY       0x2B

// Message types - Chat (0x30-0x3F)
#define MSG_CHAT_SEND       0x30
#define MSG_CHAT_DELIVER    0x31
#define MSG_CHAT_ACK        0x32

// Message types - Groups (0x40-0x4F)
#define MSG_GROUP_CREATE        0x40
#define MSG_GROUP_CREATE_ACK    0x41
#define MSG_GROUP_INVITE        0x42
#define MSG_GROUP_INVITE_ACK    0x43
#define MSG_GROUP_JOIN          0x44
#define MSG_GROUP_JOIN_ACK      0x45
#define MSG_GROUP_LEAVE         0x46
#define MSG_GROUP_LEAVE_ACK     0x47
#define MSG_GROUP_REMOVE_USER   0x48
#define MSG_GROUP_REMOVE_ACK    0x49
#define MSG_GROUP_MSG           0x4A
#define MSG_GROUP_MSG_DELIVER   0x4B
#define MSG_GROUP_LIST          0x4C
#define MSG_GROUP_LIST_RSP      0x4D

// Message types - System (0xF0-0xFF)
#define MSG_ERROR           0xF0
#define MSG_HEARTBEAT       0xFE
#define MSG_HEARTBEAT_ACK   0xFF

// Protocol functions
int send_message(int sockfd, uint16_t type, const char *data, int data_len);
int recv_message(int sockfd, uint16_t *type, char *buffer, int *msg_len);

#endif // PROTOCOL_H
