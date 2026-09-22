import React from 'react';
import R2Player from './R2Player';
import YouTubePlayer from './YouTubePlayer';
import DirectURLPlayer from './DirectURLPlayer';
import EmbedPlayer from './EmbedPlayer';
import ScreenSharePlayer from './ScreenSharePlayer';
import { parseVideoUrl } from '../../lib/urlUtils';

const VideoPlayer = ({ source, controlChannel, screenShare }) => {
  if (!source) return null;

  switch (source.type) {
    case 'screen':
      return (
        <ScreenSharePlayer
          stream={screenShare && screenShare.stream}
          isSharer={!!(screenShare && screenShare.isSharing)}
          onStop={screenShare && screenShare.stop}
        />
      );
    case 'r2':
      return <R2Player url={source.url} controlChannel={controlChannel} />;
    case 'youtube':
      return <YouTubePlayer videoId={source.videoId} start={source.start} controlChannel={controlChannel} />;
    case 'direct':
      return <DirectURLPlayer url={source.url} controlChannel={controlChannel} />;
    case 'facebook':
    case 'instagram':
      return <EmbedPlayer source={source} />;
    case 'embed': {
      // Older clients sent the raw page URL; resolve it the same way the picker does now
      const resolved = parseVideoUrl(source.url);
      return resolved
        ? <VideoPlayer source={resolved} controlChannel={controlChannel} screenShare={screenShare} />
        : <Unsupported />;
    }
    default:
      return <Unsupported />;
  }
};

const Unsupported = () => (
  <div className="text-text-secondary text-center p-6">This video source isn&apos;t supported.</div>
);

export default VideoPlayer;
