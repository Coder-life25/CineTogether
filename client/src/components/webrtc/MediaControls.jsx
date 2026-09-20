import React from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { motion } from 'framer-motion';

const MediaControls = ({ isCameraOn, isMicOn, toggleCamera, toggleMic }) => {
  const baseClass = "p-3 rounded-full flex items-center justify-center transition-colors shadow-lg";
  
  return (
    <div className="flex items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMic}
        className={`${baseClass} ${isMicOn ? 'bg-secondary border border-border text-text-primary' : 'bg-accent text-white'}`}
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleCamera}
        className={`${baseClass} ${isCameraOn ? 'bg-secondary border border-border text-text-primary' : 'bg-accent text-white'}`}
      >
        {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </motion.button>
    </div>
  );
};

export default MediaControls;
