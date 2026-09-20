const { generateRoomId, generateParticipantId } = require('../utils/crypto');
const Room = require('../models/Room');
const logger = require('../utils/logger');
const presence = require('../websocket/presence');

// A participant that never connected (or whose socket died) but is younger than this may still be
// on its way; anything older without a socket is a ghost seat and can be reclaimed.
const GHOST_SEAT_MS = 15000;

class RoomService {
  async createRoom() {
    try {
      const roomId = generateRoomId();
      const room = new Room({
        roomId,
        status: 'waiting',
        participants: []
      });
      await room.save();
      logger.info(`Room created: ${roomId}`);
      return { roomId, status: room.status };
    } catch (error) {
      logger.error('Error creating room:', error);
      throw error;
    }
  }

  async joinRoom(roomId) {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) {
        throw new Error('Room not found');
      }

      if (room.status === 'closed' || room.status === 'closing') {
        throw new Error('Room is no longer active');
      }

      if (room.participants.length >= 2) {
        const now = Date.now();
        room.participants = room.participants.filter(p =>
          presence.has(roomId, p.id) || now - new Date(p.joinedAt).getTime() < GHOST_SEAT_MS
        );
      }

      if (room.participants.length >= 2) {
        throw new Error('Room is full');
      }

      const participantId = generateParticipantId();
      room.participants.push({ id: participantId, joinedAt: new Date() });
      
      if (room.participants.length === 2) {
        room.status = 'active';
      }

      room.lastActivity = new Date();
      await room.save();

      logger.info(`Participant ${participantId} joined room ${roomId}`);
      return { participantId, room };
    } catch (error) {
      logger.error(`Error joining room ${roomId}:`, error);
      throw error;
    }
  }

  async leaveRoom(roomId, participantId) {
    try {
      // Atomic pull: both seats are often released at the same moment and a document save
      // would trip mongoose's version check.
      const room = await Room.findOneAndUpdate(
        { roomId, 'participants.id': participantId },
        {
          $pull: { participants: { id: participantId } },
          $set: { status: 'waiting', lastActivity: new Date() }
        },
        { new: true }
      );

      if (room) {
        logger.info(`Participant ${participantId} left room ${roomId}. Room status: ${room.status}`);
        return room;
      }

      const existing = await Room.findOne({ roomId });
      if (!existing) {
        throw new Error('Room not found');
      }
      return existing; // participant was already gone
    } catch (error) {
      logger.error(`Error leaving room ${roomId}:`, error);
      throw error;
    }
  }

  async getRoom(roomId) {
    const room = await Room.findOne({ roomId });
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  async validateParticipant(roomId, participantId) {
    const room = await this.getRoom(roomId);
    const participant = room.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not in room');
    }
    return true;
  }
  
  async updateActivity(roomId) {
     await Room.updateOne({ roomId }, { $set: { lastActivity: new Date() } });
  }
}

module.exports = new RoomService();
