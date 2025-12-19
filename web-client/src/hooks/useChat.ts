import { useEffect, useCallback } from 'react';
import { useMessagesStore } from '../store/messagesStore';
import { useFriendsStore } from '../store/friendsStore';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from './useWebSocket';
import { MessageTypes } from '../types';
import type {
  ChatSendPayload,
  ChatDeliverPayload,
  FriendListRspPayload,
  FriendNotifyPayload,
  StatusNotifyPayload,
  FriendRequestAckPayload,
} from '../types';
import toast from 'react-hot-toast';

export const useChat = () => {
  const { addMessage, activeConversation, setActiveConversation } = useMessagesStore();
  const {
    friends,
    pendingRequests,
    outgoingRequests,
    setFriends,
    setPendingRequests,
    addPendingRequest,
    updateFriendStatus,
    addOutgoingRequest,
    removeOutgoingRequest,
  } = useFriendsStore();
  const { user } = useAuthStore();
  const { send, onMessage } = useWebSocket();

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      switch (message.type) {
        case MessageTypes.MSG_CHAT_DELIVER: {
          const data = message.data as ChatDeliverPayload;
          const recipientId = data.senderId; // The conversation is with the sender

          addMessage(recipientId, {
            messageId: data.messageId,
            senderId: data.senderId,
            senderUsername: data.senderUsername,
            recipientId: user?.userId || 0,
            content: data.content,
            timestamp: data.timestamp,
            status: 'delivered',
          });

          // Show notification if not in active conversation
          if (activeConversation !== recipientId) {
            toast.success(`New message from ${data.senderUsername}`);
          }
          break;
        }

        case MessageTypes.MSG_FRIEND_LIST_RSP: {
          const data = message.data as FriendListRspPayload;
          setFriends(data.friends);
          setPendingRequests(data.pendingRequests);
          break;
        }

        case MessageTypes.MSG_FRIEND_NOTIFY: {
          const data = message.data as FriendNotifyPayload;
          // C server sends: userId|username|message
          // Use fromUserId as requestId for local tracking
          addPendingRequest({
            requestId: data.fromUserId,
            fromUserId: data.fromUserId,
            fromUsername: data.fromUsername,
            toUserId: user?.userId || 0,
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          toast.success(data.message || `Friend request from ${data.fromUsername}`);
          break;
        }

        case MessageTypes.MSG_STATUS_NOTIFY: {
          const data = message.data as StatusNotifyPayload;
          updateFriendStatus(data.userId, data.status);
          toast(`${data.username} is now ${data.status}`, {
            icon: data.status === 'online' ? '🟢' : '⚫',
          });
          break;
        }

        case MessageTypes.MSG_FRIEND_REQUEST_ACK: {
          const data = message.data as FriendRequestAckPayload;
          if (data.success) {
            toast.success('Friend request sent!');
            // Note: We add to outgoingRequests in sendFriendRequest callback
          } else {
            toast.error(data.message || 'Failed to send friend request');
          }
          break;
        }

        case MessageTypes.MSG_FRIEND_ACCEPT_ACK: {
          const data = message.data as FriendRequestAckPayload;
          if (data.success) {
            toast.success('Friend request accepted!');
            // Refresh friend list and clear outgoing request if it was our request
            send(MessageTypes.MSG_FRIEND_LIST, {});
          } else {
            toast.error(data.message || 'Failed to accept friend request');
          }
          break;
        }

        case MessageTypes.MSG_FRIEND_REJECT_ACK: {
          const data = message.data as FriendRequestAckPayload;
          if (data.success) {
            toast.success('Friend request rejected');
            // Refresh friend list to remove rejected request
            send(MessageTypes.MSG_FRIEND_LIST, {});
          } else {
            toast.error(data.message || 'Failed to reject friend request');
          }
          break;
        }

        case MessageTypes.MSG_FRIEND_REMOVE_ACK: {
          const data = message.data as FriendRequestAckPayload;
          if (data.success) {
            toast.success('Friend removed');
            // Refresh friend list
            send(MessageTypes.MSG_FRIEND_LIST, {});
          } else {
            toast.error(data.message || 'Failed to remove friend');
          }
          break;
        }

        case MessageTypes.MSG_CHAT_ACK: {
          const data = message.data as any;
          if (!data.success) {
            toast.error('Failed to send message');
          }
          break;
        }
      }
    });

    return unsubscribe;
  }, [
    addMessage,
    activeConversation,
    setFriends,
    setPendingRequests,
    addPendingRequest,
    updateFriendStatus,
    user,
    send,
  ]); // Removed onMessage - it's now memoized and stable

  const sendMessage = useCallback((recipientId: number, content: string) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const payload: ChatSendPayload = {
      recipientId,
      content,
    };

    send(MessageTypes.MSG_CHAT_SEND, payload);

    // Optimistically add message to store
    addMessage(recipientId, {
      messageId: `temp-${Date.now()}`,
      senderId: user.userId,
      senderUsername: user.username,
      recipientId,
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
    });
  }, [user, send, addMessage]);

  const requestFriendList = useCallback(() => {
    send(MessageTypes.MSG_FRIEND_LIST, {});
  }, [send]);

  const sendFriendRequest = useCallback((targetUsername: string) => {
    send(MessageTypes.MSG_FRIEND_REQUEST, { targetUsername });
    // Optimistically add to outgoing requests
    addOutgoingRequest({
      requestId: `temp-${Date.now()}`,
      toUsername: targetUsername,
      timestamp: new Date().toISOString(),
      status: 'pending',
    });
  }, [send, addOutgoingRequest]);

  const cancelFriendRequest = useCallback((requestId: string) => {
    // Remove from local outgoing requests
    removeOutgoingRequest(requestId);
    toast.success('Friend request cancelled');
  }, [removeOutgoingRequest]);

  const acceptFriendRequest = useCallback((requestId: number) => {
    // Find the request to get the requester's userId
    const request = pendingRequests.find(r => r.requestId === requestId);
    if (!request) {
      toast.error('Friend request not found');
      return;
    }
    send(MessageTypes.MSG_FRIEND_ACCEPT, { userId: request.fromUserId });
  }, [pendingRequests, send]);

  const rejectFriendRequest = useCallback((requestId: number) => {
    // Find the request to get the requester's userId
    const request = pendingRequests.find(r => r.requestId === requestId);
    if (!request) {
      toast.error('Friend request not found');
      return;
    }
    send(MessageTypes.MSG_FRIEND_REJECT, { userId: request.fromUserId });
  }, [pendingRequests, send]);

  const removeFriend = useCallback((friendId: number) => {
    send(MessageTypes.MSG_FRIEND_REMOVE, { userId: friendId });
  }, [send]);

  return {
    friends,
    pendingRequests,
    outgoingRequests,
    activeConversation,
    setActiveConversation,
    sendMessage,
    requestFriendList,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
};
