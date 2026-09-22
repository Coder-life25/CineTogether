import React, { useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VideoControls = ({ adapter, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!adapter) return;
    
    adapter.onStateChange((state) => {
      setIsPlaying(state === 'play');
    });

    adapter.onTimeUpdate((time) => {
      setCurrentTime(time);
      if (duration === 0 && adapter.getDuration()) {
        setDuration(adapter.getDuration());
      }
      // The player mutes itself when the browser blocks audible autoplay, so the icon can't just
      // follow this button's own clicks.
      if (adapter.isMuted) setIsMuted(adapter.isMuted());
    });

    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [adapter, duration]);

  const togglePlay = () => {
    if (isPlaying) adapter.pause();
    else adapter.play();
  };

  const toggleMute = () => {
    if (!adapter.setMuted) return;
    const next = !adapter.isMuted();
    adapter.setMuted(next);
    setIsMuted(next);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    adapter.seekTo(pos * duration);
  };

  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20 bg-gradient-to-t from-black/80 via-transparent to-black/40"
        >
          {/* Top Bar */}
          <div className="p-4 pointer-events-auto">
            <h3 className="text-white font-medium text-lg drop-shadow-md">{title}</h3>
          </div>

          {/* Bottom Bar */}
          <div className="p-4 pointer-events-auto w-full">
            {/* Progress Bar */}
            <div 
              className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer relative group"
              onClick={handleSeek}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-accent rounded-full pointer-events-none group-hover:bg-accent-glow transition-colors"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-accent transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
                <div className="text-white text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className={`transition-colors ${isMuted ? 'text-accent' : 'text-white hover:text-accent'}`}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()} 
                  className="text-white hover:text-accent transition-colors"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoControls;
