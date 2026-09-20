import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useWebRTC } from '../hooks/useWebRTC';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';
import WaitingRoom from '../components/room/WaitingRoom';
import WatchRoom from '../components/room/WatchRoom';

const ROOM_FULL_RETRY_MS = 1500;
const ROOM_FULL_RETRIES = 4; // a partner's refreshed tab frees its seat within a few seconds

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { joinRoom, participantId } = useRoom();
  const { addToast } = useToast();

  const [status, setStatus] = useState('loading'); // loading, waiting, active, closed
  const [hadPartner, setHadPartner] = useState(false); // once true, a dropped partner no longer resets the room
  const [peerId, setPeerId] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const videoSourceRef = useRef(null);
  const joinedRoomRef = useRef(null);
  videoSourceRef.current = videoSource;

  useEffect(() => {
    if (!roomId || joinedRoomRef.current === roomId) return; // StrictMode re-runs effects; join once
    joinedRoomRef.current = roomId;

    const attempt = (retriesLeft) => joinRoom(roomId)
      .then((res) => {
        const partner = (res.room.participants || []).find(id => id !== res.participantId) || null;
        setPeerId(partner);
        setStatus(partner ? 'active' : 'waiting');
        if (partner) setHadPartner(true);
      })
      .catch((err) => {
        // A partner who just refreshed is still counted for a moment - give the server time to notice.
        if (retriesLeft > 0 && err.code === 'ROOM_FULL') {
          setTimeout(() => attempt(retriesLeft - 1), ROOM_FULL_RETRY_MS);
          return;
        }
        addToast(err.code === 'ROOM_FULL' ? 'Room is full' : 'Room not found', 'error');
        navigate('/');
      });

    attempt(ROOM_FULL_RETRIES);
  }, [roomId, joinRoom, navigate, addToast]);

  const { ws, isConnected } = useWebSocket(roomId, participantId);
  const { localStream, isCameraOn, isMicOn, toggleCamera, toggleMic } = useMediaDevices();
  const { remoteStream, connectionState, dataChannels } = useWebRTC({
    ws, isConnected, localStream, roomId, participantId, peerId
  });

  const changeVideo = useCallback((source) => {
    setVideoSource(source);
    if (ws) ws.send('video_change', { source });
  }, [ws]);

  useEffect(() => {
    if (!ws) return;
    const offs = [
      ws.onMessage('participant_joined', ({ participantId: joinedId }) => {
        setPeerId(joinedId);
        setStatus('active');
        setHadPartner(true);
        addToast('Partner joined!', 'success');
        // Bring a late (or reconnecting) partner onto whatever is playing right now
        if (videoSourceRef.current) ws.send('video_change', { source: videoSourceRef.current });
      }),
      ws.onMessage('participant_left', () => {
        setPeerId(null);
        setStatus('waiting');
        addToast('Partner left the room', 'warning');
      }),
      ws.onMessage('video_change', (data) => {
        if (data && data.source) setVideoSource(data.source);
      }),
      ws.onMessage('room_closed', () => {
        setStatus('closed');
        addToast('Room was closed', 'info');
        setTimeout(() => navigate('/'), 2000);
      })
    ];
    return () => offs.forEach(off => off());
  }, [ws, addToast, navigate]);

  if (status === 'loading') {
    return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (status === 'closed') {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Room Closed</h2>
          <p className="text-text-secondary">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  // The lobby is only for the first wait. If the partner drops mid-movie the watch room stays up
  // (video keeps its position) and they get pulled back into sync when they return.
  const showLobby = status === 'waiting' && !hadPartner;

  return (
    <>
      {showLobby && (
        <WaitingRoom 
          roomId={roomId} 
          localStream={localStream} 
          isConnected={isConnected} 
        />
      )}
      {!showLobby && (
        <WatchRoom 
          roomId={roomId}
          participantId={participantId}
          partnerPresent={status === 'active'}
          videoSource={videoSource}
          onVideoChange={changeVideo}
          localStream={localStream}
          remoteStream={remoteStream}
          dataChannels={dataChannels}
          connectionState={connectionState}
          mediaState={{ isCameraOn, isMicOn, toggleCamera, toggleMic }}
        />
      )}
    </>
  );
};

export default Room;
