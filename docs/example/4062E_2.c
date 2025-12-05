#include <stdio.h>
#include <malloc.h>
#include <string.h>
#include <dirent.h>

char* output = NULL;
char* root = NULL;

void Append(char** des, const char* str)
{
    char* tmp = *des;
    int curLen = tmp == NULL ? 0 : strlen(tmp);
    int newLen = curLen + strlen(str) + 1;
    tmp = (char*)realloc(tmp, newLen * sizeof(char));
    sprintf(tmp + curLen, "%s", str);
    *des = tmp;
}

int sosanh(const struct dirent** a, const struct dirent** b)
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

int main()
{
    Append(&root,"/");
    
    while (0 == 0)
    {
        struct dirent** pResult = NULL;
        int n = scandir(root, &pResult, NULL, sosanh);
        Append(&output, "<html>");
        int i = 0;
        for (i = 0;i < n;i++)
        {
            printf("%s\n", pResult[i]->d_name);
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
        FILE* f = fopen("output.html","wb");
        fwrite(output, strlen(output), sizeof(char), f);
        fclose(f);
        free(output);
        output = NULL;

        char inp[1024] = { 0 };
        printf("Nhap ten mot thu muc: ");
        fgets(inp, sizeof(inp) - 1, stdin);
        inp[strlen(inp) - 1] = 0 ;
        
        for (i = 0;i < n;i++)
        {
            if (pResult[i]->d_type == DT_DIR && strcmp(pResult[i]->d_name, inp) == 0)
            {
                break;
            }
        }
        
        if (i < n)
        {
            Append(&root, inp);
            Append(&root, "/");
        }else
        {
            printf("Khong thay thu muc ban nhap!\n");
        }

        for (i = 0;i < n;i++)
        {
            free(pResult[i]);
        }
        free(pResult);
        pResult = NULL;
    }
}
