// Browsers refuse audible playback on a page the viewer hasn't clicked yet, but muted playback is
// always allowed. So when the partner presses play and our play() is refused, we start muted and
// stay in step - the viewer taps once for sound instead of having to press play themselves.
const MUTED_FALLBACK_DELAY_MS = 600; // YouTube reports no promise, so we check whether it started

export class HTML5Adapter {
  constructor(videoElement) {
    this.video = videoElement;
    this.listeners = [];
    this.muteListeners = new Set();
    this.autoMuted = false;
    this.pendingSeek = null;
    this.seekWatcherBound = false;
    this._listen('volumechange', () => this._emitMute());
  }
  // `fromPartner` marks a play the sync engine drove. A play the viewer clicked themselves is a
  // user gesture, so it is never refused and never needs the muted fallback.
  play({ fromPartner = false } = {}) {
    const attempt = this.video.play();
    if (!attempt || typeof attempt.catch !== 'function') return Promise.resolve();
    return attempt.catch(() => {
      if (!fromPartner) return;
      this.video.muted = true;
      this.autoMuted = true;
      this._emitMute();
      return this.video.play().catch(() => {});
    });
  }
  pause() { this.video.pause(); }
  seekTo(seconds) {
    // currentTime is dropped while the browser still has no metadata, which is exactly when a
    // late joiner is handed the catch-up position. Hold it until the metadata lands.
    if (this.video.readyState === 0) {
      this.pendingSeek = seconds;
      if (!this.seekWatcherBound) {
        this.seekWatcherBound = true;
        this._listen('loadedmetadata', () => {
          if (this.pendingSeek === null) return;
          this.video.currentTime = this.pendingSeek;
          this.pendingSeek = null;
        });
      }
      return;
    }
    this.pendingSeek = null;
    this.video.currentTime = seconds;
  }
  getCurrentTime() {
    return this.pendingSeek !== null ? this.pendingSeek : this.video.currentTime;
  }
  getDuration() { return this.video.duration || 0; }
  isPlaying() { return !this.video.paused && !this.video.ended; }
  isReady() { return this.video.readyState >= 2; }
  isMuted() { return this.video.muted; }
  // Must be called from a click: Safari pauses a muted video that is unmuted without a gesture,
  // so a video that was running gets nudged back. A paused one stays paused - turning the sound
  // on is not a request to start the movie, and it would push a play at the partner.
  unmute() {
    const wasPlaying = this.isPlaying();
    this.autoMuted = false;
    this.video.muted = false;
    this._emitMute();
    return wasPlaying ? this.play() : Promise.resolve();
  }
  setMuted(muted) {
    if (!muted) return this.unmute();
    this.video.muted = true;
    this._emitMute();
    return Promise.resolve();
  }
  isAutoMuted() { return this.autoMuted && this.video.muted; }
  onAutoMute(callback) {
    this.muteListeners.add(callback);
    callback(this.isAutoMuted());
    return () => this.muteListeners.delete(callback);
  }
  _emitMute() {
    if (!this.video.muted) this.autoMuted = false;
    this.muteListeners.forEach(listener => listener(this.isAutoMuted()));
  }
  _listen(event, handler) {
    this.video.addEventListener(event, handler);
    this.listeners.push([event, handler]);
  }
  onStateChange(callback) {
    this._listen('play', () => callback('play'));
    this._listen('pause', () => callback('pause'));
    this._listen('ended', () => callback('ended'));
  }
  onTimeUpdate(callback) {
    this._listen('timeupdate', () => callback(this.getCurrentTime()));
    this._listen('loadedmetadata', () => callback(this.getCurrentTime()));
  }
  destroy() {
    this.listeners.forEach(([event, handler]) => this.video.removeEventListener(event, handler));
    this.listeners = [];
    this.muteListeners.clear();
  }
}

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;
const YT_ENDED = 0;
const SEEK_POLL_MS = 500;
const SEEK_JUMP_SECONDS = 1.5;

export class YouTubeAdapter {
  constructor(player) {
    this.player = player;
    this.stateHandlers = [];
    this.intervals = [];
    this.timers = new Set();
    this.muteListeners = new Set();
    this.autoMuted = false;
  }
  play({ fromPartner = false } = {}) {
    this.player.playVideo();
    if (!fromPartner) return;
    // The iframe API resolves nothing, so we look back a beat later: still not playing means the
    // browser refused it, and muted playback is the way to stay in sync without a click.
    const id = setTimeout(() => {
      this.timers.delete(id);
      if (this.isPlaying()) return;
      this.player.mute();
      this.autoMuted = true;
      this._emitMute();
      this.player.playVideo();
    }, MUTED_FALLBACK_DELAY_MS);
    this.timers.add(id);
  }
  pause() { this.player.pauseVideo(); }
  seekTo(seconds) { this.player.seekTo(seconds, true); }
  getCurrentTime() { return this.player.getCurrentTime() || 0; }
  getDuration() { return this.player.getDuration() || 0; }
  isPlaying() {
    const state = this.player.getPlayerState();
    return state === YT_PLAYING || state === YT_BUFFERING;
  }
  isReady() { return typeof this.player.playVideo === 'function'; }
  isMuted() {
    try { return this.player.isMuted(); } catch (e) { return false; }
  }
  unmute() {
    const wasPlaying = this.isPlaying();
    this.autoMuted = false;
    this.player.unMute();
    this._emitMute();
    if (wasPlaying) this.player.playVideo();
  }
  setMuted(muted) {
    if (!muted) return this.unmute();
    this.player.mute();
    this._emitMute();
  }
  isAutoMuted() { return this.autoMuted && this.isMuted(); }
  onAutoMute(callback) {
    this.muteListeners.add(callback);
    callback(this.isAutoMuted());
    return () => this.muteListeners.delete(callback);
  }
  _emitMute() {
    this.muteListeners.forEach(listener => listener(this.isAutoMuted()));
  }
  onStateChange(callback) {
    const handler = (event) => {
      if (event.data === YT_PLAYING) callback('play');
      if (event.data === YT_PAUSED) callback('pause');
      if (event.data === YT_ENDED) callback('ended');
    };
    this.player.addEventListener('onStateChange', handler);
    this.stateHandlers.push(handler);
  }
  onTimeUpdate(callback) {
    this.intervals.push(setInterval(() => callback(this.getCurrentTime()), 1000));
  }
  // The iframe API has no seek event: watch for the playhead jumping further than playback could explain.
  onSeek(callback) {
    let lastTime = this.getCurrentTime();
    let lastCheck = Date.now();
    this.intervals.push(setInterval(() => {
      const now = Date.now();
      const time = this.getCurrentTime();
      const expected = lastTime + (this.isPlaying() ? (now - lastCheck) / 1000 : 0);
      if (Math.abs(time - expected) > SEEK_JUMP_SECONDS) callback(time);
      lastTime = time;
      lastCheck = now;
    }, SEEK_POLL_MS));
  }
  destroy() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.muteListeners.clear();
    this.stateHandlers.forEach(handler => {
      try { this.player.removeEventListener('onStateChange', handler); } catch (e) { /* player already gone */ }
    });
    this.stateHandlers = [];
  }
}
