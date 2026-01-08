import React, { useState } from 'react';
import { Users, UsersRound } from 'lucide-react';
import { FriendList } from '../Friends/FriendList';
import { FriendRequest } from '../Friends/FriendRequest';
import { AddFriend } from '../Friends/AddFriend';
import { GroupList } from '../Groups/GroupList';
import { CreateGroup } from '../Groups/CreateGroup';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

type Tab = 'friends' | 'groups';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('friends');

  return (
    <TooltipProvider>
      <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTab === 'friends' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-3 md:py-4 text-sm font-semibold transition-all relative rounded-none ${
                  activeTab === 'friends'
                    ? 'text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden md:inline">Friends</span>
                </div>
                {activeTab === 'friends' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="md:hidden">
              <p>Friends</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTab === 'groups' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('groups')}
                className={`flex-1 py-3 md:py-4 text-sm font-semibold transition-all relative rounded-none ${
                  activeTab === 'groups'
                    ? 'text-purple-600 dark:text-purple-400 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UsersRound className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden md:inline">Groups</span>
                </div>
                {activeTab === 'groups' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-full" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="md:hidden">
              <p>Groups</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 bg-gray-50 dark:bg-slate-900/30">
          {activeTab === 'friends' ? (
            <div className="space-y-4">
              <FriendList />
              <Separator className="my-2" />
              <FriendRequest />
            </div>
          ) : (
            <GroupList />
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
          {activeTab === 'friends' ? <AddFriend /> : <CreateGroup />}
        </div>
      </div>
    </TooltipProvider>
  );
};
