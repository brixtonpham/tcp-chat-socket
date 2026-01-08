#ifndef GROUP_H
#define GROUP_H

#include "common.h"

// Group structure
typedef struct {
    int group_id;
    char name[100];
    char description[256];
    int created_by;
    time_t created_at;
} Group;

// Group member structure
typedef struct {
    int group_id;
    int user_id;
    char role[20];              // "admin", "member"
    time_t joined_at;
} GroupMember;

// Global group data
extern Group g_groups[MAX_GROUPS];
extern int g_group_count;
extern GroupMember g_group_members[MAX_GROUP_MEMBERS];
extern int g_group_member_count;

// Group management functions
int load_groups_from_file(void);
int save_groups_to_file(void);
Group* get_group_by_id(int group_id);
int create_group(const char *name, const char *description, int creator_id);
int is_group_member(int group_id, int user_id);
int is_group_admin(int group_id, int user_id);
int add_group_member(int group_id, int user_id, const char *role);
int remove_group_member(int group_id, int user_id);
int get_group_members(int group_id, int *member_ids, int max_count);
int get_user_groups(int user_id, int *group_ids, int max_count);

#endif // GROUP_H
