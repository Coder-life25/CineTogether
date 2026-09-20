import { WS_BASE_URL } from '../lib/constants';

export class WebSocketClient {
  constructor() {
    this.ws = null;
    this.handlers = new Map(); // type -> Set<callback>
    this.reconnectAttempts = 0;
    this.maxRetries = 5;
    this.reconnectTimer = null;
    this.hasConnected = false;
    this.intentionalClose = false;
    this.roomId = null;
    this.participantId = null;
    // A tab that is going away must not fire an auto-reconnect on its way out, or it leaves a
    // ghost socket that keeps the room "full" until the server heartbeat reaps it.
    this._onPageHide = () => this.close();
    if (typeof window !== 'undefined') window.addEventListener('pagehide', this._onPageHide);
  }

  connect(roomId, participantId) {
    this.roomId = roomId;
    this.participantId = participantId;

    return new Promise((resolve, reject) => {
      try {
        const url = `${WS_BASE_URL}?roomId=${encodeURIComponent(roomId)}&participantId=${encodeURIComponent(participantId)}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          const isReconnect = this.hasConnected;
          this.hasConnected = true;
          this.reconnectAttempts = 0;
          if (this.onOpenHandler) this.onOpenHandler();
          // The server saw us leave and come back, so the peer connection has to be rebuilt.
          if (isReconnect) this._dispatch('ws_reconnected', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this._dispatch(data.type, data.payload);
          } catch (e) {
            console.error('WebSocket message parse error:', e);
          }
        };

        this.ws.onclose = () => {
          if (this.onCloseHandler) this.onCloseHandler();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          if (this.onErrorHandler) this.onErrorHandler(error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  _dispatch(type, payload) {
    const set = this.handlers.get(type);
    if (!set) return;
    [...set].forEach(handler => {
      try {
        handler(payload);
      } catch (e) {
        console.error(`WebSocket handler for "${type}" failed:`, e);
      }
    });
  }

  attemptReconnect() {
    if (this.intentionalClose) return;
    if (!this.roomId || !this.participantId) return; // closed on purpose
    if (this.reconnectAttempts >= this.maxRetries) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectTimer = setTimeout(() => {
      if (this.roomId && this.participantId) {
        this.connect(this.roomId, this.participantId).catch(console.error);
      }
    }, delay);
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }

  // Several parts of the app listen to the same message type; returns an unsubscribe function.
  onMessage(type, callback) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(callback);
    return () => {
      const set = this.handlers.get(type);
      if (set) set.delete(callback);
    };
  }

  onOpen(callback) { this.onOpenHandler = callback; }
  onClose(callback) { this.onCloseHandler = callback; }
  onError(callback) { this.onErrorHandler = callback; }

  close() {
    this.intentionalClose = true;
    clearTimeout(this.reconnectTimer);
    this.roomId = null;
    this.participantId = null;
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', this._onPageHide);
    if (this.ws) {
      this.ws.close(1000, 'client closed');
      this.ws = null;
    }
  }
}
