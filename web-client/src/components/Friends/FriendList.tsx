import React, { useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useMessagesStore } from '../../store/messagesStore';
import { StatusIndicator } from '../Common/StatusIndicator';

export const FriendList: React.FC = () => {
  const { friends, requestFriendList, setActiveConversation } = useChat();
  const { activeConversation } = useMessagesStore();

  useEffect(() => {
    requestFriendList();
  }, [requestFriendList]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-3">
        Friends ({friends.length})
      </h3>

      {friends.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
          No friends yet. Add some friends to start chatting!
        </p>
      ) : (
        <div className="space-y-1">
          {friends.map((friend) => (
            <button
              key={friend.userId}
              onClick={() => setActiveConversation(friend.userId)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeConversation === friend.userId
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <StatusIndicator status={friend.status} size="sm" />
                </div>
              </div>

              <div className="flex-1 text-left">
                <p className="font-medium">{friend.username}</p>
                <p
                  className={`text-xs ${
                    activeConversation === friend.userId
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {friend.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
