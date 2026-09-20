const mongoose = require('mongoose');

const videoMetaSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  objectKey: {
    type: String,
    required: true,
    index: true
  },
  sourceType: {
    type: String,
    required: true
  },
  title: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  safetyExpiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'deleted'],
    default: 'active'
  }
});

videoMetaSchema.pre('validate', function(next) {
  if (this.isNew) {
    if (!this.expiresAt) {
      this.expiresAt = new Date(this.createdAt.getTime() + 6 * 60 * 60 * 1000); // 6 hours
    }
    if (!this.safetyExpiresAt) {
      this.safetyExpiresAt = new Date(this.createdAt.getTime() + 12 * 60 * 60 * 1000); // 12 hours
    }
  }
  next();
});

module.exports = mongoose.model('VideoMeta', videoMetaSchema);
