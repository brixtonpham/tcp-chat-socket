import { useEffect, useState, useCallback } from 'react';
import { wsClient } from '../api/websocket';
import type { WSMessage, MessageType } from '../types';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(wsClient.isConnected());

  useEffect(() => {
    const unsubscribe = wsClient.onConnectionChange(setConnected);
    return unsubscribe;
  }, []);

  const send = useCallback(<T,>(type: MessageType, data: T) => {
    wsClient.send(type, data);
  }, []);

  const onMessage = useCallback((handler: (message: WSMessage) => void) => {
    return wsClient.onMessage(handler);
  }, []);

  const connect = useCallback(() => {
    wsClient.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  return {
    connected,
    send,
    onMessage,
    connect,
    disconnect,
  };
};
