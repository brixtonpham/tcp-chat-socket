#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <string.h>
#include <stdlib.h>

typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;

int main()
{
    int s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(8888);
    saddr.sin_addr.s_addr = inet_addr("0.0.0.0");
    if (bind(s, (SOCKADDR*)&saddr, sizeof(SOCKADDR)) == 0)
    {
        listen(s, 10);
        SOCKADDR_IN caddr;
        int clen = sizeof(SOCKADDR_IN);
        while (0 == 0)
        {
            printf("Parent: waiting for a connection.\n");
            int d = accept(s, (SOCKADDR*)&caddr, &clen);
            if (fork() == 0)
            {
                close(s);
                while (0 == 0)
                {
                    char buffer[1024] = { 0 };
                    printf("Child: waiting for data.\n");
                    int received = recv(d, buffer, sizeof(buffer) - 1, 0);
                    if (received <= 0)
                    {
                        printf("Client disconnected.\n");
                        close(d);
                        break;
                    }else{
                        printf("Received %d bytes from IP %s: %s\n", received, inet_ntoa(caddr.sin_addr), buffer);
                        send(d, buffer, strlen(buffer), 0);
                        if (strstr(buffer,"bye") != NULL)
                        {
                            close(d);
                            break;
                        }
                    }
                }
                exit(0);
            }

            close(d);
        }
    }else
    {
        printf("Failed to bind!\n");
        close(s);
    }
}