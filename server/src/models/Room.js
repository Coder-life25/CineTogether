const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const videoSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: ['r2', 'youtube', 'direct', 'embed']
  },
  title: String,
  url: String,
  objectKey: String,
  objectSize: Number,
  uploadId: String,
  status: {
    type: String,
    enum: ['uploading', 'ready', 'deleted']
  }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'closing', 'closed'],
    default: 'waiting'
  },
  participants: {
    type: [participantSchema],
    validate: [arrayLimit, '{PATH} exceeds the limit of 2']
  },
  video: videoSchema,
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

function arrayLimit(val) {
  return val.length <= 2;
}

roomSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', roomSchema);
