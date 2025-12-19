import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups';
import { useFriendsStore } from '../../store/friendsStore';
import { useGroupsStore } from '../../store/groupsStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Check } from 'lucide-react';

interface InviteToGroupProps {
  groupId: number;
  onClose: () => void;
}

export const InviteToGroup: React.FC<InviteToGroupProps> = ({ groupId, onClose }) => {
  const { inviteToGroup } = useGroups();
  const { friends } = useFriendsStore();
  const { groups } = useGroupsStore();
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');

  const group = groups.find((g) => g.groupId === groupId);

  // Filter friends who are NOT already in the group
  const availableFriends = friends.filter(
    (friend) => !group?.members.some((member) => member.userId === friend.userId)
  );

  const handleInvite = () => {
    if (selectedFriendId) {
      inviteToGroup(groupId, parseInt(selectedFriendId));
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {group?.groupName || 'Group'}</DialogTitle>
          <DialogDescription>
            Select a friend to invite to this group.
          </DialogDescription>
        </DialogHeader>

        {availableFriends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>All your friends are already in this group</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {availableFriends.map((friend) => (
                <div
                  key={friend.userId}
                  onClick={() => setSelectedFriendId(String(friend.userId))}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFriendId === String(friend.userId)
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-purple-500">
                    {selectedFriendId === String(friend.userId) && (
                      <Check className="w-3 h-3 text-purple-500" />
                    )}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-semibold">
                      {friend.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{friend.username}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <Badge variant="secondary" className="text-xs">
                        {friend.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!selectedFriendId}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
