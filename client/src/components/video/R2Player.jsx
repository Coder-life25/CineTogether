import React from 'react';
import DirectURLPlayer from './DirectURLPlayer';

// R2 is basically a direct URL player in this context (assuming url is presigned)
// Real implementation might auto-refresh url before 1h expiry
const R2Player = ({ url, controlChannel }) => {
  return <DirectURLPlayer url={url} controlChannel={controlChannel} />;
};

export default R2Player;
