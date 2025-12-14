import { useEffect } from 'react';
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
    setFriends,
    setPendingRequests,
    addPendingRequest,
    updateFriendStatus,
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
          addPendingRequest({
            requestId: data.requestId,
            fromUserId: data.fromUserId,
            fromUsername: data.fromUsername,
            toUserId: user?.userId || 0,
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          toast.success(`Friend request from ${data.fromUsername}`);
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
          } else {
            toast.error(data.message || 'Failed to send friend request');
          }
          break;
        }

        case MessageTypes.MSG_FRIEND_ACCEPT_ACK: {
          const data = message.data as FriendRequestAckPayload;
          if (data.success) {
            toast.success('Friend request accepted!');
            // Refresh friend list
            send(MessageTypes.MSG_FRIEND_LIST, {});
          } else {
            toast.error(data.message || 'Failed to accept friend request');
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
    onMessage,
    send,
  ]);

  const sendMessage = (recipientId: number, content: string) => {
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
  };

  const requestFriendList = () => {
    send(MessageTypes.MSG_FRIEND_LIST, {});
  };

  const sendFriendRequest = (targetUsername: string) => {
    send(MessageTypes.MSG_FRIEND_REQUEST, { targetUsername });
  };

  const acceptFriendRequest = (requestId: number) => {
    send(MessageTypes.MSG_FRIEND_ACCEPT, { requestId });
  };

  const rejectFriendRequest = (requestId: number) => {
    send(MessageTypes.MSG_FRIEND_REJECT, { requestId });
  };

  return {
    friends,
    pendingRequests,
    activeConversation,
    setActiveConversation,
    sendMessage,
    requestFriendList,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
};
