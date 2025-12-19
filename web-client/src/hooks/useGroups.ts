import { useEffect, useCallback } from 'react';
import { useGroupsStore } from '../store/groupsStore';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from './useWebSocket';
import { MessageTypes } from '../types';
import type {
  GroupCreatePayload,
  GroupCreateAckPayload,
  GroupMsgPayload,
  GroupMsgDeliverPayload,
  GroupListRspPayload,
} from '../types';
import toast from 'react-hot-toast';

export const useGroups = () => {
  const { groups, groupMessages, activeGroup, setActiveGroup, setGroups, addGroupMessage } =
    useGroupsStore();
  const { user } = useAuthStore();
  const { send, onMessage } = useWebSocket();

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      switch (message.type) {
        case MessageTypes.MSG_GROUP_LIST_RSP: {
          const data = message.data as GroupListRspPayload;
          setGroups(data.groups);
          break;
        }

        case MessageTypes.MSG_GROUP_CREATE_ACK: {
          const data = message.data as GroupCreateAckPayload;
          if (data.success) {
            toast.success('Group created successfully!');
            // Refresh group list
            send(MessageTypes.MSG_GROUP_LIST, {});
          } else {
            toast.error(data.message || 'Failed to create group');
          }
          break;
        }

        case MessageTypes.MSG_GROUP_MSG_DELIVER: {
          const data = message.data as GroupMsgDeliverPayload;

          // Derive groupId from groupName (C server sends groupName, not groupId)
          const group = groups.find((g) => g.groupName === data.groupName);
          const derivedGroupId = group?.groupId || data.groupId;

          addGroupMessage(derivedGroupId, {
            messageId: data.messageId,
            senderId: data.senderId,
            senderUsername: data.senderUsername,
            groupId: derivedGroupId,
            content: data.content,
            timestamp: data.timestamp,
          });

          // Show notification if not in active group
          if (activeGroup !== derivedGroupId) {
            toast.success(`New message in ${data.groupName} from ${data.senderUsername}`);
          }
          break;
        }

        case MessageTypes.MSG_GROUP_INVITE_ACK: {
          const data = message.data as any;
          if (data.success) {
            toast.success('User invited to group!');
          } else {
            toast.error(data.message || 'Failed to invite user');
          }
          break;
        }

        case MessageTypes.MSG_GROUP_JOIN_ACK: {
          const data = message.data as any;
          if (data.success) {
            toast.success('Joined group successfully!');
            send(MessageTypes.MSG_GROUP_LIST, {});
          } else {
            toast.error(data.message || 'Failed to join group');
          }
          break;
        }

        case MessageTypes.MSG_GROUP_LEAVE_ACK: {
          const data = message.data as any;
          if (data.success) {
            toast.success('Left group');
            send(MessageTypes.MSG_GROUP_LIST, {});
          } else {
            toast.error(data.message || 'Failed to leave group');
          }
          break;
        }

        case MessageTypes.MSG_GROUP_REMOVE_ACK: {
          const data = message.data as any;
          if (data.success) {
            toast.success('User removed from group');
          } else {
            toast.error(data.message || 'Failed to remove user');
          }
          break;
        }
      }
    });

    return unsubscribe;
  }, [addGroupMessage, activeGroup, groups, setGroups, send]); // Removed onMessage - it's now memoized and stable

  const requestGroupList = useCallback(() => {
    send(MessageTypes.MSG_GROUP_LIST, {});
  }, [send]);

  const createGroup = useCallback((groupName: string, description?: string) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const payload: GroupCreatePayload = {
      groupName,
      description: description || '',
    };

    send(MessageTypes.MSG_GROUP_CREATE, payload);
  }, [user, send]);

  const sendGroupMessage = useCallback((groupId: number, content: string) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const payload: GroupMsgPayload = {
      groupId,
      content,
    };

    send(MessageTypes.MSG_GROUP_MSG, payload);

    // Optimistically add message
    addGroupMessage(groupId, {
      messageId: `temp-${Date.now()}`,
      senderId: user.userId,
      senderUsername: user.username,
      groupId,
      content,
      timestamp: new Date().toISOString(),
    });
  }, [user, send, addGroupMessage]);

  const inviteToGroup = useCallback((groupId: number, userId: number) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    send(MessageTypes.MSG_GROUP_INVITE, { groupId, userId });
  }, [user, send]);

  const removeGroupMember = useCallback((groupId: number, userId: number) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    send(MessageTypes.MSG_GROUP_REMOVE_USER, { groupId, userId });
  }, [user, send]);

  const leaveGroup = useCallback((groupId: number) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    send(MessageTypes.MSG_GROUP_LEAVE, { groupId });
  }, [user, send]);

  return {
    groups,
    groupMessages,
    activeGroup,
    setActiveGroup,
    requestGroupList,
    createGroup,
    sendGroupMessage,
    inviteToGroup,
    removeGroupMember,
    leaveGroup,
  };
};
