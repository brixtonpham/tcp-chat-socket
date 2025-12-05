#include "protocol.h"

/**
 * Send message with length prefix
 *
 * Message format:
 * +--------+--------+--------+--------+...+--------+
 * |   LENGTH (4 bytes)      | TYPE(2)|   PAYLOAD   |
 * +--------+--------+--------+--------+...+--------+
 *
 * @param sockfd Socket file descriptor
 * @param type Message type
 * @param data Payload data
 * @param data_len Payload length
 * @return 0 on success, -1 on error
 */
int send_message(int sockfd, uint16_t type, const char *data, int data_len) {
    if (data_len > MAX_PAYLOAD) {
        fprintf(stderr, "Payload too large: %d > %d\n", data_len, MAX_PAYLOAD);
        return -1;
    }

    // Create buffer for header + payload
    char buffer[MAX_PAYLOAD + HEADER_SIZE];

    // Fill header
    uint32_t total_len = HEADER_SIZE + data_len;
    *(uint32_t*)buffer = htonl(total_len);          // Length (network byte order)
    *(uint16_t*)(buffer + 4) = htons(type);         // Type (network byte order)

    // Copy payload
    if (data && data_len > 0) {
        memcpy(buffer + HEADER_SIZE, data, data_len);
    }

    // Send all data (handle partial sends)
    int sent = 0;
    while (sent < (int)total_len) {
        int n = send(sockfd, buffer + sent, total_len - sent, 0);
        if (n <= 0) {
            if (n < 0) {
                perror("send() failed");
            }
            return -1;
        }
        sent += n;
    }

    return 0;
}

/**
 * Receive message with length prefix
 *
 * This function handles partial reads from TCP stream.
 * TCP does not guarantee message boundaries, so we must:
 * 1. Read header to get message length
 * 2. Read exact payload based on length
 *
 * @param sockfd Socket file descriptor
 * @param type Output: message type
 * @param buffer Output buffer for payload
 * @param msg_len Output: payload length
 * @return 0 on success, -1 on error
 */
int recv_message(int sockfd, uint16_t *type, char *buffer, int *msg_len) {
    // Step 1: Read header (6 bytes)
    char header[HEADER_SIZE];
    int received = 0;

    while (received < HEADER_SIZE) {
        int n = recv(sockfd, header + received, HEADER_SIZE - received, 0);
        if (n <= 0) {
            if (n < 0) {
                perror("recv() header failed");
            }
            return -1;  // Error or connection closed
        }
        received += n;
    }

    // Step 2: Parse header
    uint32_t total_len = ntohl(*(uint32_t*)header);
    *type = ntohs(*(uint16_t*)(header + 4));

    // Validate length
    if (total_len < HEADER_SIZE || total_len > MAX_PAYLOAD + HEADER_SIZE) {
        fprintf(stderr, "Invalid message length: %u\n", total_len);
        return -1;
    }

    // Step 3: Read payload
    *msg_len = total_len - HEADER_SIZE;
    received = 0;

    while (received < *msg_len) {
        int n = recv(sockfd, buffer + received, *msg_len - received, 0);
        if (n <= 0) {
            if (n < 0) {
                perror("recv() payload failed");
            }
            return -1;
        }
        received += n;
    }

    // Null-terminate for string operations
    buffer[*msg_len] = '\0';

    return 0;
}
