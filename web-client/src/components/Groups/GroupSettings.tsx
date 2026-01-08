import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups';
import { useAuthStore } from '../../store/authStore';
import { GroupMemberList } from './GroupMemberList';
import { InviteToGroup } from './InviteToGroup';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Info, Users } from 'lucide-react';
import type { Group } from '../../types';

interface GroupSettingsProps {
  group: Group;
  onClose: () => void;
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({ group, onClose }) => {
  const { leaveGroup } = useGroups();
  const { user } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const isAdmin = group.role === 'admin' || group.creatorId === user?.userId;

  const handleLeaveGroup = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeave = () => {
    leaveGroup(group.groupId);
    setShowLeaveConfirm(false);
    onClose();
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">
                <Info className="w-4 h-4 mr-2" />
                Info
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users className="w-4 h-4 mr-2" />
                Members
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-2xl font-semibold">
                          {group.groupName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{group.groupName}</CardTitle>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-medium">{group.members.length}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Role</span>
                        <span className="font-medium">{isAdmin ? 'Admin' : 'Member'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Members ({group.members.length})</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setShowInviteModal(true)}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <GroupMemberList group={group} />
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <Separator />

          <DialogFooter>
            <Button variant="destructive" onClick={handleLeaveGroup} className="w-full">
              Leave Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteToGroup groupId={group.groupId} onClose={() => setShowInviteModal(false)} />
      )}

      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{group.groupName}</strong>?
              {isAdmin && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  Warning: You are an admin of this group. Consider transferring admin rights
                  before leaving.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
