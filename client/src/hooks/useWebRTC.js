import { useState, useEffect, useRef } from 'react';
import { ICE_SERVERS } from '../lib/constants';

const MAX_QUEUED_MESSAGES = 50;

// Uniform { readyState, send(obj), onMessage(cb), onOpen(cb) } surface over an RTCDataChannel,
// which is what useChat / useReactions / usePlaybackSync expect. Messages sent while the channel
// is still opening (it lags the "connected" state by a beat) are queued instead of dropped.
class DataChannel {
  constructor(channel) {
    this.channel = channel;
    this.listeners = new Set();
    this.queue = [];
    channel.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      this.listeners.forEach(listener => listener(data));
    };
    channel.addEventListener('open', () => {
      const queued = this.queue;
      this.queue = [];
      queued.forEach(message => this.channel.send(message));
    });
  }
  get readyState() { return this.channel.readyState; }
  send(data) {
    const message = JSON.stringify(data);
    if (this.channel.readyState === 'open') {
      this.channel.send(message);
      return true;
    }
    if (this.channel.readyState === 'connecting' && this.queue.length < MAX_QUEUED_MESSAGES) {
      this.queue.push(message);
      return true;
    }
    return false;
  }
  onMessage(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  onOpen(callback) {
    this.channel.addEventListener('open', callback);
    return () => this.channel.removeEventListener('open', callback);
  }
}

// Both sides open the same pre-negotiated channels, so neither has to wait for `ondatachannel`.
const CHANNELS = [
  ['control', 0],
  ['chat', 1],
  ['reactions', 2]
];
const SIGNALING_TYPES = ['webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate'];

// One RTCPeerConnection per partner session. `peerId` is null while we're alone. The connection
// is only built over an open socket: a socket drop tears it down and the partner rebuilds too.
export const useWebRTC = ({ ws, isConnected, localStream, roomId, participantId, peerId }) => {
  const pcRef = useRef(null);
  const signalingRef = useRef(null);   // handlers of the live peer connection
  const pendingRef = useRef([]);       // signaling that arrived before the peer connection existed
  const attachTracksRef = useRef(null); // slots local camera/mic into the live connection
  const localStreamRef = useRef(localStream);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [dataChannels, setDataChannels] = useState({});

  localStreamRef.current = localStream;

  // Signaling listeners live as long as the socket does, so an offer can never slip past us
  // while React is still mounting the peer connection for a freshly joined partner.
  useEffect(() => {
    if (!ws) return;
    const route = (type) => (payload) => {
      const handlers = signalingRef.current;
      if (handlers) handlers[type](payload);
      else pendingRef.current.push([type, payload]);
    };
    const detach = () => {
      signalingRef.current = null;
      pendingRef.current = [];
    };
    const offs = SIGNALING_TYPES.map(type => ws.onMessage(type, route(type)));
    offs.push(ws.onMessage('participant_left', detach));
    offs.push(ws.onMessage('ws_reconnected', detach));
    return () => offs.forEach(off => off());
  }, [ws]);

  useEffect(() => {
    if (!ws || !isConnected || !roomId || !participantId || !peerId) {
      setConnectionState('new');
      return;
    }

    // Perfect negotiation: the polite side yields when both offer at once. Deterministic on both ends.
    const polite = participantId > peerId;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    let makingOffer = false;
    let ignoreOffer = false;
    let closed = false;

    pc.onconnectionstatechange = () => {
      if (!closed) setConnectionState(pc.connectionState);
    };

    // Audio/video slots are negotiated once, up front: the impolite side offers two sendrecv
    // transceivers and the polite side answers on the ones that offer creates. Camera and mic
    // tracks are dropped into them with replaceTrack() whenever they become available, which
    // needs no renegotiation - simultaneous renegotiation from both sides used to leave ICE stuck.
    const remote = new MediaStream();
    pc.ontrack = ({ track }) => {
      remote.addTrack(track);
      if (!closed) setRemoteStream(remote);
    };
    let transceivers = polite ? null : {
      audio: pc.addTransceiver('audio', { direction: 'sendrecv' }),
      video: pc.addTransceiver('video', { direction: 'sendrecv' })
    };
    const resolveTransceivers = () => {
      if (transceivers) return transceivers;
      const byKind = {};
      pc.getTransceivers().forEach((transceiver) => {
        const kind = transceiver.receiver.track.kind;
        if (!byKind[kind]) byKind[kind] = transceiver;
      });
      if (!byKind.audio || !byKind.video) return null;
      byKind.audio.direction = 'sendrecv';
      byKind.video.direction = 'sendrecv';
      transceivers = byKind;
      return transceivers;
    };
    const attachTracks = (stream) => {
      if (!stream || pc.signalingState === 'closed') return;
      const slots = resolveTransceivers();
      if (!slots) return; // polite side: the first remote offer creates the slots
      ['audio', 'video'].forEach((kind) => {
        const track = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
        const sender = slots[kind].sender;
        if (track && sender.track !== track) sender.replaceTrack(track).catch(console.error);
      });
    };
    attachTracksRef.current = attachTracks;
    attachTracks(localStreamRef.current);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) ws.send('webrtc_ice_candidate', { candidate: candidate.toJSON() });
    };
    pc.onnegotiationneeded = async () => {
      // The impolite side opens the session; the polite side answers and only offers later
      // (e.g. an ICE restart) once a session exists. Avoids an offer collision at every join.
      if (polite && !pc.remoteDescription) return;
      try {
        makingOffer = true;
        await pc.setLocalDescription();
        ws.send('webrtc_offer', { sdp: pc.localDescription.toJSON() });
      } catch (err) {
        console.error('Negotiation failed:', err);
      } finally {
        makingOffer = false;
      }
    };

    const channels = {};
    CHANNELS.forEach(([label, id]) => {
      channels[label] = new DataChannel(pc.createDataChannel(label, { negotiated: true, id }));
    });
    setDataChannels(channels);

    signalingRef.current = {
      webrtc_offer: async ({ sdp }) => {
        const collision = makingOffer || pc.signalingState !== 'stable';
        ignoreOffer = !polite && collision;
        if (ignoreOffer) return;
        try {
          await pc.setRemoteDescription(sdp); // polite side rolls back its own offer implicitly
          attachTracks(localStreamRef.current); // answer with our camera/mic on the offered slots
          await pc.setLocalDescription();
          ws.send('webrtc_answer', { sdp: pc.localDescription.toJSON() });
        } catch (err) {
          console.error('Failed to answer offer:', err);
        }
      },
      webrtc_answer: async ({ sdp }) => {
        if (pc.signalingState !== 'have-local-offer') return;
        try {
          await pc.setRemoteDescription(sdp);
        } catch (err) {
          console.error('Failed to apply answer:', err);
        }
      },
      webrtc_ice_candidate: async ({ candidate }) => {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          if (!ignoreOffer) console.error('Failed to add ICE candidate:', err);
        }
      }
    };
    const queued = pendingRef.current;
    pendingRef.current = [];
    queued.forEach(([type, payload]) => signalingRef.current[type](payload));

    return () => {
      closed = true;
      if (signalingRef.current && pcRef.current === pc) signalingRef.current = null;
      pc.onconnectionstatechange = null;
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onnegotiationneeded = null;
      pc.close();
      if (pcRef.current === pc) pcRef.current = null;
      attachTracksRef.current = null;
      setDataChannels({});
      setRemoteStream(null);
      setConnectionState('closed');
    };
  }, [ws, isConnected, roomId, participantId, peerId]);

  // Camera/mic usually arrive after permission is granted; slot them into the live connection.
  useEffect(() => {
    if (attachTracksRef.current && localStream) attachTracksRef.current(localStream);
  }, [localStream, dataChannels]);

  return { remoteStream, connectionState, dataChannels };
};
