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
    int s = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    int d = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    SOCKADDR_IN daddr;
    daddr.sin_family = AF_INET;
    daddr.sin_port = htons(6000);
    daddr.sin_addr.s_addr = inet_addr("0.0.0.0");
    if (bind(d, (SOCKADDR*)&daddr, sizeof(SOCKADDR)) == 0)
    {
        while (0 == 0)
        {
            printf("Type something...\n");
            char buffer[1024] = { 0 };
            fgets(buffer, sizeof(buffer) - 1, stdin);
            SOCKADDR_IN saddr;
            saddr.sin_family = AF_INET;
            saddr.sin_port = htons(5000);
            saddr.sin_addr.s_addr = inet_addr("127.0.0.1");
            int sent = sendto(s, buffer, strlen(buffer), 0, (SOCKADDR*)&saddr, sizeof(SOCKADDR));
            printf("Sent: %d bytes\n", sent);
            printf("Receiving...\n");
            memset(buffer, 0, sizeof(buffer));


            SOCKADDR_IN caddr;
            int clen = sizeof(SOCKADDR_IN);
            int received = recvfrom(d, buffer, sizeof(buffer) - 1, 0, (SOCKADDR*)&caddr, &clen);
            printf("Received %d bytes: %s\n", received, buffer);
        }
    }else
    {
        close(s);
        close(d);
    }
}