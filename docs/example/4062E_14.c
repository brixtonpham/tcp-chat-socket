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
typedef struct 
{
    SOCKADDR_IN addr;
    char file[1024];    
}ARG;

const short RRQ = 1;
const short WRQ = 2;
const short DATA = 3;
const short ACK = 4;
const short ERR = 5;

void* WriteThread(void* arg)
{
    SOCKADDR_IN caddr;
    memcpy(&caddr, &((ARG*)arg)->addr, sizeof(caddr));
    char file[1024] = { 0 };
    strcpy(file, ((ARG*)arg)->file);
    free(arg);
    arg = NULL;
    printf("Receiving file from: %s\n", inet_ntoa(caddr.sin_addr));
    int d = socket(AF_INET, SOCK_DGRAM,  IPPROTO_UDP);
    unsigned short block = 0;
    unsigned char data[1024] = { 0 };
    data[0] = (ACK >> 8) & 0xFF;
    data[1] = ACK & 0xFF;
    data[2] = (block >> 8) & 0xFF;
    data[3] = block & 0xFF;
    sendto(d, data, 4, 0, (SOCKADDR*)&caddr, sizeof(SOCKADDR));
    FILE* f = fopen(file, "wb");
    int mark[65536] = { 0 };
    while (0 == 0)
    {
        memset(data, 0, sizeof(data));
        int r = recvfrom(d, data, sizeof(data), 0, NULL, 0);
        if (r >= 4)
        {
            block = (data[2] << 8) | data[3];
            if (mark[block] == 0)
            {
                mark[block] = 1;
                printf("%d << 8 | %d\n", data[2], data[3]);
                printf("Receied %d bytes, block: %d\n", r, block);
                fwrite(data + 4, 1, r - 4, f);
            }
            memset(data, 0, sizeof(data));
            data[0] = (ACK >> 8) & 0xFF;
            data[1] = ACK & 0xFF;
            data[2] = (block >> 8) & 0xFF;
            data[3] = block & 0xFF;
            sendto(d, data, 4, 0, (SOCKADDR*)&caddr, sizeof(SOCKADDR));
            if (r < 516)
            {
                break;
            }
        }
    }
    fclose(f);
    printf("DONE\n");
}

void* ReadThread(void* arg)
{
    SOCKADDR_IN caddr;
    memcpy(&caddr, &((ARG*)arg)->addr, sizeof(caddr));
    char file[1024] = { 0 };
    strcpy(file, ((ARG*)arg)->file);
    free(arg);
    arg = NULL;
    printf("Serving file for: %s\n", inet_ntoa(caddr.sin_addr));
    int d = socket(AF_INET, SOCK_DGRAM,  IPPROTO_UDP);
    struct timeval tv;
    tv.tv_sec = 5;
    tv.tv_usec = 0;
    setsockopt(d, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    FILE* f = fopen(file, "rb");
    if (f != NULL)
    {
        unsigned short block = 1;
        int r = 0;
        while (!feof(f))
        {
            char data[516] = { 0 };
            data[0] = (DATA >> 8) & 0xFF;
            data[1] = DATA & 0xFF;
            data[2] = (block >> 8) & 0xFF;
            data[3] = block & 0xFF;
            r = fread(data + 4, 1, 512, f);
            int acked = 0;
            while (!acked)
            {
                sendto(d, data, r + 4, 0, (SOCKADDR*)&caddr, sizeof(caddr));
                char ack[1024] = { 0 };
                int tmp = recvfrom(d, ack, sizeof(ack), 0, NULL, 0 );
                if (tmp >= 4 && 
                    ACK ==      ((ack[0] << 8) | ack[1]) &&
                    block ==    ((ack[2] << 8) | ack[3]))
                {
                    acked = 1;
                    printf("ACKED: %d\n", block);
                }
            }
            block++;
        }
        if (r == 512)
        {
            char data[4] = { 0 };
            data[0] = (DATA >> 8) & 0xFF;
            data[1] = DATA & 0xFF;
            data[2] = (block >> 8) & 0xFF;
            data[3] = block & 0xFF;
            sendto(d, data, 4, 0, (SOCKADDR*)&caddr, sizeof(caddr));
        }
        fclose(f);
        close(d);
        printf("File sent!\n");
    }else
    {
        char err[1024] = { 0 };
        char* message = "FILE NOT FOUND";
        err[0] = (ERR >> 8) & 0xFF;
        err[1] = ERR & 0xFF;
        strcpy(err + 4, message);
        sendto(d, err, 2 + 2 + strlen(message) + 1, 0, (SOCKADDR*)&caddr, sizeof(caddr));
        close(d);
    }
    
    return NULL;
}

int main()
{
    int s = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(8888);
    saddr.sin_addr.s_addr = inet_addr("0.0.0.0");
    if (bind(s, (SOCKADDR*)&saddr, sizeof(SOCKADDR)) == 0)
    {
        while (0 == 0)
        {
            char data[1024] = { 0 };
            SOCKADDR_IN caddr;
            int clen = sizeof(caddr);
            int r = recvfrom(s, data, sizeof(data), 0, (SOCKADDR*)&caddr, &clen);
            if (r > 0)
            {
                short opcode = (data[0] << 8) | data[1];
                if (opcode == RRQ)
                {
                    ARG* arg = (ARG*)calloc(1, sizeof(ARG));
                    memcpy(&(arg->addr), &caddr, clen);
                    strcpy(arg->file, data + 2);
                    pthread_t tid = 0;
                    pthread_create(&tid, NULL, ReadThread, arg);
                }
                if (opcode == WRQ)
                {
                    ARG* arg = (ARG*)calloc(1, sizeof(ARG));
                    memcpy(&(arg->addr), &caddr, clen);
                    strcpy(arg->file, data + 2);
                    pthread_t tid = 0;
                    pthread_create(&tid, NULL, WriteThread, arg);
                }
            }
        }
    }else
        printf("Failed to bind!\n");
}