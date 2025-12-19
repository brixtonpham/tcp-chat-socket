import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useMessagesStore } from '../../store/messagesStore';
import { useChat } from '../../hooks/useChat';
import { useFriendsStore } from '../../store/friendsStore';
import { StatusIndicator } from '../Common/StatusIndicator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export const ChatWindow: React.FC = () => {
  const { activeConversation, conversations } = useMessagesStore();
  const { sendMessage } = useChat();
  const { friends } = useFriendsStore();

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center p-8 animate-fade-in">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-blue-500 dark:text-blue-400"
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
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to TCP Chat
          </h3>
          <p className="text-lg text-gray-500 dark:text-slate-400 mb-4">
            Select a conversation to start chatting
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500">
            Choose a friend from the sidebar or create a new group
          </p>
        </div>
      </div>
    );
  }

  const friend = friends.find((f) => f.userId === activeConversation);
  const messages = conversations[activeConversation] || [];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 md:px-6 py-3 md:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 md:w-12 md:h-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                  {friend?.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {friend && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <StatusIndicator status={friend.status} size="sm" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base md:text-lg">
                {friend?.username || 'Unknown User'}
              </h2>
              <div className="flex items-center gap-2">
                {friend?.status === 'online' ? (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">
                    Active now
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Offline
                  </Badge>
                )}
                {friend?.status === 'online' && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Optional: Chat Actions */}
          <div className="flex items-center gap-2">
            <button
              className="tooltip p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-slate-400"
              data-tooltip="Search in conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
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
