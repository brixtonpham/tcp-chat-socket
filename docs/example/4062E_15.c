#include <stdio.h>
#include <threads.h>
#include <pthread.h>
#include <malloc.h>
#include <time.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <arpa/inet.h>
#include <string.h>
#include <stdlib.h>
#include <signal.h>
#include <sys/wait.h>
#include <sys/time.h>
typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;
pthread_mutex_t *pMutex = NULL;

void* ClientThread(void* arg)
{
    int c = *((int*)arg);
    free(arg);
    arg = NULL;
    while (0 == 0)
    {
        char buffer[1024] = { 0 };
        recv(c, buffer, sizeof(buffer) - 1, 0);
        while (buffer[strlen(buffer) - 1] == '\n' || buffer[strlen(buffer) - 1] == '\r')
        {
            buffer[strlen(buffer) - 1] = 0;
        }
        char command[2048] = { 0 };
        pthread_mutex_lock(pMutex);
        sprintf(command,"%s > out.txt", buffer);
        system(command);
        FILE* f = fopen("out.txt", "rt");
        while (!feof(f))
        {
            memset(buffer, 0, sizeof(buffer));
            fgets(buffer, sizeof(buffer) - 1, f);
            send(c, buffer, strlen(buffer), 0);
        }
        fclose(f);
        pthread_mutex_unlock(pMutex);
    }
    return NULL;
}

int main()
{
    pMutex = (pthread_mutex_t*)calloc(1, sizeof(pthread_mutex_t));
    pthread_mutex_init(pMutex, NULL);

    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(8888);
    saddr.sin_addr.s_addr = 0;
    int s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (bind(s, (SOCKADDR*)&saddr, sizeof(SOCKADDR)) == 0)
    {
        listen(s, 10);
        while (0 == 0)
        {
            int c = accept(s, NULL, 0);
            int* arg = (int*)calloc(1, sizeof(int));
            *arg = c;
            pthread_t tid = 0;
            pthread_create(&tid, NULL, ClientThread, arg);
        }
    }else
    {
        printf("Failed to bind\n");
    }
    close(s);
    pthread_mutex_destroy(pMutex);
    free(pMutex);
    pMutex = NULL;
}