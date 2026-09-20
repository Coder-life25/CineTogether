function extractYoutubeId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function isDirectVideoUrl(url) {
  const videoExtensions = ['.mp4', '.webm', '.ogg'];
  try {
      const parsed = new URL(url);
      return videoExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext));
  } catch(e) {
      return false;
  }
}

describe('Video Source Utils (mocked)', () => {
  it('extracts YouTube ID from various URLs', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('invalid-url')).toBeNull();
  });

  it('detects direct video URLs', () => {
    expect(isDirectVideoUrl('http://example.com/video.mp4')).toBe(true);
    expect(isDirectVideoUrl('https://example.com/movie.webm')).toBe(true);
    expect(isDirectVideoUrl('http://example.com/page.html')).toBe(false);
    expect(isDirectVideoUrl('invalid-url')).toBe(false);
  });
});
