import React, { useEffect, useRef, useState } from 'react';
import { YouTubeAdapter } from '../../lib/videoSourceAdapter';
import { usePlaybackSync } from '../../hooks/usePlaybackSync';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import ResumeOverlay from './ResumeOverlay';

let apiPromise = null;

// The IFrame API script is loaded once per page; every player awaits the same promise.
const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === 'function') previous();
        resolve(window.YT);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
};

const errorMessage = (code) => {
  if (code === 101 || code === 150) return 'This video cannot be embedded. The owner has disabled playback outside YouTube.';
  if (code === 100) return 'This video was not found or is private.';
  if (code === 2) return 'That YouTube link looks invalid.';
  return 'An error occurred while loading the YouTube video.';
};

const YouTubePlayer = ({ videoId, start = 0, controlChannel }) => {
  const containerRef = useRef(null);
  const [adapter, setAdapter] = useState(null);
  const [error, setError] = useState(null);

  const { handlePlay, handlePause, handleSeek, playBlocked, resumePlayback } = usePlaybackSync(controlChannel, adapter);
  const syncRef = useRef({ handlePlay, handlePause, handleSeek });
  syncRef.current = { handlePlay, handlePause, handleSeek };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let player = null;
    let playerAdapter = null;
    setAdapter(null);
    setError(null);

    // YT.Player replaces the element it's given with an iframe, so hand it a throwaway child.
    const host = document.createElement('div');
    host.className = 'w-full h-full';
    container.appendChild(host);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(host, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          start: Math.max(0, Math.floor(start || 0)),
          origin: window.location.origin
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            playerAdapter = new YouTubeAdapter(player);
            playerAdapter.onStateChange((state) => {
              const time = playerAdapter.getCurrentTime();
              if (state === 'play') syncRef.current.handlePlay(time);
              else if (state === 'pause') syncRef.current.handlePause(time);
            });
            playerAdapter.onSeek((time) => syncRef.current.handleSeek(time));
            setAdapter(playerAdapter);
          },
          onError: (e) => {
            if (!cancelled) setError(errorMessage(e.data));
          }
        }
      });
    });

    return () => {
      cancelled = true;
      if (playerAdapter) playerAdapter.destroy();
      if (player && typeof player.destroy === 'function') {
        try { player.destroy(); } catch (e) { /* iframe already removed */ }
      }
      container.innerHTML = '';
    };
  }, [videoId, start]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4 text-center">
        <AlertCircle className="w-12 h-12 text-accent mb-4" />
        <p className="text-lg text-text-primary mb-4">{error}</p>
        <a href={`https://youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer">
          <Button variant="secondary">Open on YouTube</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative">
      <div ref={containerRef} className="w-full h-full" />
      {playBlocked && <ResumeOverlay onResume={resumePlayback} />}
    </div>
  );
};

export default YouTubePlayer;
