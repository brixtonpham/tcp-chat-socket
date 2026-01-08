import React, { useEffect, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useMessagesStore } from '../../store/messagesStore';
import { StatusIndicator } from '../Common/StatusIndicator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Users, X } from 'lucide-react';

export const FriendList: React.FC = () => {
  const { friends, requestFriendList, setActiveConversation, removeFriend } = useChat();
  const { activeConversation } = useMessagesStore();
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  useEffect(() => {
    requestFriendList();
  }, [requestFriendList]);

  const handleRemoveFriend = (friendId: number) => {
    removeFriend(friendId);
    setConfirmRemove(null);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Friends
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {friends.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-3">
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">No friends yet</p>
            <p className="text-xs text-muted-foreground">Add friends to start chatting</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-1.5">
              {friends.map((friend) => (
                <div key={friend.userId} className="relative group">
                  <button
                    onClick={() => setActiveConversation(friend.userId)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover-lift ${
                      activeConversation === friend.userId
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                          {friend.username?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <StatusIndicator status={friend.status} size="sm" />
                      </div>
                    </div>

                    <div className="flex-1 text-left">
                      <p className="font-medium">{friend.username}</p>
                      <Badge
                        variant={friend.status === 'online' ? 'default' : 'secondary'}
                        className="text-xs mt-0.5"
                      >
                        {friend.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>

                    <Dialog open={confirmRemove === friend.userId} onOpenChange={(open) => !open && setConfirmRemove(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRemove(friend.userId);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>Remove Friend</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to remove {friend.username} from your friends list?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setConfirmRemove(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRemoveFriend(friend.userId)}
                          >
                            Remove
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
