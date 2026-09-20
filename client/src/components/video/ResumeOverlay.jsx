import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

// Shown when the browser refused to start playback the partner triggered (no user gesture yet
// on this page). The click is the gesture that lets us catch up and play.
const ResumeOverlay = ({ onResume }) => (
  <motion.button
    type="button"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    onClick={onResume}
    className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm text-white cursor-pointer"
  >
    <span className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
      <Play className="w-9 h-9 fill-current ml-1" />
    </span>
    <span className="text-lg font-medium">Your partner is watching</span>
    <span className="text-sm text-text-secondary">Tap to join playback in sync</span>
  </motion.button>
);

export default ResumeOverlay;
