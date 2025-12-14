import React, { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { useAuthStore } from '../../store/authStore';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === user?.userId;

        return (
          <div
            key={`${message.messageId}-${index}`}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] ${
                isOwnMessage
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              } rounded-lg px-4 py-2 shadow-sm`}
            >
              {!isOwnMessage && (
                <p className="text-xs font-semibold mb-1 opacity-75">
                  {message.senderUsername}
                </p>
              )}
              <p className="break-words">{message.content}</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <p
                  className={`text-xs ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
                {isOwnMessage && (
                  <span className="text-xs text-blue-100">
                    {message.status === 'sent' && '✓'}
                    {message.status === 'delivered' && '✓✓'}
                    {message.status === 'read' && '✓✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
