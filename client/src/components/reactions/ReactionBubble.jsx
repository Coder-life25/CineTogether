import React from 'react';
import { motion } from 'framer-motion';

const ReactionBubble = ({ reaction }) => {
  // Randomize initial position slightly
  const randomX = Math.random() * 40 - 20; // -20px to 20px
  
  return (
    <motion.div
      initial={{ y: 50, x: randomX, opacity: 0, scale: 0.5 }}
      animate={{ 
        y: -200 - Math.random() * 100, 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        x: randomX + (Math.random() * 40 - 20)
      }}
      transition={{ duration: 2 + Math.random(), ease: "easeOut" }}
      className="absolute bottom-0 left-1/2 text-4xl pointer-events-none drop-shadow-md"
    >
      <div className="relative">
        {reaction.emoji}
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] bg-black/50 text-white px-1.5 rounded-full whitespace-nowrap">
          {reaction.sender}
        </span>
      </div>
    </motion.div>
  );
};

export default ReactionBubble;
