import { useEffect, useState, useCallback } from 'react';

export const useDataChannel = (dataChannels, channelName) => {
  const [readyState, setReadyState] = useState('closed');
  const [handlers, setHandlers] = useState([]);

  useEffect(() => {
    const channel = dataChannels[channelName];
    if (!channel) return;

    const handleOpen = () => setReadyState('open');
    const handleClose = () => setReadyState('closed');
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handlers.forEach(h => h(data));
      } catch (e) {
        console.error('DataChannel parse error:', e);
      }
    };

    setReadyState(channel.readyState);
    channel.addEventListener('open', handleOpen);
    channel.addEventListener('close', handleClose);
    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('open', handleOpen);
      channel.removeEventListener('close', handleClose);
      channel.removeEventListener('message', handleMessage);
    };
  }, [dataChannels, channelName, handlers]);

  const send = useCallback((data) => {
    const channel = dataChannels[channelName];
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify(data));
    }
  }, [dataChannels, channelName]);

  const onMessage = useCallback((callback) => {
    setHandlers(prev => [...prev, callback]);
    return () => setHandlers(prev => prev.filter(h => h !== callback));
  }, []);

  return { readyState, send, onMessage };
};
