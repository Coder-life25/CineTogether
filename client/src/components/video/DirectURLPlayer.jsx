import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { HTML5Adapter } from '../../lib/videoSourceAdapter';
import { usePlaybackSync } from '../../hooks/usePlaybackSync';
import VideoControls from './VideoControls';
import ResumeOverlay from './ResumeOverlay';

const fileName = (url) => {
  try {
    const name = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '');
    return name || 'Video';
  } catch (e) {
    return 'Video';
  }
};

const DirectURLPlayer = ({ url, controlChannel, title }) => {
  const videoRef = useRef(null);
  const [adapter, setAdapter] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    const instance = new HTML5Adapter(video);
    setAdapter(instance);
    return () => {
      instance.destroy();
      setAdapter(null);
    };
  }, [url]);

  const { handlePlay, handlePause, handleSeek, playBlocked, resumePlayback } = usePlaybackSync(controlChannel, adapter);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center group">
      <video
        ref={videoRef}
        src={url}
        playsInline
        preload="metadata"
        className="max-w-full max-h-full w-full h-full object-contain"
        onPlay={(e) => handlePlay(e.target.currentTime)}
        onPause={(e) => handlePause(e.target.currentTime)}
        onSeeked={(e) => handleSeek(e.target.currentTime)}
        onError={() => setError("This video couldn't be loaded. Check that the link opens directly in a browser tab.")}
      />
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center z-30">
          <AlertCircle className="w-12 h-12 text-accent mb-4" />
          <p className="text-lg text-text-primary mb-2">{error}</p>
          <p className="text-sm text-text-secondary break-all max-w-lg">{url}</p>
        </div>
      ) : adapter && (
        <VideoControls adapter={adapter} title={title || fileName(url)} />
      )}
      {!error && playBlocked && <ResumeOverlay onResume={resumePlayback} />}
    </div>
  );
};

export default DirectURLPlayer;
