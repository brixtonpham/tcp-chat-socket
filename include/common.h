#ifndef COMMON_H
#define COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <stdint.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <errno.h>

// Common constants
#define MAX_CLIENTS 1024
#define MAX_USERS 1000
#define MAX_SESSIONS 1000
#define MAX_FRIENDSHIPS 10000
#define MAX_GROUPS 1000
#define MAX_GROUP_MEMBERS 10000
#define MAX_MESSAGES 100000
#define MAX_OFFLINE_QUEUE 50000

#define PORT 8888
#define BUFFER_SIZE 4096
#define MAX_PAYLOAD 4000

// File paths
#define USER_FILE "data/users.dat"
#define FRIEND_FILE "data/friends.dat"
#define GROUP_FILE "data/groups.dat"
#define MESSAGE_FILE "data/messages.dat"
#define LOG_FILE "logs/server.log"

// Typedefs for convenience
typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;

#endif // COMMON_H
