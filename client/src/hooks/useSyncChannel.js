import { useEffect, useState } from 'react';

const WS_SYNC_TYPE = 'sync';

// Playback sync has to survive a peer connection that never forms. With only STUN servers a direct
// P2P link fails on plenty of mobile and carrier NATs - exactly the long-distance case this app is
// built for - and when the control data channel stays shut, every play, pause and seek the partner
// sends is lost, so both sides end up pressing play by hand. This wrapper sends over the data
// channel while it is open and falls back to the signaling socket when it isn't, and listens on
// both. Only playback control takes the socket path; chat and reactions stay strictly peer-to-peer.
class SyncChannel {
  constructor(dataChannel, ws) {
    this.dataChannel = dataChannel || null;
    this.ws = ws || null;
    this.listeners = new Set();
    this.openListeners = new Set();
    this.offs = [];

    if (this.dataChannel) {
      this.offs.push(this.dataChannel.onMessage((data) => this._emit(data)));
      this.offs.push(this.dataChannel.onOpen(() => this._emitOpen()));
    }
    if (this.ws) {
      this.offs.push(this.ws.onMessage(WS_SYNC_TYPE, (payload) => this._emit(payload && payload.data)));
      // A socket that dropped and came back may have missed the partner's last command.
      this.offs.push(this.ws.onMessage('ws_reconnected', () => this._emitOpen()));
    }
  }

  get _dataChannelOpen() {
    return !!this.dataChannel && this.dataChannel.readyState === 'open';
  }

  get _socketOpen() {
    return !!this.ws && this.ws.isOpen();
  }

  get readyState() {
    return this._dataChannelOpen || this._socketOpen ? 'open' : 'connecting';
  }

  get transport() {
    if (this._dataChannelOpen) return 'p2p';
    if (this._socketOpen) return 'relay';
    return 'none';
  }

  send(data) {
    if (this._dataChannelOpen) return this.dataChannel.send(data);
    if (this.ws) return this.ws.send(WS_SYNC_TYPE, { data });
    return false;
  }

  onMessage(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onOpen(callback) {
    this.openListeners.add(callback);
    return () => this.openListeners.delete(callback);
  }

  _emit(data) {
    if (!data) return;
    this.listeners.forEach(listener => listener(data));
  }

  _emitOpen() {
    this.openListeners.forEach(listener => listener());
  }

  destroy() {
    this.offs.forEach(off => off());
    this.offs = [];
    this.listeners.clear();
    this.openListeners.clear();
  }
}

// One channel per (data channel, socket) pair. Its identity is stable so the sync engine built on
// top of it isn't torn down every time React re-renders the room.
export const useSyncChannel = (controlChannel, ws) => {
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (!controlChannel && !ws) {
      setChannel(null);
      return;
    }
    const instance = new SyncChannel(controlChannel, ws);
    setChannel(instance);
    return () => {
      instance.destroy();
      setChannel(null);
    };
  }, [controlChannel, ws]);

  return channel;
};
