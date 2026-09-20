import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Video, Heart, Globe, Shield } from 'lucide-react';

const Landing = () => {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { createRoom } = useRoom();
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    // Accept either the bare code or a pasted invite link
    const code = joinCode.trim().split('/').filter(Boolean).pop();
    if (code) {
      navigate(`/room/${code}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 pt-24 min-h-[100dvh]">
      <motion.div 
        className="max-w-4xl w-full text-center space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-text-primary">
            Watch together.
          </h1>
          <p className="text-xl sm:text-2xl text-text-secondary font-medium">
            Even when you're far apart. <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-block">❤️</motion.span>
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="max-w-md mx-auto w-full bg-elevated/50 p-6 sm:p-8 rounded-2xl border border-border backdrop-blur-md shadow-2xl">
          <div className="space-y-6">
            <Button size="lg" className="w-full text-lg h-14" onClick={createRoom}>
              Create New Room
            </Button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-text-secondary text-sm">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              {isJoining ? (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter Room Code" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" disabled={!joinCode.trim()}>Join</Button>
                </div>
              ) : (
                <Button variant="secondary" size="lg" className="w-full h-14" onClick={() => setIsJoining(true)}>
                  Join Existing Room
                </Button>
              )}
            </form>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-xl bg-secondary/30 border border-border/50">
            <Video className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Perfect Sync</h3>
            <p className="text-text-secondary text-sm">Watch YouTube, direct files, or your own uploads in perfect harmony.</p>
          </div>
          <div className="p-6 rounded-xl bg-secondary/30 border border-border/50">
            <Globe className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Crystal Clear</h3>
            <p className="text-text-secondary text-sm">Peer-to-peer video and audio chat so you can see every reaction.</p>
          </div>
          <div className="p-6 rounded-xl bg-secondary/30 border border-border/50">
            <Shield className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Private & Secure</h3>
            <p className="text-text-secondary text-sm">No accounts required. Chat and streams are fully encrypted P2P.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;
