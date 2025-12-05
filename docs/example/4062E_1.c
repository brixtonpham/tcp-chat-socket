#include <stdio.h>
#include <malloc.h>
#include <string.h>

char* output = NULL;

void Append(char** des, const char* str)
{
    char* tmp = *des;
    int curLen = tmp == NULL ? 0 : strlen(tmp);
    int newLen = curLen + strlen(str) + 1;
    tmp = (char*)realloc(tmp, newLen * sizeof(char));
    sprintf(tmp + strlen(tmp), "%s", str);
    *des = tmp;
}

int main()
{
    Append(&output, "Hello ");
    Append(&output, "World ");
    Append(&output, "IT4062E!");
    
    printf("%s\n", output);

    free(output);
    output = NULL;
}