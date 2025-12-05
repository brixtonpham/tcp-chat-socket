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
    int s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    SOCKADDR_IN saddr, caddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(8888); //{(8888 & 0xFF) << 8} | {(8888 & 0xFF00) >> 8}
    saddr.sin_addr.s_addr = inet_addr("0.0.0.0");
    int error = bind(s, (SOCKADDR*)&saddr, sizeof(SOCKADDR_IN));
    if (error == 0)
    {
        listen(s, 10);
        int clen = sizeof(SOCKADDR_IN);
        int d = accept(s, (SOCKADDR*)&caddr, &clen);
        if (d > 0)
        {
            printf("Connection from: %s.\n", inet_ntoa(caddr.sin_addr));
            char* welcom = "Hello my first TCP Server!\n";
            int sent = send(d, welcom, strlen(welcom), 0);
            printf("Sent: %d bytes!\n", sent);
            char buffer[1024] = { 0 };
            int received = recv(d, buffer, sizeof(buffer) - 1, 0);
            printf("Received: %d bytes: %s!\n", received, buffer);
            close(d);
        }
        close(s);
    }else
    {
        printf("Failed to bind!\n");
        close(s);
    }
}