import { useCallback, useEffect, useRef, useState } from 'react';

export const isScreenShareSupported = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getDisplayMedia === 'function';

// Sharing a tab is how you watch anything that refuses to be embedded - a streaming site, a
// service with DRM, a player that only works on its own page. Whoever has the movie open plays it
// in their own browser and the tab goes over the peer connection, so there is only ever one
// playback to keep in step: no play button on the other side, nothing to sync.
export const useScreenShare = ({ onStarted, onStopped } = {}) => {
  const [screenStream, setScreenStream] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const callbacksRef = useRef({});
  callbacksRef.current = { onStarted, onStopped };

  const stop = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    streamRef.current = null;
    stream.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    if (callbacksRef.current.onStopped) callbacksRef.current.onStopped();
  }, []);

  const start = useCallback(async () => {
    if (!isScreenShareSupported()) {
      setError("This browser can't share a screen. Use Chrome, Edge or Firefox on a computer.");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 60 } },
        // Tab audio is how the partner hears the movie; Chrome offers it as "Also share tab audio".
        // The voice-call filters would wreck it, so they stay off.
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      setError(null);
      streamRef.current = stream;
      setScreenStream(stream);
      // The browser's own "Stop sharing" bar ends the track without going through our button.
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', stop));
      if (callbacksRef.current.onStarted) callbacksRef.current.onStarted(stream);
      return stream;
    } catch (err) {
      // Dismissing the picker isn't a failure worth shouting about.
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') setError(err.message);
      return null;
    }
  }, [stop]);

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  }, []);

  return {
    screenStream,
    isSharing: !!screenStream,
    start,
    stop,
    error,
    isSupported: isScreenShareSupported()
  };
};
