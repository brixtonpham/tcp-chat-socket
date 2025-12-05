#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

int main()
{
    for (int i = 0;i < 10;i++)
    {
        if (fork() == 0)
        {
            printf("Child: Hello World!\n");
            exit(0);
        }else
        {
            printf("Parent: Hello World!\n");
        }
    }
    fgetc(stdin);
}
