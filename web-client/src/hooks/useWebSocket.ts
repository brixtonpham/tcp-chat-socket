import { useEffect, useState } from 'react';
import { wsClient } from '../api/websocket';
import type { WSMessage, MessageType } from '../types';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(wsClient.isConnected());

  useEffect(() => {
    const unsubscribe = wsClient.onConnectionChange(setConnected);
    return unsubscribe;
  }, []);

  const send = <T,>(type: MessageType, data: T) => {
    wsClient.send(type, data);
  };

  const onMessage = (handler: (message: WSMessage) => void) => {
    return wsClient.onMessage(handler);
  };

  return {
    connected,
    send,
    onMessage,
    connect: () => wsClient.connect(),
    disconnect: () => wsClient.disconnect(),
  };
};
