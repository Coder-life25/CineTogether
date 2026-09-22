import { useState, useCallback } from 'react';
import { api, setParticipantId as setApiParticipantId } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const useRoom = () => {
  const [roomState, setRoomState] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const createRoom = useCallback(async () => {
    try {
      const res = await api.createRoom();
      setRoomId(res.roomId);
      navigate(`/room/${res.roomId}`);
    } catch (err) {
      setError(err.message);
    }
  }, [navigate]);

  const joinRoom = useCallback(async (id) => {
    try {
      const res = await api.joinRoom(id);
      setRoomId(id);
      setApiParticipantId(res.participantId); // every video/upload call is authorised with it
      setParticipantId(res.participantId);
      setRoomState(res.room);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomState(null);
    setRoomId(null);
    setApiParticipantId(null);
    setParticipantId(null);
    navigate('/');
  }, [navigate]);

  return { createRoom, joinRoom, leaveRoom, roomState, roomId, participantId, error };
};
