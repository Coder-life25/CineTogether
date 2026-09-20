import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useReactions = (reactionsChannel) => {
  const [activeReactions, setActiveReactions] = useState([]);

  useEffect(() => {
    if (!reactionsChannel) return;

    const unsubscribe = reactionsChannel.onMessage((reaction) => {
      setActiveReactions(prev => [...prev, reaction]);
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 3000);
    });

    return () => unsubscribe();
  }, [reactionsChannel]);

  const sendReaction = useCallback((emoji, senderName = 'Partner') => {
    const reaction = {
      id: uuidv4(),
      emoji,
      sender: 'Me',
      timestamp: Date.now()
    };
    
    setActiveReactions(prev => [...prev, reaction]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);

    if (reactionsChannel) {
      reactionsChannel.send({ ...reaction, sender: senderName });
    }
  }, [reactionsChannel]);

  return { activeReactions, sendReaction };
};
