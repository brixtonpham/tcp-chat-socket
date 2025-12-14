import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';

export const AddFriend: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { sendFriendRequest } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      sendFriendRequest(username.trim());
      setUsername('');
      setIsOpen(false);
    }
  };

  return (
    <div className="px-3">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
          Add Friend
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              Send Request
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setUsername('');
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
