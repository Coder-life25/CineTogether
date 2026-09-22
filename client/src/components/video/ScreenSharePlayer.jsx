import React, { useEffect, useRef, useState } from 'react';
import { MonitorUp, MonitorOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import UnmuteChip from './UnmuteChip';

// One screen, two viewers: playback happens once, on the sharer's machine, so the two sides can't
// drift apart and there is nothing for the playback sync engine to do here.
const ScreenSharePlayer = ({ stream, isSharer, onStop }) => {
  const videoRef = useRef(null);
  const [autoMuted, setAutoMuted] = useState(false);
  const [waiting, setWaiting] = useState(!isSharer);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    // Never play your own capture back at yourself - that is where the feedback howl comes from.
    video.muted = isSharer;
    setAutoMuted(false);

    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        video.muted = true;
        setAutoMuted(!isSharer);
        video.play().catch(() => {});
      });
    }
    return () => { video.srcObject = null; };
  }, [stream, isSharer]);

  // The slot that carries the screen is negotiated up front, so the track exists before anyone
  // shares anything - it just sits muted until frames actually flow. That, and not the track
  // appearing, is what tells us the partner's screen is on its way.
  useEffect(() => {
    if (isSharer || !stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) {
      setWaiting(true);
      return;
    }
    const update = () => setWaiting(track.muted);
    update();
    track.addEventListener('mute', update);
    track.addEventListener('unmute', update);
    return () => {
      track.removeEventListener('mute', update);
      track.removeEventListener('unmute', update);
    };
  }, [stream, isSharer]);

  const unmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setAutoMuted(false);
    video.play().catch(() => {});
  };

  const showWaiting = !stream || waiting;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-w-full max-h-full w-full h-full object-contain"
      />
      {showWaiting && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black text-text-secondary">
          <Spinner size="lg" />
          <p>{isSharer ? 'Starting your screen share…' : 'Waiting for your partner’s screen…'}</p>
        </div>
      )}
      {!showWaiting && autoMuted && <UnmuteChip onUnmute={unmute} />}
      {isSharer && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-secondary/90 backdrop-blur-sm border border-border px-4 py-2 shadow-lg">
          <span className="flex items-center gap-2 text-sm text-text-primary whitespace-nowrap">
            <MonitorUp className="w-4 h-4 text-accent" />
            You&apos;re sharing your screen
          </span>
          <Button variant="secondary" size="sm" onClick={onStop} icon={MonitorOff}>Stop</Button>
        </div>
      )}
    </div>
  );
};

export default ScreenSharePlayer;
