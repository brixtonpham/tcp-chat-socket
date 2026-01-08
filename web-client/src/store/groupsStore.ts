import { create } from 'zustand';
import type { Group, GroupMessage } from '../types';

interface GroupsState {
  groups: Group[];
  // Map of groupId -> messages
  groupMessages: Record<number, GroupMessage[]>;
  activeGroup: number | null;
  setActiveGroup: (groupId: number | null) => void;
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  removeGroup: (groupId: number) => void;
  addGroupMessage: (groupId: number, message: GroupMessage) => void;
  setGroupMessages: (groupId: number, messages: GroupMessage[]) => void;
  clearGroupMessages: (groupId: number) => void;
  clearAll: () => void;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  groupMessages: {},
  activeGroup: null,

  setActiveGroup: (groupId) =>
    set({
      activeGroup: groupId,
    }),

  setGroups: (groups) =>
    set({
      groups,
    }),

  addGroup: (group) =>
    set((state) => ({
      groups: [...state.groups, group],
    })),

  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.groupId !== groupId),
      groupMessages: Object.fromEntries(
        Object.entries(state.groupMessages).filter(
          ([id]) => Number(id) !== groupId
        )
      ),
    })),

  addGroupMessage: (groupId, message) =>
    set((state) => {
      const messages = state.groupMessages[groupId] || [];
      return {
        groupMessages: {
          ...state.groupMessages,
          [groupId]: [...messages, message],
        },
      };
    }),

  setGroupMessages: (groupId, messages) =>
    set((state) => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: messages,
      },
    })),

  clearGroupMessages: (groupId) =>
    set((state) => {
      const newMessages = { ...state.groupMessages };
      delete newMessages[groupId];
      return { groupMessages: newMessages };
    }),

  clearAll: () =>
    set({
      groups: [],
      groupMessages: {},
      activeGroup: null,
    }),
}));
