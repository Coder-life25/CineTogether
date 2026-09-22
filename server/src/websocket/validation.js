const allowedTypes = [
  'webrtc_offer',
  'webrtc_answer',
  'webrtc_ice_candidate',
  'video_change',
  'sync'
];

// Playback control relayed for pairs whose peer connection never came up. Chat and reactions are
// deliberately absent: those stay peer-to-peer and never touch the server.
const SYNC_TYPES = ['sync_event', 'request_sync_state', 'sync_state'];

const VIDEO_SOURCE_TYPES = ['r2', 'youtube', 'direct', 'facebook', 'instagram', 'screen'];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_URL_LENGTH = 2048;

function isHttpUrl(value) {
  return typeof value === 'string' && value.length <= MAX_URL_LENGTH && /^https?:\/\//i.test(value);
}

function validateVideoSource(source) {
  if (!source || typeof source !== 'object' || !VIDEO_SOURCE_TYPES.includes(source.type)) {
    throw new Error('Invalid video source');
  }
  // A shared screen is carried by the peer connection itself, so it has nothing to point at.
  if (source.type === 'screen') return;

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
    if (!data.payload || typeof data.payload !== 'object' || !('source' in data.payload)) {
      throw new Error('Missing source for video_change');
    }
    // null clears the room's video - what a finished screen share sends.
    if (data.payload.source !== null) validateVideoSource(data.payload.source);
  }

  if (data.type === 'sync') {
    const inner = data.payload && data.payload.data;
    if (!inner || typeof inner !== 'object' || !SYNC_TYPES.includes(inner.type)) {
      throw new Error('Invalid sync payload');
    }
  }
}

module.exports = { validateMessage, validateVideoSource };
