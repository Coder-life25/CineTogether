import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useChat = (chatChannel, isVisible) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!chatChannel) return;

    const unsubscribe = chatChannel.onMessage((message) => {
      setMessages(prev => [...prev, message]);
      if (!isVisible) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => unsubscribe();
  }, [chatChannel, isVisible]);

  useEffect(() => {
    if (isVisible) setUnreadCount(0);
  }, [isVisible]);

  const sendMessage = useCallback((text, senderName = 'Partner') => {
    const msg = {
      id: uuidv4(),
      text,
      sender: 'Me',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
    
    if (chatChannel) {
      chatChannel.send({ ...msg, sender: senderName });
    }
  }, [chatChannel]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, clearMessages, unreadCount };
};
