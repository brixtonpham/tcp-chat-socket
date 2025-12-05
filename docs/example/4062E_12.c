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
typedef char STRING[32];

typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;
int parentid = 0;

STRING g_names[1024] = { 0 };
int g_count = 0;

void sig_handler(int sig)
{
    if (sig == SIGCHLD)
    {
        int statloc = 0;
        pid_t pid = wait(&statloc);
        printf("A child process has terminated: %d\n", pid);
    }
    if (sig == MY_SIGNAL)
    {
        printf("A child process has received some data.\n");
        SOCKADDR_IN addr1;
        addr1.sin_family = AF_INET;
        addr1.sin_port = htons(10000);
        addr1.sin_addr.s_addr = inet_addr("127.0.0.1");
        int s1 = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (bind(s1, (SOCKADDR*)&addr1, sizeof(SOCKADDR)) == 0)
        {
            char buffer[1024] = { 0 };
            recvfrom(s1, buffer, sizeof(buffer) - 1, 0, NULL, 0);
            close(s1);

            int i = 0;
            for (i = 0;i < g_count;i++)
            {
                if (strcmp(g_names[i], buffer + 4) == 0)
                {
                    break;
                }
            }    
            if (i == g_count)
            {
                strcpy(g_names[g_count++], buffer + 4);
                printf("A new client added: %s\n", buffer + 4);
            }else
                printf("This client is already in the list.\n");

        }else
            printf("Failed to bind to port 10000.\n");
    }
}

void RemoveENTER(char* str)
{
    while (str[strlen(str) - 1] == '\r' || str[strlen(str) - 1] == '\n')
    {
        str[strlen(str) - 1] = 0;
    }
}

int main()
{
    parentid = getpid();
    signal(SIGCHLD, sig_handler);
    signal(MY_SIGNAL, sig_handler);

    if (fork() == 0)
    {
        SOCKADDR_IN addr1;
        addr1.sin_family = AF_INET;
        addr1.sin_port = htons(5000);
        addr1.sin_addr.s_addr = inet_addr("0.0.0.0");
        int s1 = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (bind(s1, (SOCKADDR*)&addr1, sizeof(SOCKADDR)) == 0)
        {
            while (0 == 0)
            {
                char buffer[1024] = { 0 };
                int received = recvfrom(s1, buffer, sizeof(buffer) - 1, 0, NULL, 0);
                RemoveENTER(buffer);

                printf("Received %d bytes: %s\n", received, buffer);
                if (strncmp(buffer, "REG ", 4) == 0)
                {
                    union sigval v;
                    v.sival_int = 0;
                    v.sival_ptr = NULL;
                    sigqueue(parentid, MY_SIGNAL, v);
                    usleep(100000);
                    int s3 = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
                    SOCKADDR_IN addr3;
                    addr3.sin_family = AF_INET;
                    addr3.sin_port = htons(10000);
                    addr3.sin_addr.s_addr = inet_addr("127.0.0.1");
                    sendto(s3, buffer, strlen(buffer), 0, (SOCKADDR*)&addr3, sizeof(SOCKADDR));
                    close(s3);
                }
            }
        }else
        {
            printf("Failed to bind to port 5000.\n");
        }    
        exit(0);
    }

    int s2 = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    SOCKADDR_IN addr2;
    addr2.sin_family = AF_INET;
    addr2.sin_port = htons(6000);
    addr2.sin_addr.s_addr = inet_addr("0.0.0.0");
    if (bind(s2, (SOCKADDR*)&addr2, sizeof(SOCKADDR)) == 0)
    {
        while (0 == 0)
        {
            char buffer[1024] = { 0 };
            SOCKADDR_IN caddr;
            int clen = sizeof(SOCKADDR);
            int received = recvfrom(s2, buffer, sizeof(buffer) - 1, 0, (SOCKADDR*)&caddr, &clen);
            RemoveENTER(buffer);
            printf("Received %d bytes: %s\n", received, buffer);

            if (strcmp(buffer,"LIST") == 0)
            {
                memset(buffer, 0, sizeof(buffer));
                if (g_count == 0)
                {
                    printf("Empty list!\n");
                    sprintf(buffer,"LIST %d", g_count);
                }else
                {
                    
                    sprintf(buffer,"LIST %d", g_count);
                    for (int i = 0;i < g_count;i++)
                    {
                        sprintf(buffer + strlen(buffer), " %s", g_names[i]);
                    }
                }
                sendto(s2, buffer, strlen(buffer), 0, (SOCKADDR*)&caddr, sizeof(SOCKADDR));
            }
        }
    }else
    {
        printf("Failed to bind to port 6000.\n");
    }
}

