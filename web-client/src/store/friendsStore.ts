import { create } from 'zustand';
import type { Friend, FriendRequest } from '../types';

interface FriendsState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (userId: number) => void;
  updateFriendStatus: (userId: number, status: 'online' | 'offline') => void;
  setPendingRequests: (requests: FriendRequest[]) => void;
  addPendingRequest: (request: FriendRequest) => void;
  removePendingRequest: (requestId: number) => void;
  clearAll: () => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  pendingRequests: [],

  setFriends: (friends) =>
    set({
      friends,
    }),

  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
    })),

  removeFriend: (userId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.userId !== userId),
    })),

  updateFriendStatus: (userId, status) =>
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.userId === userId ? { ...friend, status } : friend
      ),
    })),

  setPendingRequests: (requests) =>
    set({
      pendingRequests: requests,
    }),

  addPendingRequest: (request) =>
    set((state) => ({
      pendingRequests: [...state.pendingRequests, request],
    })),

  removePendingRequest: (requestId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter(
        (r) => r.requestId !== requestId
      ),
    })),

  clearAll: () =>
    set({
      friends: [],
      pendingRequests: [],
    }),
}));
