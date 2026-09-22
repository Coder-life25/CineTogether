const { validateMessage } = require('../src/websocket/validation');

describe('Signaling Validation', () => {
  it('validates offer/answer messages with an sdp', () => {
    expect(() => validateMessage({ type: 'webrtc_offer', payload: { sdp: {} } })).not.toThrow();
    expect(() => validateMessage({ type: 'webrtc_answer', payload: { sdp: {} } })).not.toThrow();
  });

  it('rejects offer/answer without sdp', () => {
    expect(() => validateMessage({ type: 'webrtc_offer', payload: {} })).toThrow('Missing sdp');
  });

  it('validates ice candidate messages', () => {
    expect(() => validateMessage({ type: 'webrtc_ice_candidate', payload: { candidate: {} } })).not.toThrow();
  });

  it('rejects ice candidate without candidate', () => {
    expect(() => validateMessage({ type: 'webrtc_ice_candidate', payload: {} })).toThrow('Missing candidate');
  });

  it('rejects invalid or missing message types', () => {
    expect(() => validateMessage({ type: 'invalid-type' })).toThrow('Invalid or missing message type');
    expect(() => validateMessage({})).toThrow('Invalid or missing message type');
  });

  it('rejects non-object messages', () => {
    expect(() => validateMessage(null)).toThrow('Message must be a JSON object');
    expect(() => validateMessage('string')).toThrow('Message must be a JSON object');
  });
});

describe('video_change validation', () => {
  const wrap = (source) => () => validateMessage({ type: 'video_change', payload: { source } });

  it('accepts a valid YouTube source', () => {
    expect(wrap({ type: 'youtube', videoId: 'dQw4w9WgXcQ', start: 0 })).not.toThrow();
  });

  it('rejects a bad YouTube id', () => {
    expect(wrap({ type: 'youtube', videoId: 'nope' })).toThrow('Invalid YouTube video id');
  });

  it('accepts direct and r2 http urls', () => {
    expect(wrap({ type: 'direct', url: 'https://example.com/a.mp4' })).not.toThrow();
    expect(wrap({ type: 'r2', url: 'https://cdn.example.com/x' })).not.toThrow();
  });

  it('accepts facebook/instagram with an embed url', () => {
    expect(wrap({ type: 'facebook', url: 'https://www.facebook.com/watch/?v=1', embedUrl: 'https://www.facebook.com/plugins/video.php?href=x' })).not.toThrow();
    expect(wrap({ type: 'instagram', url: 'https://www.instagram.com/reel/abcde/', embedUrl: 'https://www.instagram.com/reel/abcde/embed/' })).not.toThrow();
  });

  it('rejects unknown source types and non-http urls', () => {
    expect(wrap({ type: 'magnet', url: 'https://x/y' })).toThrow('Invalid video source');
    expect(wrap({ type: 'direct', url: 'javascript:alert(1)' })).toThrow('Invalid video url');
    expect(wrap({ type: 'facebook', url: 'https://www.facebook.com/x' })).toThrow('Invalid embed url');
  });
});

describe('screen share and cleared sources', () => {
  const wrap = (source) => () => validateMessage({ type: 'video_change', payload: { source } });

  it('accepts a screen source, which carries no url of its own', () => {
    expect(wrap({ type: 'screen' })).not.toThrow();
  });

  it('accepts a null source, which clears the room video when a share ends', () => {
    expect(wrap(null)).not.toThrow();
  });

  it('still rejects video_change with no source field at all', () => {
    expect(() => validateMessage({ type: 'video_change', payload: {} })).toThrow('Missing source');
    expect(() => validateMessage({ type: 'video_change' })).toThrow('Missing source');
  });
});

describe('sync relay validation', () => {
  const wrap = (data) => () => validateMessage({ type: 'sync', payload: { data } });

  it('accepts the three playback control messages', () => {
    expect(wrap({ type: 'sync_event', payload: { type: 'play', position: 12 } })).not.toThrow();
    expect(wrap({ type: 'request_sync_state' })).not.toThrow();
    expect(wrap({ type: 'sync_state', payload: { position: 12, playing: true } })).not.toThrow();
  });

  it('rejects anything else riding the relay', () => {
    expect(wrap({ type: 'chat_message', payload: { text: 'hi' } })).toThrow('Invalid sync payload');
    expect(wrap(null)).toThrow('Invalid sync payload');
    expect(() => validateMessage({ type: 'sync' })).toThrow('Invalid sync payload');
  });
});
