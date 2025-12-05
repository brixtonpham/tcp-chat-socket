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
#include <dirent.h>
#include <string.h>

typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;

void Append(char** des, const char* str)
{
    char* tmp = *des;
    int curLen = tmp == NULL ? 0 : strlen(tmp);
    int newLen = curLen + strlen(str) + 1;
    tmp = (char*)realloc(tmp, newLen * sizeof(char));
    sprintf(tmp + curLen, "%s", str);
    *des = tmp;
}

int Compare(const struct dirent** a, const struct dirent** b)
{
    if (a[0]->d_type == b[0]->d_type)
    {
        return strcmp(a[0]->d_name, b[0]->d_name);
    }else
    {
        if (a[0]->d_type == DT_DIR)
        {
            return -1;
        }else
            return 1;
    }
}

char* CreateHTML(const char* path)
{   
    char* output = NULL;
    struct dirent** pResult = NULL;
    int n = scandir(path, &pResult, NULL, Compare);
    Append(&output, "<html>");
    int i = 0;
    for (i = 0;i < n;i++)
    {
        if (pResult[i]->d_type == DT_DIR)
        {
            Append(&output,"<a href=\"");
            Append(&output, pResult[i]->d_name);
            Append(&output,"\"><b>");
            Append(&output, pResult[i]->d_name);
            Append(&output, "</b></a><br>");
        }else
        {
            Append(&output,"<a href=\"");
            Append(&output, pResult[i]->d_name);
            Append(&output,"\"><i>");
            Append(&output, pResult[i]->d_name);
            Append(&output, "</i></a><br>");
        }
    }
    Append(&output,"</html>");
    
    return output;
}

void* ClientThread(void* arg)
{
    int c = *((int*)arg);
    free(arg);
    arg = NULL;
    
    char* headers = NULL;
    int len = 0;
    while (headers == NULL || strstr(headers,"\r\n\r\n") == NULL)
    {
        char chr = 0;
        int r = recv(c, &chr, 1, 0);
        if (r > 0)
        {
            headers = (char*)realloc(headers, len + 1);
            headers[len++] = chr;
        }else
            break;
    }
    printf("%s\n", headers);

    char request[1024] = { 0 };
    char path[1024] = { 0 };
    sscanf(headers, "%s%s", request, path);
    free(headers);
    headers = NULL;
    
    if (strcmp(request,"GET") == 0)
    {
        if (strstr(path,"favicon.ico") != NULL)
        {
            char response[1024] = { 0 };
            sprintf(response,"HTTP/1.1 404 NOT FOUND\r\n\r\n");
            send(c, response, strlen(response), 0);
            close(c);
        }else
        {
            char* html = CreateHTML(path);
            char response[1024] = { 0 };
            sprintf(response,"HTTP/1.1 200 OK\r\nContent-Length: %d\r\nContent-Type: text/html\r\n\r\n", (int)strlen(html));
            send(c, response, strlen(response), 0);
            send(c, html, strlen(html), 0);
            close(c);
            free(html);
            html = NULL;
        }
    }

    return NULL;
}

int main()
{
    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(9999);
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
}