const express = require('express');
const roomService = require('../services/roomService');
const r2Service = require('../services/r2Service');
const cleanupService = require('../services/cleanupService');
const Room = require('../models/Room');
const VideoMeta = require('../models/VideoMeta');
const { validateRoomId, validateParticipantIdHeader } = require('../middleware/validators');
const { uploadInitiateLimiter } = require('../middleware/rateLimiter');

const router = express.Router({ mergeParams: true });

router.post('/upload', validateRoomId, validateParticipantIdHeader, uploadInitiateLimiter, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const participantId = req.headers['x-participant-id'];
    const { fileName, fileSize, contentType } = req.body;

    if (!fileName || !fileSize || !contentType) {
      return res.status(400).json({ error: { message: 'fileName, fileSize, and contentType are required' } });
    }

    await roomService.validateParticipant(roomId, participantId);

    const partSize = 10 * 1024 * 1024; // 10MB parts
    const partCount = Math.ceil(fileSize / partSize);

    const { uploadId, objectKey } = await r2Service.initiateMultipartUpload(roomId, fileName, contentType);

    const presignedUrls = [];
    for (let i = 1; i <= partCount; i++) {
      const url = await r2Service.getPresignedUploadUrl(objectKey, uploadId, i);
      presignedUrls.push({ partNumber: i, url });
    }

    await Room.findOneAndUpdate(
      { roomId },
      {
        video: {
          sourceType: 'r2',
          title: fileName,
          objectKey,
          objectSize: fileSize,
          uploadId,
          status: 'uploading'
        },
        lastActivity: new Date()
      }
    );

    res.status(200).json({
      uploadId,
      objectKey,
      partSize,
      presignedUrls
    });
  } catch (error) {
    if (error.message === 'Participant not in room') {
       return res.status(403).json({ error: { message: error.message, code: 'FORBIDDEN' }});
    }
    next(error);
  }
});

router.post('/complete', validateRoomId, validateParticipantIdHeader, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const participantId = req.headers['x-participant-id'];
    const { uploadId, objectKey, parts } = req.body;

    if (!uploadId || !objectKey || !Array.isArray(parts)) {
      return res.status(400).json({ error: { message: 'uploadId, objectKey, and parts array are required' } });
    }

    await roomService.validateParticipant(roomId, participantId);

    await r2Service.completeMultipartUpload(objectKey, uploadId, parts);

    const room = await Room.findOne({ roomId });
    room.video.status = 'ready';
    room.lastActivity = new Date();
    await room.save();

    await VideoMeta.create({
      roomId,
      objectKey,
      sourceType: 'r2',
      title: room.video.title
    });

    const playbackUrl = await r2Service.getPresignedPlaybackUrl(objectKey);

    res.status(200).json({ playbackUrl });
  } catch (error) {
    next(error);
  }
});

router.get('/url', validateRoomId, validateParticipantIdHeader, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const participantId = req.headers['x-participant-id'];
    
    await roomService.validateParticipant(roomId, participantId);

    const room = await Room.findOne({ roomId });
    if (!room || !room.video || room.video.status !== 'ready' || !room.video.objectKey) {
      return res.status(404).json({ error: { message: 'Video not ready or not found' } });
    }

    const playbackUrl = await r2Service.getPresignedPlaybackUrl(room.video.objectKey);
    res.status(200).json({ playbackUrl });
  } catch (error) {
    next(error);
  }
});

router.delete('/', validateRoomId, validateParticipantIdHeader, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const participantId = req.headers['x-participant-id'];
    
    await roomService.validateParticipant(roomId, participantId);

    const room = await Room.findOne({ roomId });
    if (room && room.video && room.video.objectKey) {
       await cleanupService.deleteVideoNow(roomId, room.video.objectKey);
       room.video = undefined;
       room.lastActivity = new Date();
       await room.save();
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
