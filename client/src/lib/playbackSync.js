import { SYNC_THRESHOLD, EVENT_DEDUP_WINDOW, ECHO_PLAY_PAUSE_MS, ECHO_SEEK_MS, ECHO_SEEK_TOLERANCE, PLAY_CONFIRM_MS } from './constants';
import { v4 as uuidv4 } from 'uuid';

// Keeps two players in step. Local player events become sync events for the partner; remote sync
// events drive the local player. Driving the local player makes it fire the very same events, so
// each remote command registers the one echo it expects and that echo is swallowed instead of
// being bounced back. Anything else the user does in the meantime still goes out.
export class PlaybackSyncEngine {
  constructor({ onSeek, onPlay, onPause, getPosition, isPlaying, onPlayBlocked }) {
    this.onSeek = onSeek;
    this.onPlay = onPlay;
    this.onPause = onPause;
    this.getPosition = getPosition;
    this.isPlaying = isPlaying;
    this.onPlayBlocked = onPlayBlocked;
    this.remote = null; // last known partner state: { position, playing, at }
    this.recentEvents = new Set();
    this.expectedPlayUntil = 0;
    this.expectedPauseUntil = 0;
    this.expectedSeeks = []; // [{ position, until }]
    this.timers = new Set();
  }

  _later(fn, ms) {
    const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
    this.timers.add(id);
  }

  _seek(position) {
    this.expectedSeeks.push({ position, until: Date.now() + ECHO_SEEK_MS });
    this.onSeek(position);
  }

  _play() {
    this.expectedPlayUntil = Date.now() + ECHO_PLAY_PAUSE_MS;
    this.onPlay();
    // Browsers refuse to start audible playback on a page the user hasn't touched yet (a partner
    // who opened the invite link straight from the address bar, or just refreshed). Surface it so
    // the UI can offer a click that resumes at the partner's position.
    this._later(() => {
      if (!this.isPlaying() && this.onPlayBlocked) this.onPlayBlocked();
    }, PLAY_CONFIRM_MS);
  }

  _remember(position, playing) {
    this.remote = { position, playing, at: Date.now() };
  }

  // Where the partner should be right now, extrapolated from the last thing we heard.
  remotePosition() {
    if (!this.remote) return this.getPosition();
    const elapsed = this.remote.playing ? (Date.now() - this.remote.at) / 1000 : 0;
    return this.remote.position + elapsed;
  }

  // Called from a user gesture once playback was blocked: catch up and play.
  resume() {
    if (this.remote && !this.remote.playing) return;
    this._seek(this.remotePosition());
    this.expectedPlayUntil = Date.now() + ECHO_PLAY_PAUSE_MS;
    this.onPlay();
  }

  _pause() {
    this.expectedPauseUntil = Date.now() + ECHO_PLAY_PAUSE_MS;
    this.onPause();
  }

  _consumeExpectedSeek(position) {
    const now = Date.now();
    this.expectedSeeks = this.expectedSeeks.filter(e => e.until > now);
    const idx = this.expectedSeeks.findIndex(e => Math.abs(e.position - position) <= ECHO_SEEK_TOLERANCE);
    if (idx === -1) return false;
    this.expectedSeeks.splice(idx, 1);
    return true;
  }

  createEvent(type, position) {
    return { type, position, sentAt: Date.now(), eventId: uuidv4() };
  }

  handleLocalPlay(position) {
    if (Date.now() < this.expectedPlayUntil) {
      this.expectedPlayUntil = 0;
      return null;
    }
    return this.createEvent('play', position);
  }

  handleLocalPause(position) {
    if (Date.now() < this.expectedPauseUntil) {
      this.expectedPauseUntil = 0;
      return null;
    }
    return this.createEvent('pause', position);
  }

  handleLocalSeek(position) {
    if (this._consumeExpectedSeek(position)) return null;
    return this.createEvent('seek', position);
  }

  handleRemoteEvent(event) {
    if (!event || this.recentEvents.has(event.eventId)) return;
    this.recentEvents.add(event.eventId);
    this._later(() => this.recentEvents.delete(event.eventId), EVENT_DEDUP_WINDOW);

    const currentPos = this.getPosition();
    const networkDelay = Math.max(0, (Date.now() - event.sentAt) / 1000);
    let targetPosition = event.position;

    if (event.type === 'play' || event.type === 'seek') {
      if (event.type === 'play') targetPosition += networkDelay;
      this._remember(targetPosition, event.type === 'play' || (this.remote ? this.remote.playing : false));
      if (Math.abs(currentPos - targetPosition) > SYNC_THRESHOLD) {
        this._seek(targetPosition);
      }
      if (event.type === 'play' && !this.isPlaying()) {
        this._play();
      }
    } else if (event.type === 'pause') {
      this._remember(targetPosition, false);
      if (Math.abs(currentPos - targetPosition) > SYNC_THRESHOLD) {
        this._seek(targetPosition);
      }
      if (this.isPlaying()) {
        this._pause();
      }
    }
  }

  getSyncState() {
    return {
      position: this.getPosition(),
      playing: this.isPlaying(),
      timestamp: Date.now()
    };
  }

  applySyncState(state) {
    if (!state) return;
    const networkDelay = Math.max(0, (Date.now() - state.timestamp) / 1000);
    const targetPos = state.playing ? state.position + networkDelay : state.position;
    this._remember(targetPos, state.playing);
    if (Math.abs(this.getPosition() - targetPos) > SYNC_THRESHOLD) {
      this._seek(targetPos);
    }
    if (state.playing && !this.isPlaying()) this._play();
    if (!state.playing && this.isPlaying()) this._pause();
  }

  destroy() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }
}
