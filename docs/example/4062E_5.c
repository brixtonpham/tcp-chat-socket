#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <string.h>

typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;

int main()
{
    int d = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(8888);
    saddr.sin_addr.s_addr = inet_addr("172.20.32.1");
    int error = connect(d, (SOCKADDR*)&saddr, sizeof(SOCKADDR));
    if (error == 0)
    {
        while (0 == 0)
        {
            char buffer[1024] = { 0 };
            fgets(buffer, sizeof(buffer) - 1, stdin);
            send(d, buffer, strlen(buffer), 0);

            memset(buffer, 0, sizeof(buffer));
            int received = recv(d, buffer, sizeof(buffer) - 1, 0);
            if (received > 0)
            {
                printf("Received %d bytes: %s\n", received, buffer);
            }else
            {
                printf("Disconnected!\n");
                break;
            }
        }
        close(d);
    }else
    {
        printf("Failed to connect!\n");
    }
}