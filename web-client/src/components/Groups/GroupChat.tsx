import React from 'react';
import { MessageInput } from '../Chat/MessageInput';
import { useGroupsStore } from '../../store/groupsStore';
import { useGroups } from '../../hooks/useGroups';
import { useAuthStore } from '../../store/authStore';
import type { GroupMessage } from '../../types';

export const GroupChat: React.FC = () => {
  const { activeGroup, groups, groupMessages } = useGroupsStore();
  const { sendGroupMessage } = useGroups();
  const { user } = useAuthStore();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, activeGroup]);

  if (!activeGroup) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Select a group to start chatting
          </p>
        </div>
      </div>
    );
  }

  const group = groups.find((g) => g.groupId === activeGroup);
  const messages = groupMessages[activeGroup] || [];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Group Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
            {group?.groupName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {group?.groupName || 'Unknown Group'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {group?.members.length || 0} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message: GroupMessage, index: number) => {
            const isOwnMessage = message.senderId === user?.userId;

            return (
              <div
                key={`${message.messageId}-${index}`}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isOwnMessage
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  } rounded-lg px-4 py-2 shadow-sm`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.senderUsername}
                    </p>
                  )}
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage
                        ? 'text-purple-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={(content) => sendGroupMessage(activeGroup, content)} />
    </div>
  );
};
