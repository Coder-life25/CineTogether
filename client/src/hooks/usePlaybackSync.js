import { useEffect, useRef, useCallback, useState } from 'react';
import { PlaybackSyncEngine } from '../lib/playbackSync';

// Bridges a player adapter with the partner over the sync channel (peer-to-peer when the data
// channel is up, relayed through the signaling socket when it isn't).
export const usePlaybackSync = (controlChannel, adapter) => {
  const engineRef = useRef(null);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [autoMuted, setAutoMuted] = useState(false);

  useEffect(() => {
    if (!adapter || !controlChannel) return;
    setPlayBlocked(false);

    const engine = new PlaybackSyncEngine({
      onSeek: (pos) => adapter.seekTo(pos),
      onPlay: () => adapter.play({ fromPartner: true }),
      onPause: () => adapter.pause(),
      getPosition: () => adapter.getCurrentTime(),
      isPlaying: () => adapter.isPlaying(),
      onPlayBlocked: () => setPlayBlocked(true)
    });
    engineRef.current = engine;

    const offMessage = controlChannel.onMessage((data) => {
      if (!data) return;
      if (data.type === 'sync_event') {
        engine.handleRemoteEvent(data.payload);
      } else if (data.type === 'request_sync_state') {
        controlChannel.send({ type: 'sync_state', payload: engine.getSyncState() });
      } else if (data.type === 'sync_state') {
        engine.applySyncState(data.payload);
      }
    });

    // Catch up with the partner (they may already be mid-movie)
    const requestState = () => controlChannel.send({ type: 'request_sync_state' });
    if (controlChannel.readyState === 'open') requestState();
    const offOpen = controlChannel.onOpen(requestState);

    return () => {
      offMessage();
      offOpen();
      engine.destroy();
      engineRef.current = null;
    };
  }, [adapter, controlChannel]);

  // The player starts muted when the browser refuses audible autoplay, so playback still follows
  // the partner; the UI offers a tap that brings the sound back.
  useEffect(() => {
    if (!adapter || typeof adapter.onAutoMute !== 'function') {
      setAutoMuted(false);
      return;
    }
    return adapter.onAutoMute(setAutoMuted);
  }, [adapter]);

  const emit = useCallback((event) => {
    if (event && controlChannel) controlChannel.send({ type: 'sync_event', payload: event });
  }, [controlChannel]);

  const handlePlay = useCallback((pos) => {
    setPlayBlocked(false);
    if (engineRef.current) emit(engineRef.current.handleLocalPlay(pos));
  }, [emit]);

  const handlePause = useCallback((pos) => {
    if (engineRef.current) emit(engineRef.current.handleLocalPause(pos));
  }, [emit]);

  const handleSeek = useCallback((pos) => {
    if (engineRef.current) emit(engineRef.current.handleLocalSeek(pos));
  }, [emit]);

  // Must run inside a click handler so the browser lets playback start
  const resumePlayback = useCallback(() => {
    setPlayBlocked(false);
    if (engineRef.current) engineRef.current.resume();
  }, []);

  // Same: unmuting without a gesture makes Safari pause the video again.
  const unmute = useCallback(() => {
    if (adapter && typeof adapter.unmute === 'function') adapter.unmute();
  }, [adapter]);

  return { handlePlay, handlePause, handleSeek, playBlocked, resumePlayback, autoMuted, unmute };
};
