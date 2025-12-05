#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>

int main(int argc, char** argv)
{
    if (argc >= 3)
    {
        struct addrinfo* pResult = NULL;
        struct addrinfo* pTmp = NULL;
        const char* domain = argv[1];
        const char* service = argv[2];
        getaddrinfo(domain, service, NULL, &pResult);
        pTmp = pResult;
        while (pTmp != NULL)
        {
            if (pTmp->ai_family == AF_INET)
            {
                struct sockaddr_in* pAddr = (struct sockaddr_in*)pTmp->ai_addr;
                char* ipStr = inet_ntoa(pAddr->sin_addr);
                printf("%s:%d\n", ipStr, ntohs(pAddr->sin_port));
                break;
            }
            pTmp = pTmp->ai_next;
        }

        int s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        int error = connect(s, pTmp->ai_addr, sizeof(struct sockaddr));
        if (error == 0)
        {
            printf("Connected!\n");
            char* welcome = "HELLO\r\n\r\n";
            send(s, welcome, strlen(welcome), 0);
            char buffer[1024] = { 0 };
            recv(s, buffer, sizeof(buffer) - 1, 0);
            close(s);
            printf("Received: %s\n", buffer);
        }else
        {
            printf("Failed to connect!\n");
        }
        freeaddrinfo(pResult);
        pResult = NULL;
    }else
    {
        printf("Parameter missing!\n");
    }
}