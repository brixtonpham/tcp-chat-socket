#include <stdio.h>
#include <threads.h>
#include <pthread.h>
#include <malloc.h>
#include <time.h>
#include <stdlib.h>
#include <unistd.h>

int K = 1000;
int N = 10;
int Sum = 0;
pthread_mutex_t* pMutex = NULL;

void* ThreadFunc(void* arg)
{
    int i = *(int*)arg;
    printf("%d\n", i);
    free(arg);
    arg = NULL;
    
    usleep(1000000);
    for (int j = i * K / N + 1;j <= (i + 1) * K / N;j++)
    {
        pthread_mutex_lock(pMutex);
        Sum += j;
        pthread_mutex_unlock(pMutex);
    }

    return NULL;
}

int main()
{
    pMutex = (pthread_mutex_t*)calloc(1, sizeof(pthread_mutex_t));
    pthread_mutex_init(pMutex, NULL);

    pthread_t* tid = (pthread_t*)calloc(N, sizeof(pthread_t));

    for (int i = 0;i < N;i++)
    {
        int* arg = (int*)calloc(1, sizeof(int));
        *arg = i;
        pthread_create(&tid[i], NULL, ThreadFunc, arg);
    }

    for (int i = 0;i < N;i++)
    {
        pthread_join(tid[i], NULL);
    }
    free(tid);
    tid = NULL;

    printf("%d\n", Sum);
}