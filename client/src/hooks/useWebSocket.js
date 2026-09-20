import { useState, useEffect } from 'react';
import { WebSocketClient } from '../services/websocket';

export const useWebSocket = (roomId, participantId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!roomId || !participantId) return;

    const client = new WebSocketClient();
    client.onOpen(() => setIsConnected(true));
    client.onClose(() => setIsConnected(false));
    client.connect(roomId, participantId).catch(console.error);
    setWs(client);

    return () => {
      client.close();
      setWs(null);
      setIsConnected(false);
    };
  }, [roomId, participantId]);

  return { ws, isConnected };
};
