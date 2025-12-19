import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups';
import { useAuthStore } from '../../store/authStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, UserMinus } from 'lucide-react';
import type { GroupMember, Group } from '../../types';

interface GroupMemberListProps {
  group: Group;
}

export const GroupMemberList: React.FC<GroupMemberListProps> = ({ group }) => {
  const { removeGroupMember } = useGroups();
  const { user } = useAuthStore();
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);

  const isAdmin = group.role === 'admin' || group.creatorId === user?.userId;

  const handleRemoveMember = (member: GroupMember) => {
    setMemberToRemove(member);
  };

  const confirmRemove = () => {
    if (memberToRemove) {
      removeGroupMember(group.groupId, memberToRemove.userId);
      setMemberToRemove(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {group.members.map((member) => {
          const isSelf = member.userId === user?.userId;
          const isGroupAdmin = group.creatorId === member.userId;

          return (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-semibold">
                    {member.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {member.username}
                      {isSelf && (
                        <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                      )}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <Badge
                    variant={isGroupAdmin ? 'default' : 'secondary'}
                    className={`text-xs ${
                      isGroupAdmin
                        ? 'bg-purple-500 hover:bg-purple-600'
                        : ''
                    }`}
                  >
                    {isGroupAdmin ? 'Admin' : 'Member'}
                  </Badge>
                </div>
              </div>

              {/* Remove action - only show for admin, not for self, and not for group creator */}
              {isAdmin && !isSelf && !isGroupAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={() => handleRemoveMember(member)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove from group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.username}</strong> from{' '}
              <strong>{group.groupName}</strong>? They will no longer be able to access this group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
