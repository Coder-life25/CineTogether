import React, { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { SOURCE_LABELS } from '../../lib/urlUtils';

// Facebook and Instagram only offer iframe embeds with no playback API, so these play
// locally on each side; the badge tells the couple to hit play together.
const EmbedPlayer = ({ source }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const label = SOURCE_LABELS[source.type] || 'Embedded';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: Math.floor(el.clientWidth), height: Math.floor(el.clientHeight) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let src = source.embedUrl;
  let frameStyle = { width: '100%', height: '100%' };

  if (source.type === 'facebook' && size.width) {
    // The plugin lays the video out for a fixed pixel width, so give it the real one.
    const width = Math.max(220, size.width);
    src = `${source.embedUrl}&width=${width}`;
  }
  if (source.type === 'instagram' && size.height) {
    // Instagram embeds are portrait cards; keep them centred instead of stretching.
    frameStyle = { width: Math.min(size.width, Math.max(320, Math.round(size.height * 0.62))), height: '100%' };
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center">
      {size.width > 0 && (
        <iframe
          key={src}
          src={src}
          style={frameStyle}
          className="border-0 bg-black"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          scrolling="no"
          title={`${label} video`}
        />
      )}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-secondary/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full text-xs text-text-secondary whitespace-nowrap pointer-events-none">
        <Info className="w-3.5 h-3.5" />
        {label} · press play together — playback isn&apos;t auto-synced for this source
      </div>
    </div>
  );
};

export default EmbedPlayer;
