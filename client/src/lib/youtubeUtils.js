const YOUTUBE_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
  'youtube-nocookie.com', 'www.youtube-nocookie.com'
]);
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
// Path prefixes that carry the video id as the next segment: /embed/ID, /shorts/ID, /live/ID ...
const ID_PATH_PREFIXES = new Set(['embed', 'v', 'e', 'shorts', 'live']);

const toUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch (e) {
    return null;
  }
};

export const extractVideoId = (url) => {
  const parsed = toUrl(url);
  if (!parsed) return null;

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);
  let id = null;

  if (host === 'youtu.be') {
    id = segments[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (parsed.searchParams.has('v')) {
      id = parsed.searchParams.get('v');
    } else if (ID_PATH_PREFIXES.has(segments[0])) {
      id = segments[1];
    }
  }

  return id && VIDEO_ID_RE.test(id) ? id : null;
};

export const isYouTubeUrl = (url) => extractVideoId(url) !== null;

// "?t=1h2m3s", "?t=90", "?t=90s", "?start=90" → seconds (0 when absent)
export const extractStartSeconds = (url) => {
  const parsed = toUrl(url);
  if (!parsed) return 0;
  const raw = parsed.searchParams.get('t') || parsed.searchParams.get('start');
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!match) return 0;
  const [, h = 0, m = 0, s = 0] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

export const getYouTubeThumbnail = (videoId) => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};
