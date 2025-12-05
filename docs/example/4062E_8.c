#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <string.h>

typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;

SOCKADDR_IN g_caddr[1024] = { 0 };
int g_count = 0;

int main()
{
    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(6000);
    saddr.sin_addr.s_addr = inet_addr("0.0.0.0");
    int s = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (bind(s, (SOCKADDR*)&saddr, sizeof(SOCKADDR)) == 0)
    {
        while (0 == 0)
        {
            SOCKADDR_IN caddr;
            int clen = sizeof(SOCKADDR_IN);
            char buffer[104] = { 0 };
            printf("Receiving...\n");
            int received = recvfrom(s, buffer, sizeof(buffer) - 1, 0, (SOCKADDR*)&caddr, &clen);
            printf("Received %d bytes from %s: %s\n", received, inet_ntoa(caddr.sin_addr), buffer);
            int found = 0;
            for (int i = 0;i < g_count;i++)
            {
                if (g_caddr[i].sin_addr.s_addr == caddr.sin_addr.s_addr)
                {
                    found = 1;
                    break;
                }
            }

            if (found == 0)
            {
                memcpy(&g_caddr[g_count], &caddr, sizeof(SOCKADDR));
                g_count++;
            }

            for (int i = 0;i < g_count;i++)
            {
                if (g_caddr[i].sin_addr.s_addr != caddr.sin_addr.s_addr)
                {
                    sendto(s, buffer, strlen(buffer), 0, (SOCKADDR*)&g_caddr[i], sizeof(SOCKADDR));
                }
            }
        }
    }else
    {
        close(s);
    }
}