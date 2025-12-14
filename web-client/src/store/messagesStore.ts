import { create } from 'zustand';
import type { Message } from '../types';

interface MessagesState {
  // Map of recipientId -> messages
  conversations: Record<number, Message[]>;
  activeConversation: number | null;
  setActiveConversation: (userId: number | null) => void;
  addMessage: (recipientId: number, message: Message) => void;
  setMessages: (recipientId: number, messages: Message[]) => void;
  clearConversation: (recipientId: number) => void;
  clearAll: () => void;
  getUnreadCount: (userId: number) => number;
  markAsRead: (userId: number) => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: {},
  activeConversation: null,

  setActiveConversation: (userId) =>
    set({
      activeConversation: userId,
    }),

  addMessage: (recipientId, message) =>
    set((state) => {
      const messages = state.conversations[recipientId] || [];
      return {
        conversations: {
          ...state.conversations,
          [recipientId]: [...messages, message],
        },
      };
    }),

  setMessages: (recipientId, messages) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [recipientId]: messages,
      },
    })),

  clearConversation: (recipientId) =>
    set((state) => {
      const newConversations = { ...state.conversations };
      delete newConversations[recipientId];
      return { conversations: newConversations };
    }),

  clearAll: () =>
    set({
      conversations: {},
      activeConversation: null,
    }),

  getUnreadCount: (userId) => {
    const messages = get().conversations[userId] || [];
    return messages.filter((m) => m.status !== 'read').length;
  },

  markAsRead: (userId) =>
    set((state) => {
      const messages = state.conversations[userId] || [];
      return {
        conversations: {
          ...state.conversations,
          [userId]: messages.map((m) => ({ ...m, status: 'read' as const })),
        },
      };
    }),
}));
