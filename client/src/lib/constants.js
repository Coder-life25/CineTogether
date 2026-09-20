export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws';

export const SYNC_THRESHOLD = 1.0; // seconds of drift tolerated before we seek
export const DRIFT_CHECK_INTERVAL = 3000; // ms
export const EVENT_DEDUP_WINDOW = 500; // ms
// After we drive the player on the partner's behalf, its own play/pause/seek event is an echo:
export const ECHO_PLAY_PAUSE_MS = 1500; // how long we wait for that echo before forgetting it
export const ECHO_SEEK_MS = 2500;       // seeks can buffer before the player reports them
export const ECHO_SEEK_TOLERANCE = 1.5; // seconds - players land near, not exactly on, the target
export const PLAY_CONFIRM_MS = 1500;    // remote play that hasn't started by then was blocked by the browser

export const PART_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_CONCURRENT_UPLOADS = 3;

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const REACTION_EMOJIS = ['❤️', '😂', '😮', '👏', '🔥', '😢', '🎉'];
