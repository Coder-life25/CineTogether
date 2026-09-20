import React, { useEffect, useRef } from 'react';

const CameraPreview = ({ stream, isLocal = true }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
    />
  );
};

export default CameraPreview;
