const allowedTypes = [
  'webrtc_offer',
  'webrtc_answer',
  'webrtc_ice_candidate',
  'video_change'
];

const VIDEO_SOURCE_TYPES = ['r2', 'youtube', 'direct', 'facebook', 'instagram'];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_URL_LENGTH = 2048;

function isHttpUrl(value) {
  return typeof value === 'string' && value.length <= MAX_URL_LENGTH && /^https?:\/\//i.test(value);
}

function validateVideoSource(source) {
  if (!source || typeof source !== 'object' || !VIDEO_SOURCE_TYPES.includes(source.type)) {
    throw new Error('Invalid video source');
  }
  if (source.type === 'youtube') {
    if (!YOUTUBE_ID.test(source.videoId)) throw new Error('Invalid YouTube video id');
    if (source.start !== undefined && !(Number.isFinite(source.start) && source.start >= 0)) {
      throw new Error('Invalid YouTube start time');
    }
    return;
  }
  if (!isHttpUrl(source.url)) throw new Error('Invalid video url');
  if ((source.type === 'facebook' || source.type === 'instagram') && !isHttpUrl(source.embedUrl)) {
    throw new Error('Invalid embed url');
  }
}

function validateMessage(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Message must be a JSON object');
  }

  if (!data.type || !allowedTypes.includes(data.type)) {
    throw new Error(`Invalid or missing message type: ${data.type}`);
  }

  if (data.type === 'webrtc_offer' || data.type === 'webrtc_answer') {
    if (!data.payload || !data.payload.sdp) {
      throw new Error('Missing sdp for offer/answer');
    }
  }

  if (data.type === 'webrtc_ice_candidate') {
    if (!data.payload || !data.payload.candidate) {
      throw new Error('Missing candidate info for ice-candidate');
    }
  }

  if (data.type === 'video_change') {
    validateVideoSource(data.payload && data.payload.source);
  }
}

module.exports = { validateMessage, validateVideoSource };
