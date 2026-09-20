import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import ChatPanel from './ChatPanel';

const ChatDrawer = ({ isOpen, onClose, chatChannel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[60vh] bg-secondary z-50 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col border-t border-border"
          >
            <div className="flex justify-center p-2 cursor-grab active:cursor-grabbing bg-elevated" onClick={onClose}>
              <div className="w-12 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel chatChannel={chatChannel} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;
