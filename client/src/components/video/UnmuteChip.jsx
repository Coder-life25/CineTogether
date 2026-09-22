import React from 'react';
import { motion } from 'framer-motion';
import { VolumeX } from 'lucide-react';

// The browser wouldn't start audible playback without a click, so the video is running muted and
// already in step with the partner. One tap is only about the sound - never about catching up.
const UnmuteChip = ({ onUnmute }) => (
  <motion.button
    type="button"
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    onClick={onUnmute}
    className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-lg shadow-accent/40 hover:bg-accent-glow transition-colors"
  >
    <VolumeX className="w-4 h-4" />
    Playing in sync — tap for sound
  </motion.button>
);

export default UnmuteChip;
