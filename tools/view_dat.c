#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "server.h"

void print_user(User *u) {
    char time_buf[64];
    struct tm *tm_info;

    printf("User ID: %d\n", u->user_id);
    printf("Username: %s\n", u->username);
    printf("Email: %s\n", u->email);
    printf("Status: %s\n", u->status);
    
    tm_info = localtime(&u->created_at);
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);
    printf("Created: %s\n", time_buf);

    if (u->last_login > 0) {
        tm_info = localtime(&u->last_login);
        strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);
        printf("Last Login: %s\n", time_buf);
    } else {
        printf("Last Login: Never\n");
    }
    printf("----------------------------------------\n");
}

void print_friendship(Friendship *f) {
    char time_buf[64];
    struct tm *tm_info;

    printf("ID: %d\n", f->id);
    printf("User ID: %d <-> Friend ID: %d\n", f->user_id, f->friend_id);
    printf("Status: %s\n", f->status);

    tm_info = localtime(&f->created_at);
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);
    printf("Created: %s\n", time_buf);
    
    tm_info = localtime(&f->updated_at);
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);
    printf("Updated: %s\n", time_buf);
    printf("----------------------------------------\n");
}

void print_group(Group *g) {
    char time_buf[64];
    struct tm *tm_info;

    printf("Group ID: %d\n", g->group_id);
    printf("Name: %s\n", g->name);
    printf("Description: %s\n", g->description);
    printf("Created By: %d\n", g->created_by);

    tm_info = localtime(&g->created_at);
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);
    printf("Created: %s\n", time_buf);
    printf("----------------------------------------\n");
}

void print_message(Message *m) {
    char time_buf[64];
    struct tm *tm_info;

    printf("Message ID: %d\n", m->message_id);
    printf("Sender ID: %d\n", m->sender_id);
    printf("Recipient ID: %d\n", m->recipient_id);
    printf("Content: %s\n", m->content);
    printf("Delivered: %d, Read: %d\n", m->delivered, m->read);

    tm_info = localtime(&m->sent_at);
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);
    printf("Sent: %s\n", time_buf);
    printf("----------------------------------------\n");
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        printf("Usage: %s <file_path> <type>\n", argv[0]);
        printf("Types: user, friend, group, message\n");
        return 1;
    }

    const char *file_path = argv[1];
    const char *type = argv[2];

    FILE *f = fopen(file_path, "rb");
    if (!f) {
        perror("Failed to open file");
        return 1;
    }

    printf("Reading %s as %s...\n", file_path, type);
    printf("----------------------------------------\n");

    if (strcmp(type, "user") == 0) {
        User u;
        while (fread(&u, sizeof(User), 1, f) == 1) {
            print_user(&u);
        }
    } else if (strcmp(type, "friend") == 0) {
        Friendship fr;
        while (fread(&fr, sizeof(Friendship), 1, f) == 1) {
            print_friendship(&fr);
        }
    } else if (strcmp(type, "group") == 0) {
        Group g;
        int group_count = 0;
        printf("WARNING: groups.dat format is mixed (Groups then Members).\n");
        printf("--- GROUPS ---\n");
        while (fread(&g, sizeof(Group), 1, f) == 1) {
            print_group(&g);
            group_count++;
        }
        
        // Try to read members
        // The previous loop likely consumed some member bytes trying to find another group
        // Reset position to just after the last valid group
        long member_start_pos = (long)group_count * sizeof(Group);
        fseek(f, member_start_pos, SEEK_SET);
        
        printf("--- GROUP MEMBERS ---\n");
        GroupMember gm;
        while (fread(&gm, sizeof(GroupMember), 1, f) == 1) {
            printf("Group ID: %d, User ID: %d, Role: %s\n", 
                   gm.group_id, gm.user_id, gm.role);
        }
    } else if (strcmp(type, "message") == 0) {
        Message m;
        while (fread(&m, sizeof(Message), 1, f) == 1) {
            print_message(&m);
        }
    } else {
        printf("Unknown type: %s\n", type);
        fclose(f);
        return 1;
    }

    fclose(f);
    return 0;
}
