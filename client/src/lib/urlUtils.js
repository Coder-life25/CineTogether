import { extractVideoId, extractStartSeconds } from './youtubeUtils';

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v'];

const FACEBOOK_HOSTS = new Set([
  'facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com',
  'mbasic.facebook.com', 'fb.com', 'www.fb.com', 'fb.watch', 'www.fb.watch'
]);

const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com', 'm.instagram.com']);
const INSTAGRAM_MEDIA_KINDS = new Set(['p', 'reel', 'reels', 'tv']);
const INSTAGRAM_SHORTCODE_RE = /^[A-Za-z0-9_-]{5,20}$/;

// Streaming sites serve a whole player page and refuse to be framed (X-Frame-Options, or a CSP
// frame-ancestors rule), and several of them wrap the video in DRM on top of that. There is no
// link we can turn these into - the way to watch one together is to share the tab it plays in.
const EMBED_BLOCKED_HOSTS = [
  'netmirror.center',
  'netfree.cc',
  'netflix.com',
  'hotstar.com',
  'primevideo.com',
  'jiocinema.com',
  'zee5.com',
  'sonyliv.com',
  'disneyplus.com',
  'hulu.com',
  'max.com'
];

export const normalizeUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch (e) {
    return null;
  }
};

export const isValidUrl = (url) => normalizeUrl(url) !== null;

// The host if this is a page we know can't be embedded, null otherwise.
export const embedBlockedHost = (raw) => {
  const parsed = normalizeUrl(raw);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const match = EMBED_BLOCKED_HOSTS.find(blocked => host === blocked || host.endsWith(`.${blocked}`));
  return match ? host : null;
};

export const isDirectVideoUrl = (url) => {
  const parsed = normalizeUrl(url);
  if (!parsed) return false;
  const path = parsed.pathname.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some(ext => path.endsWith(ext));
};

// Facebook video permalinks: /{page}/videos/{id}, /watch?v={id}, /reel/{id},
// /share/v/{code}, /share/r/{code}, fb.watch/{code}
export const parseFacebookUrl = (url) => {
  const parsed = normalizeUrl(url);
  if (!parsed || !FACEBOOK_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);
  let canonical = null;

  if (host === 'fb.watch' || host === 'www.fb.watch') {
    if (segments.length >= 1) canonical = `https://fb.watch/${segments[0]}/`;
  } else if ((segments[0] === 'watch' || segments[0] === 'video.php') && parsed.searchParams.get('v')) {
    canonical = `https://www.facebook.com/watch/?v=${encodeURIComponent(parsed.searchParams.get('v'))}`;
  } else if (segments[0] === 'reel' && segments[1]) {
    canonical = `https://www.facebook.com/reel/${encodeURIComponent(segments[1])}/`;
  } else if (segments[0] === 'share' && (segments[1] === 'v' || segments[1] === 'r') && segments[2]) {
    canonical = `https://www.facebook.com/share/${segments[1]}/${encodeURIComponent(segments[2])}/`;
  } else {
    const videosIdx = segments.indexOf('videos');
    if (videosIdx > 0 && segments.length > videosIdx + 1) {
      // /{page}/videos/{id}/ or /{page}/videos/{slug}/{id}/
      const id = segments[segments.length - 1];
      if (/^\d+$/.test(id)) {
        canonical = `https://www.facebook.com/${segments.slice(0, videosIdx).map(encodeURIComponent).join('/')}/videos/${id}/`;
      }
    }
  }

  if (!canonical) return null;
  return {
    url: canonical,
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonical)}&show_text=false&autoplay=false&allowfullscreen=true`
  };
};

// Instagram media: /p/{code}, /reel/{code}, /reels/{code}, /tv/{code}, /{user}/reel/{code}
export const parseInstagramUrl = (url) => {
  const parsed = normalizeUrl(url);
  if (!parsed || !INSTAGRAM_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  const kindIdx = segments.findIndex(s => INSTAGRAM_MEDIA_KINDS.has(s));
  if (kindIdx === -1 || kindIdx > 1) return null;

  const shortcode = segments[kindIdx + 1];
  if (!shortcode || !INSTAGRAM_SHORTCODE_RE.test(shortcode)) return null;

  const kind = segments[kindIdx] === 'reels' ? 'reel' : segments[kindIdx];
  const canonical = `https://www.instagram.com/${kind}/${shortcode}/`;
  return {
    url: canonical,
    shortcode,
    embedUrl: `${canonical}embed/`
  };
};

export const isFacebookVideoUrl = (url) => parseFacebookUrl(url) !== null;
export const isInstagramUrl = (url) => parseInstagramUrl(url) !== null;

// Turns whatever the user pasted into a playable source descriptor, or null when we can't play it.
export const parseVideoUrl = (raw) => {
  const parsed = normalizeUrl(raw);
  if (!parsed) return null;
  const url = parsed.toString();

  const videoId = extractVideoId(url);
  if (videoId) return { type: 'youtube', videoId, start: extractStartSeconds(url) };

  const facebook = parseFacebookUrl(url);
  if (facebook) return { type: 'facebook', ...facebook };

  const instagram = parseInstagramUrl(url);
  if (instagram) return { type: 'instagram', url: instagram.url, embedUrl: instagram.embedUrl };

  if (isDirectVideoUrl(url)) return { type: 'direct', url };

  return null;
};

export const SOURCE_LABELS = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  instagram: 'Instagram',
  direct: 'Direct video',
  r2: 'Uploaded video',
  screen: 'Shared screen'
};

export const detectVideoSource = (url) => {
  const source = parseVideoUrl(url);
  return source ? source.type : null;
};
