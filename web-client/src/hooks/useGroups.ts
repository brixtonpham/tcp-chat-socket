import { useEffect } from 'react';
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
          addGroupMessage(data.groupId, {
            messageId: data.messageId,
            senderId: data.senderId,
            senderUsername: data.senderUsername,
            groupId: data.groupId,
            content: data.content,
            timestamp: data.timestamp,
          });

          // Show notification if not in active group
          if (activeGroup !== data.groupId) {
            const group = groups.find((g) => g.groupId === data.groupId);
            toast.success(`New message in ${group?.groupName || 'group'} from ${data.senderUsername}`);
          }
          break;
        }
      }
    });

    return unsubscribe;
  }, [addGroupMessage, activeGroup, groups, setGroups, onMessage, send]);

  const requestGroupList = () => {
    send(MessageTypes.MSG_GROUP_LIST, {});
  };

  const createGroup = (groupName: string, memberIds: number[]) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const payload: GroupCreatePayload = {
      groupName,
      memberIds,
    };

    send(MessageTypes.MSG_GROUP_CREATE, payload);
  };

  const sendGroupMessage = (groupId: number, content: string) => {
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
  };

  return {
    groups,
    groupMessages,
    activeGroup,
    setActiveGroup,
    requestGroupList,
    createGroup,
    sendGroupMessage,
  };
};
