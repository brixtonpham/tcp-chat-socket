import React, { useEffect } from 'react';
import { useGroups } from '../../hooks/useGroups';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export const GroupList: React.FC = () => {
  const { groups, activeGroup, setActiveGroup, requestGroupList } = useGroups();

  useEffect(() => {
    requestGroupList();
  }, [requestGroupList]);

  return (
    <div className="space-y-2 mt-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-3">
        Groups ({groups.length})
      </h3>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
          No groups yet. Create a group to get started!
        </p>
      ) : (
        <ScrollArea className="h-auto max-h-[calc(100vh-300px)]">
          <div className="space-y-1 px-1">
            {groups.map((group) => (
              <Card
                key={group.groupId}
                className={`cursor-pointer transition-colors ${
                  activeGroup === group.groupId
                    ? 'bg-purple-500 text-white border-purple-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setActiveGroup(group.groupId)}
              >
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-semibold">
                      {group.groupName?.charAt(0).toUpperCase() || 'G'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{group.groupName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          activeGroup === group.groupId
                            ? 'bg-purple-600 text-purple-100'
                            : ''
                        }`}
                      >
                        {group.members?.length || 0} members
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
