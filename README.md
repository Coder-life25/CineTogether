# 🎬 CineTogether

**Watch together. Even when you're far apart. ❤️**

CineTogether is a private two-person synchronized watch-together web application for long-distance couples and friends. Create a room, share the link, and enjoy movies together with video call, chat, and perfectly synced playback.

## Features

- 🔒 **Private Rooms** — Exactly two participants per room, no authentication needed
- 📹 **Video Calls** — See and hear each other via WebRTC
- 💬 **Real-time Chat** — Chat via WebRTC DataChannel (never stored on server)
- 🎬 **Synchronized Playback** — Play, pause, and seek stay in sync for YouTube, direct files, and uploads
- 🔗 **One box, any link** — Paste a YouTube, Facebook, Instagram or direct-video (.mp4/.webm) link; the source is auto-detected
- 📺 **YouTube** — Full two-way sync (play / pause / seek), honours `?t=` start times
- ▶️ **Direct URLs & uploads** — Any browser-playable video URL, or upload straight to Cloudflare R2 (server never touches the file)
- 📱 **Facebook / Instagram** — Rendered via their official embeds on both sides (these platforms expose no playback API, so you press play together; a badge reminds you)
- ⏱️ **Late-join catch-up** — A partner who joins or refreshes mid-movie is pulled to the current position; if the browser blocks autoplay, a one-tap "join playback" overlay resumes in sync
- 😍 **Emoji Reactions** — Send floating emoji reactions
- 📱 **Responsive** — Works on desktop and mobile
- 🎨 **Cinematic UI** — Premium dark theme with smooth animations

## Architecture

```
Browser A ←→ WebRTC P2P ←→ Browser B
    ↕                           ↕
    ↕    WebSocket Signaling    ↕
    ↕           ↕               ↕
    └──→ Node.js Server ←──────┘
              ↕
         MongoDB Atlas (metadata only)
              ↕
       Cloudflare R2 (video storage)
```

**Key principle:** The server never proxies, streams, or stores movie files. Videos are uploaded directly from the browser to R2 and played back directly from R2, and social links play through the platforms' own embeds.

**Supported links:** YouTube (`youtube.com/watch`, `youtu.be`, `/shorts`, `/live`, `/embed`), Facebook (`/watch`, `/<page>/videos/<id>`, `/reel`, `fb.watch`, `/share/v|r`), Instagram (`/p`, `/reel`, `/reels`, `/tv`), and direct video URLs ending in `.mp4/.webm/.ogg/.mov/.m4v`. Streaming-site pages that forbid embedding (for example `netmirror.center`, which sends `X-Frame-Options: SAMEORIGIN`) can't be played in an embed and are rejected with a clear message.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudflare R2 bucket

## Setup

### 1. Clone and install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Edit `server/.env` with your credentials:

```env
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cinetogether
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=cinetogether
CLIENT_URL=http://localhost:5173
```

### 3. Configure R2 CORS

In your Cloudflare R2 bucket settings, add this CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4. Run in development

```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

Open `http://localhost:5173` in two browser tabs to test.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create a new room |
| POST | `/api/rooms/:roomId/join` | Join an existing room |
| POST | `/api/rooms/:roomId/video/upload` | Initiate video upload to R2 |
| POST | `/api/rooms/:roomId/video/complete` | Complete multipart upload |
| GET | `/api/rooms/:roomId/video/url` | Get signed playback URL |
| DELETE | `/api/rooms/:roomId/video` | Delete uploaded video |
| GET | `/api/health` | Health check |

## WebSocket Messages

| Type | Direction | Purpose |
|------|-----------|---------|
| `offer` | Client → Server → Client | WebRTC SDP offer |
| `answer` | Client → Server → Client | WebRTC SDP answer |
| `ice-candidate` | Client → Server → Client | ICE candidate exchange |
| `participant-joined` | Server → Client | Partner connected |
| `participant-left` | Server → Client | Partner disconnected |
| `video-changed` | Server → Client | Video source changed |

## Video Cleanup

- **6 hours**: Uploaded videos are automatically deleted
- **12 hours**: Safety cleanup sweep for any missed deletions
- **Immediate**: "Close Movie" button deletes the R2 object instantly

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide Icons  
**Backend:** Node.js, Express, WebSocket (ws)  
**Database:** MongoDB Atlas  
**Realtime:** WebRTC (camera, mic, chat, sync)  
**Storage:** Cloudflare R2

## License

MIT
