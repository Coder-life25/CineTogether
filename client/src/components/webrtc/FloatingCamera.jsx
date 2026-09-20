import React from 'react';
import { motion } from 'framer-motion';
import { MicOff } from 'lucide-react';
import CameraPreview from './CameraPreview';

const FloatingCamera = ({ stream, name, isLocal = false, muted = false }) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      className="w-32 h-24 sm:w-48 sm:h-36 bg-secondary rounded-xl overflow-hidden shadow-xl shadow-black/50 border-2 border-border relative cursor-move group"
      whileHover={{ scale: 1.02 }}
    >
      <CameraPreview stream={stream} isLocal={isLocal} />
      
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between pointer-events-none">
        <span className="text-xs font-medium text-white shadow-sm">{name}</span>
        {muted && <MicOff className="w-3 h-3 text-accent" />}
      </div>
    </motion.div>
  );
};

export default FloatingCamera;
