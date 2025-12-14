import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useMessagesStore } from '../../store/messagesStore';
import { useChat } from '../../hooks/useChat';
import { useFriendsStore } from '../../store/friendsStore';
import { StatusIndicator } from '../Common/StatusIndicator';

export const ChatWindow: React.FC = () => {
  const { activeConversation, conversations } = useMessagesStore();
  const { sendMessage } = useChat();
  const { friends } = useFriendsStore();

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="w-24 h-24 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Select a conversation to start chatting
          </p>
        </div>
      </div>
    );
  }

  const friend = friends.find((f) => f.userId === activeConversation);
  const messages = conversations[activeConversation] || [];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {friend?.username.charAt(0).toUpperCase()}
            </div>
            {friend && (
              <div className="absolute -bottom-1 -right-1">
                <StatusIndicator status={friend.status} size="sm" />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {friend?.username || 'Unknown User'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {friend?.status === 'online' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <MessageInput
        onSend={(content) => sendMessage(activeConversation, content)}
        disabled={!friend || friend.status === 'offline'}
      />
    </div>
  );
};
