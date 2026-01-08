import React from 'react';
import { useChat } from '../../hooks/useChat';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Clock } from 'lucide-react';

export const FriendRequest: React.FC = () => {
  const { pendingRequests, outgoingRequests, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } = useChat();

  if (pendingRequests.length === 0 && outgoingRequests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Separator />

      {pendingRequests.length > 0 && (
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Friend Requests
              </CardTitle>
              <Badge variant="default" className="text-xs">
                {pendingRequests.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-3">
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <Card key={request.requestId} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-semibold">
                            {request.fromUsername.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {request.fromUsername}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Wants to be your friend
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptFriendRequest(request.requestId)}
                          variant="default"
                          size="sm"
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => rejectFriendRequest(request.requestId)}
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {outgoingRequests.length > 0 && (
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Sent Requests
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {outgoingRequests.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-3">
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {outgoingRequests.map((request) => (
                  <Card key={request.requestId} className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500 text-white font-semibold">
                          {request.toUsername.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {request.toUsername}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 animate-pulse" />
                          Request pending...
                        </div>
                      </div>
                      <Button
                        onClick={() => cancelFriendRequest(request.requestId)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
