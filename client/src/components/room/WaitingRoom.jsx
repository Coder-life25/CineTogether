import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Link as LinkIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import CameraPreview from '../webrtc/CameraPreview';

const WaitingRoom = ({ roomId, localStream, isConnected }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/room/${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-elevated border border-border rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6"
      >
        <div className="relative w-full aspect-video bg-secondary rounded-xl overflow-hidden mb-6 border border-border">
          {localStream ? (
            <CameraPreview stream={localStream} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
              Camera initializing...
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-full mb-2">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-2xl font-bold">Waiting for partner...</h2>
          <p className="text-text-secondary text-sm">
            {isConnected ? 'Connected to signaling server.' : 'Connecting...'}
          </p>
        </div>

        <div className="bg-secondary p-4 rounded-xl border border-border space-y-3">
          <p className="text-sm font-medium text-left text-text-secondary">Invite Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-primary px-3 py-2 rounded-lg text-sm font-mono text-text-primary truncate border border-border/50">
              {inviteLink}
            </div>
            <Button variant="secondary" onClick={handleCopy} icon={copied ? Check : Copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-12 h-12 rounded-full border-2 border-accent border-dashed flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-accent" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default WaitingRoom;
