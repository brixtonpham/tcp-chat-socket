#include "group.h"
#include "logger.h"

// Global group data
Group g_groups[MAX_GROUPS];
int g_group_count = 0;
GroupMember g_group_members[MAX_GROUP_MEMBERS];
int g_group_member_count = 0;

/**
 * Load groups from file
 */
int load_groups_from_file(void) {
    FILE *f = fopen(GROUP_FILE, "rb");
    if (f == NULL) {
        return 0;
    }

    // Read groups
    g_group_count = fread(g_groups, sizeof(Group), MAX_GROUPS, f);

    // Read members
    g_group_member_count = fread(g_group_members, sizeof(GroupMember), MAX_GROUP_MEMBERS, f);

    fclose(f);

    printf("Loaded %d groups and %d members from file\n", g_group_count, g_group_member_count);
    return g_group_count;
}

/**
 * Save groups to file
 */
int save_groups_to_file(void) {
    FILE *f = fopen(GROUP_FILE, "wb");
    if (f == NULL) {
        perror("Failed to open group file for writing");
        return -1;
    }

    // Write groups
    fwrite(g_groups, sizeof(Group), g_group_count, f);

    // Write members
    fwrite(g_group_members, sizeof(GroupMember), g_group_member_count, f);

    fclose(f);

    return 0;
}

/**
 * Get group by ID
 */
Group* get_group_by_id(int group_id) {
    for (int i = 0; i < g_group_count; i++) {
        if (g_groups[i].group_id == group_id) {
            return &g_groups[i];
        }
    }
    return NULL;
}

/**
 * Create new group
 *
 * @return group_id on success, -1 on error
 */
int create_group(const char *name, const char *description, int creator_id) {
    if (g_group_count >= MAX_GROUPS) {
        return -1;
    }

    Group *group = &g_groups[g_group_count];
    group->group_id = g_group_count + 1;
    strncpy(group->name, name, sizeof(group->name) - 1);
    strncpy(group->description, description, sizeof(group->description) - 1);
    group->created_by = creator_id;
    group->created_at = time(NULL);

    g_group_count++;

    // Add creator as admin
    add_group_member(group->group_id, creator_id, "admin");

    save_groups_to_file();

    return group->group_id;
}

/**
 * Check if user is member of group
 *
 * @return 1 if member, 0 otherwise
 */
int is_group_member(int group_id, int user_id) {
    for (int i = 0; i < g_group_member_count; i++) {
        if (g_group_members[i].group_id == group_id &&
            g_group_members[i].user_id == user_id) {
            return 1;
        }
    }
    return 0;
}

/**
 * Check if user is admin of group
 *
 * @return 1 if admin, 0 otherwise
 */
int is_group_admin(int group_id, int user_id) {
    for (int i = 0; i < g_group_member_count; i++) {
        if (g_group_members[i].group_id == group_id &&
            g_group_members[i].user_id == user_id &&
            strcmp(g_group_members[i].role, "admin") == 0) {
            return 1;
        }
    }
    return 0;
}

/**
 * Add user to group
 *
 * @return 0 on success, -1 on error
 */
int add_group_member(int group_id, int user_id, const char *role) {
    if (g_group_member_count >= MAX_GROUP_MEMBERS) {
        return -1;
    }

    // Check if already member
    if (is_group_member(group_id, user_id)) {
        return -1;
    }

    GroupMember *member = &g_group_members[g_group_member_count];
    member->group_id = group_id;
    member->user_id = user_id;
    strncpy(member->role, role, sizeof(member->role) - 1);
    member->joined_at = time(NULL);

    g_group_member_count++;

    save_groups_to_file();

    return 0;
}

/**
 * Remove user from group
 *
 * @return 0 on success, -1 on error
 */
int remove_group_member(int group_id, int user_id) {
    for (int i = 0; i < g_group_member_count; i++) {
        if (g_group_members[i].group_id == group_id &&
            g_group_members[i].user_id == user_id) {

            // Mark as deleted
            g_group_members[i].group_id = -1;

            save_groups_to_file();
            return 0;
        }
    }
    return -1;
}

/**
 * Get list of group members
 *
 * @param group_id Group ID
 * @param member_ids Output array for member IDs
 * @param max_count Maximum number of members to return
 * @return Number of members found
 */
int get_group_members(int group_id, int *member_ids, int max_count) {
    int count = 0;

    for (int i = 0; i < g_group_member_count && count < max_count; i++) {
        if (g_group_members[i].group_id == group_id) {
            member_ids[count++] = g_group_members[i].user_id;
        }
    }

    return count;
}

/**
 * Update group member role
 *
 * @return 0 on success, -1 on error
 */
int update_group_member_role(int group_id, int user_id, const char *role) {
    for (int i = 0; i < g_group_member_count; i++) {
        if (g_group_members[i].group_id == group_id &&
            g_group_members[i].user_id == user_id) {
            
            strncpy(g_group_members[i].role, role, sizeof(g_group_members[i].role) - 1);
            save_groups_to_file();
            return 0;
        }
    }
    return -1;
}

/**
 * Get pending group invites for a user
 *
 * @param user_id User ID
 * @param group_ids Output array for group IDs
 * @param max_count Maximum number of groups to return
 * @return Number of invites found
 */
int get_group_invites(int user_id, int *group_ids, int max_count) {
    int count = 0;

    for (int i = 0; i < g_group_member_count && count < max_count; i++) {
        if (g_group_members[i].user_id == user_id &&
            strcmp(g_group_members[i].role, "invited") == 0) {
            
            // Check if group still exists
            if (get_group_by_id(g_group_members[i].group_id) != NULL) {
                group_ids[count++] = g_group_members[i].group_id;
            }
        }
    }

    return count;
}
