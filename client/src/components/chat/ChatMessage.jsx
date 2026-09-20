import React from 'react';
import { motion } from 'framer-motion';

const ChatMessage = ({ message }) => {
  const isMe = message.sender === 'Me';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
    >
      <span className="text-xs text-text-secondary mb-1 px-1">
        {message.sender}
      </span>
      <div 
        className={`px-4 py-2 rounded-2xl ${
          isMe 
            ? 'bg-accent text-white rounded-br-sm' 
            : 'bg-elevated text-text-primary rounded-bl-sm border border-border'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
      </div>
      <span className="text-[10px] text-text-secondary mt-1 px-1">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
  );
};

export default ChatMessage;
