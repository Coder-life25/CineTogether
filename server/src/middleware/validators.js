const { validate: isUuid } = require('uuid');

function validateRoomId(req, res, next) {
  const roomId = req.params.roomId;
  if (!roomId || typeof roomId !== 'string' || roomId.length !== 8 || !/^[0-9a-zA-Z]+$/.test(roomId)) {
    return res.status(400).json({ error: { message: 'Invalid room ID format', code: 'INVALID_ROOM_ID' } });
  }
  next();
}

function validateParticipantIdHeader(req, res, next) {
  const participantId = req.headers['x-participant-id'];
  if (!participantId || !isUuid(participantId)) {
     return res.status(400).json({ error: { message: 'Invalid or missing X-Participant-Id header', code: 'INVALID_PARTICIPANT_ID' } });
  }
  next();
}

module.exports = {
  validateRoomId,
  validateParticipantIdHeader
};
