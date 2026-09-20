import React, { useState, useEffect } from 'react';
import VideoPlayer from '../video/VideoPlayer';
import VideoSourcePicker from '../video/VideoSourcePicker';
import FloatingCamera from '../webrtc/FloatingCamera';
import MediaControls from '../webrtc/MediaControls';
import ChatPanel from '../chat/ChatPanel';
import ChatDrawer from '../chat/ChatDrawer';
import ReactionBar from '../reactions/ReactionBar';
import ConnectionIndicator from './ConnectionIndicator';
import { Button } from '../ui/Button';
import { LogOut, Film, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WatchRoom = ({ roomId, partnerPresent = true, videoSource, onVideoChange, localStream, remoteStream, dataChannels, connectionState, mediaState }) => {
  const [showPicker, setShowPicker] = useState(!videoSource);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  // The partner picking a video closes our picker too
  useEffect(() => {
    if (videoSource) setShowPicker(false);
  }, [videoSource]);

  const handleSourceSelect = (source) => {
    onVideoChange(source);
    setShowPicker(false);
  };

  const handleLeave = () => {
    navigate('/');
  };

  return (
    // Fixed viewport height so the player's percentage sizing resolves (min-h-screen wouldn't)
    <div className="h-dvh flex overflow-hidden relative">
      <div className="flex-1 flex flex-col relative h-full min-w-0 min-h-0">
        {/* Top Bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <ConnectionIndicator state={connectionState} />
          </div>
          <div className="pointer-events-auto">
            <Button variant="ghost" size="sm" onClick={handleLeave} icon={LogOut}>Leave</Button>
          </div>
        </div>

        {!partnerPresent && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-secondary/90 backdrop-blur-sm border border-border px-4 py-2 rounded-full text-sm text-text-primary shadow-lg whitespace-nowrap">
            <WifiOff className="w-4 h-4 text-accent" />
            Partner disconnected — waiting for them to come back…
          </div>
        )}

        {/* Video Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center min-h-0">
          {videoSource ? (
            <VideoPlayer 
              source={videoSource} 
              controlChannel={dataChannels.control}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-text-secondary">
              <Film className="w-12 h-12 opacity-40" />
              <p>No video selected yet</p>
              <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>Choose a video</Button>
            </div>
          )}

          {/* Floating Cameras */}
          <div className="absolute bottom-24 left-4 z-40 flex flex-col gap-4 pointer-events-none">
            {remoteStream && (
              <div className="pointer-events-auto">
                <FloatingCamera stream={remoteStream} name="Partner" />
              </div>
            )}
            {localStream && (
              <div className="pointer-events-auto">
                <FloatingCamera stream={localStream} name="Me" isLocal muted={!mediaState.isMicOn} />
              </div>
            )}
          </div>

        </div>

        {/* Controls Bar */}
        <div className="h-16 flex-shrink-0 bg-secondary border-t border-border flex items-center justify-between px-4 z-30">
          <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>
            Change Video
          </Button>
          {/* Lives in the bar (not over the player) so it never covers the video's own controls */}
          <div className="relative hidden sm:block">
            <ReactionBar reactionsChannel={dataChannels.reactions} />
          </div>
          <MediaControls {...mediaState} />
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setIsChatOpen(true)}>
            Chat
          </Button>
        </div>
      </div>

      {/* Desktop Chat Sidebar */}
      <div className="hidden lg:block w-80 border-l border-border bg-secondary flex-shrink-0 relative z-20">
        <ChatPanel chatChannel={dataChannels.chat} />
      </div>

      {/* Mobile Chat Drawer */}
      <div className="lg:hidden z-50">
        <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} chatChannel={dataChannels.chat} />
      </div>

      {/* Video Picker Modal */}
      {showPicker && (
        <VideoSourcePicker 
          roomId={roomId}
          isOpen={showPicker} 
          onClose={() => videoSource && setShowPicker(false)} 
          onSelect={handleSourceSelect} 
        />
      )}
    </div>
  );
};

export default WatchRoom;
