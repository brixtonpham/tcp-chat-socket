import React, { useEffect } from 'react';
import { useGroups } from '../../hooks/useGroups';

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
        <div className="space-y-1">
          {groups.map((group) => (
            <button
              key={group.groupId}
              onClick={() => setActiveGroup(group.groupId)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeGroup === group.groupId
                  ? 'bg-purple-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                {group.groupName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 text-left">
                <p className="font-medium">{group.groupName}</p>
                <p
                  className={`text-xs ${
                    activeGroup === group.groupId
                      ? 'text-purple-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {group.members.length} members
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
