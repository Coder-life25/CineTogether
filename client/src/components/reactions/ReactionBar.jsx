import React from 'react';
import { motion } from 'framer-motion';
import { REACTION_EMOJIS } from '../../lib/constants';
import { useReactions } from '../../hooks/useReactions';
import ReactionBubble from './ReactionBubble';

const ReactionBar = ({ reactionsChannel }) => {
  const { sendReaction, activeReactions } = useReactions(reactionsChannel);

  return (
    <>
      {/* Floating Reactions Area */}
      <div className="absolute bottom-full left-0 right-0 h-64 pointer-events-none overflow-hidden">
        {activeReactions.map(reaction => (
          <ReactionBubble key={reaction.id} reaction={reaction} />
        ))}
      </div>

      {/* Bar */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2 bg-secondary/80 backdrop-blur-md border border-border p-2 rounded-full shadow-lg"
      >
        {REACTION_EMOJIS.map(emoji => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => sendReaction(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-elevated rounded-full transition-colors"
          >
            {emoji}
          </motion.button>
        ))}
      </motion.div>
    </>
  );
};

export default ReactionBar;
