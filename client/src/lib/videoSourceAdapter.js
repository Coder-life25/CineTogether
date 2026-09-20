export class HTML5Adapter {
  constructor(videoElement) {
    this.video = videoElement;
    this.listeners = [];
  }
  play() {
    const p = this.video.play();
    if (p && p.catch) p.catch(() => {}); // autoplay may be blocked until the user interacts
    return p;
  }
  pause() { this.video.pause(); }
  seekTo(seconds) { this.video.currentTime = seconds; }
  getCurrentTime() { return this.video.currentTime; }
  getDuration() { return this.video.duration || 0; }
  isPlaying() { return !this.video.paused && !this.video.ended; }
  isReady() { return this.video.readyState >= 2; }
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
  }
  play() { this.player.playVideo(); }
  pause() { this.player.pauseVideo(); }
  seekTo(seconds) { this.player.seekTo(seconds, true); }
  getCurrentTime() { return this.player.getCurrentTime() || 0; }
  getDuration() { return this.player.getDuration() || 0; }
  isPlaying() {
    const state = this.player.getPlayerState();
    return state === YT_PLAYING || state === YT_BUFFERING;
  }
  isReady() { return typeof this.player.playVideo === 'function'; }
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
    this.stateHandlers.forEach(handler => {
      try { this.player.removeEventListener('onStateChange', handler); } catch (e) { /* player already gone */ }
    });
    this.stateHandlers = [];
  }
}
