const express = require('express');
const roomService = require('../services/roomService');
const { validateRoomId } = require('../middleware/validators');
const { createRoomLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', createRoomLimiter, async (req, res, next) => {
  try {
    const roomInfo = await roomService.createRoom();
    res.status(201).json(roomInfo);
  } catch (error) {
    next(error);
  }
});

router.post('/:roomId/join', validateRoomId, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const result = await roomService.joinRoom(roomId);
    res.status(200).json({
      participantId: result.participantId,
      room: {
        roomId: result.room.roomId,
        status: result.room.status,
        participantsCount: result.room.participants.length,
        participants: result.room.participants.map(p => p.id)
      }
    });
  } catch (error) {
    if (error.message === 'Room not found') {
      res.status(404).json({ error: { message: error.message, code: 'ROOM_NOT_FOUND' } });
    } else if (error.message === 'Room is full') {
      res.status(403).json({ error: { message: error.message, code: 'ROOM_FULL' } });
    } else if (error.message === 'Room is no longer active') {
      res.status(403).json({ error: { message: error.message, code: 'ROOM_INACTIVE' } });
    } else {
      next(error);
    }
  }
});

module.exports = router;
