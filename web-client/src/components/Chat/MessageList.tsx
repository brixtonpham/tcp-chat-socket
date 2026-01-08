import React, { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    return currentDate !== previousDate;
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 p-8">
        <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">No messages yet</p>
        <p className="text-sm text-center">Start the conversation by sending a message below</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
      <div className="p-4 md:p-6 space-y-3">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === user?.userId;
          const previousMessage = index > 0 ? messages[index - 1] : undefined;
          const showDate = shouldShowDateSeparator(message, previousMessage);

          return (
            <React.Fragment key={`${message.messageId}-${index}`}>
              {showDate && (
                <div className="flex items-center justify-center my-4">
                  <Badge variant="secondary" className="px-4 py-1.5 text-xs font-medium">
                    {new Date(message.timestamp).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Badge>
                </div>
              )}

              <div
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`group max-w-[85%] md:max-w-[70%] ${
                    isOwnMessage
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700'
                  } rounded-2xl px-4 py-2.5 shadow-md hover:shadow-lg transition-shadow`}
                >
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xs font-bold">
                          {message.senderUsername?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                        {message.senderUsername}
                      </p>
                    </div>
                  )}
                  <p className="break-words leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-end gap-2 mt-1.5">
                    <p
                      className={`text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                    {isOwnMessage && (
                      <span className="text-xs">
                        {message.status === 'sent' && (
                          <svg className="w-4 h-4 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {message.status === 'delivered' && (
                          <svg className="w-4 h-4 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13l4 4L23 7" />
                          </svg>
                        )}
                        {message.status === 'read' && (
                          <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13l4 4L23 7" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
