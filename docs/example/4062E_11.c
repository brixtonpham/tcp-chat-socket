#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <string.h>
#include <stdlib.h>
#include <signal.h>
#include <sys/wait.h>

#define MY_SIGNAL SIGRTMIN + 1

typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;
int s = -1;
int g_sockets[1024] = { 0 };
int g_count = 0;
int parentid = 0;

void sig_handler(int sig)
{
    if (sig == SIGINT)
    {
        printf("CTRL+C - Prepare to exit\n");
        close(s);
        exit(0);
    }
    if (sig == SIGCHLD)
    {
        int statloc = 0;
        pid_t pid = wait(&statloc);
        printf("A child process has terminated: %d\n", pid);
    }
    if (sig == MY_SIGNAL)
    {
        printf("A child process has received some data.\n");
        SOCKADDR_IN tmpAddr;
        tmpAddr.sin_family = AF_INET;
        tmpAddr.sin_port = htons(9999);
        tmpAddr.sin_addr.s_addr = inet_addr("127.0.0.1");
        int tmpSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (bind(tmpSocket, (SOCKADDR*)&tmpAddr, sizeof(SOCKADDR)) == 0)
        {
            listen(tmpSocket, 10);
            int d = accept(tmpSocket, NULL, 0);
            char buffer[1024] = { 0 };
            recv(d, buffer, sizeof(buffer) - 1, 0 );
            int child = 0;
            sscanf(buffer,"%d", &child);

            for (int i = 0;i < g_count;i++)
            {
                if (g_sockets[i] != child)
                {
                    char* tmpBuffer = strstr(buffer," ") + 1;
                    send(g_sockets[i], tmpBuffer, strlen(tmpBuffer), 0);
                }
            }
            close(d);
            close(tmpSocket);
        }else
        {
            printf("Failed to bind.\n");
            close(tmpSocket);
        }
    }
}

int main()
{
    parentid = getpid();
    signal(SIGINT, sig_handler);
    signal(SIGCHLD, sig_handler);
    signal(MY_SIGNAL, sig_handler);

    s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(7777);
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
            g_sockets[g_count++] = d;
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
                        union sigval val;
                        val.sival_int = 0;
                        val.sival_ptr = 0;
                        sigqueue(parentid, MY_SIGNAL, val);
                        sleep(1);
                        int tmpSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
                        SOCKADDR_IN tmpAddr;
                        tmpAddr.sin_family = AF_INET;
                        tmpAddr.sin_port = htons(9999);
                        tmpAddr.sin_addr.s_addr = inet_addr("127.0.0.1");
                        connect(tmpSocket, (SOCKADDR*)&tmpAddr, sizeof(tmpAddr));
                        printf("Received %d bytes from IP %s: %s\n", received, inet_ntoa(caddr.sin_addr), buffer);
                        char data[2048] = { 0 };
                        sprintf(data, "%d %s", d, buffer);
                        send(tmpSocket, data, strlen(data), 0);
                        close(tmpSocket);
                        if (strstr(buffer,"bye") != NULL)
                        {
                            close(d);
                            break;
                        }
                    }
                }
                exit(0);
            }
        }
    }else
    {
        printf("Failed to bind!\n");
        close(s);
    }
}