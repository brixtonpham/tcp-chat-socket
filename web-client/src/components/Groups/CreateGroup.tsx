import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups';
import { useFriendsStore } from '../../store/friendsStore';

export const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { createGroup } = useGroups();
  const { friends } = useFriendsStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim() && selectedMembers.length > 0) {
      createGroup(groupName.trim(), selectedMembers);
      setGroupName('');
      setSelectedMembers([]);
      setIsOpen(false);
    }
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="px-3 mt-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Group
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            autoFocus
          />

          <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                Add friends first
              </p>
            ) : (
              friends.map((friend) => (
                <label
                  key={friend.userId}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(friend.userId)}
                    onChange={() => toggleMember(friend.userId)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {friend.username}
                  </span>
                </label>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setGroupName('');
                setSelectedMembers([]);
              }}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
