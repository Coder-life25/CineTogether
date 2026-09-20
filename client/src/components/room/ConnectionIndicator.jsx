import React from 'react';
import { motion } from 'framer-motion';

const ConnectionIndicator = ({ state }) => {
  const config = {
    new: { color: 'bg-gray-400', text: 'Initializing' },
    connecting: { color: 'bg-yellow-400', text: 'Connecting' },
    connected: { color: 'bg-green-400', text: 'Connected' },
    disconnected: { color: 'bg-accent', text: 'Disconnected' },
    failed: { color: 'bg-accent', text: 'Failed' },
    closed: { color: 'bg-gray-600', text: 'Closed' }
  };

  const current = config[state] || config.new;

  return (
    <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full shadow-lg">
      <motion.div 
        className={`w-2 h-2 rounded-full ${current.color}`}
        animate={state === 'connecting' ? { opacity: [0.4, 1, 0.4] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      <span className="text-xs font-medium text-text-secondary">{current.text}</span>
    </div>
  );
};

export default ConnectionIndicator;
