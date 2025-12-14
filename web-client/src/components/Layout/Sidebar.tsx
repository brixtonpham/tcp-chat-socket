import React, { useState } from 'react';
import { FriendList } from '../Friends/FriendList';
import { FriendRequest } from '../Friends/FriendRequest';
import { AddFriend } from '../Friends/AddFriend';
import { GroupList } from '../Groups/GroupList';
import { CreateGroup } from '../Groups/CreateGroup';

type Tab = 'friends' | 'groups';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('friends');

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'groups'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Groups
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4">
        {activeTab === 'friends' ? (
          <>
            <FriendList />
            <FriendRequest />
          </>
        ) : (
          <GroupList />
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 py-4">
        {activeTab === 'friends' ? <AddFriend /> : <CreateGroup />}
      </div>
    </div>
  );
};
