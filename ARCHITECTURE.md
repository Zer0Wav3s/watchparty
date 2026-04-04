# WatchParty — Architecture Spec

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js)                         │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Landing     │  │  /room/[id]  │  │  API Routes           │  │
│  │  Page (/)    │  │  Room Page   │  │                       │  │
│  │             │  │              │  │  POST /api/rooms       │  │
│  │  "Create    │  │  VideoPlayer │  │  POST /api/extract     │  │
│  │   Room" btn │  │  + Controls  │  │                       │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                │                       │              │
└─────────┼────────────────┼───────────────────────┼──────────────┘
          │                │                       │
          │                │  WebSocket             │  HTTP
          │                ▼                       │
          │   ┌────────────────────────┐           │
          │   │   PARTYKIT (Cloudflare) │           │
          │   │                        │           │
          │   │   Room Durable Object  │           │
          │   │   - room state         │           │
          │   │   - connected peers    │           │
          │   │   - video URL + type   │           │
          │   │   - playback position  │           │
          │   │   - PIN (optional)     │           │
          │   └────────────────────────┘           │
          │                                        │
          └────────────────────────────────────────┘
```

## 2. Component Breakdown

### Frontend Pages

**Landing Page (`app/page.tsx`)**
Single page with a "Create Room" button and optional PIN input. On click, calls `POST /api/rooms` to generate a room ID, then redirects to `/room/[id]`. If a PIN was set, it is sent along with the create request so PartyKit stores it.

**Room Page (`app/room/[id]/page.tsx`)**
The room experience. On mount, attempts WebSocket connection to the PartyKit room. If the room has a PIN, PartyKit rejects the initial connection and the client renders a PIN input gate. Once authenticated (or if no PIN), the user sees:
1. A URL input bar (host only — first joiner is host)
2. The video player area
3. A viewer count indicator

### Frontend Components

| Component | Responsibility |
|---|---|
| `VideoPlayer` | Wrapper that renders either `ReactPlayer` (YouTube) or an HLS.js player based on video type. Receives `url`, `type`, `isPlaying`, `seekTo` as props. Emits `onPlay`, `onPause`, `onSeek` events upward. |
| `PinGate` | Modal overlay. Text input + submit. Sends PIN to PartyKit for validation. Renders children only after auth succeeds. |
| `UrlInput` | Text input for the host to paste video URLs. On submit, sends URL to `POST /api/extract` if non-YouTube, or directly broadcasts YouTube URL via WebSocket. |
| `HlsPlayer` | Thin wrapper around a `<video>` element with HLS.js attached. Accepts an `.m3u8` or `.mp4` src. |
| `ViewerCount` | Displays current connection count from PartyKit room state. |

### PartyKit Server (`party/room.ts`)

Single Party class handling all room logic. Methods:

- `onConnect(conn, ctx)` — Validates PIN if room is protected. Adds connection to room. Sends current state snapshot to new joiner (video URL, playback position, playing/paused, video type). Broadcasts updated viewer count.
- `onMessage(conn, msg)` — Handles incoming messages: `set-video`, `play`, `pause`, `seek`, `pin-auth`. Updates room state and broadcasts to all other connections.
- `onClose(conn)` — Removes connection. Broadcasts updated viewer count. If host disconnects, promotes next connection to host.
- `onRequest(req)` — HTTP endpoint for room creation. Sets initial room state (PIN, host token).

### API Routes

**`POST /api/rooms`**
Generates a nanoid room ID (8 chars). If a PIN is provided in the request body, calls the PartyKit room's HTTP endpoint to initialize it with the PIN. Returns `{ roomId }`.

**`POST /api/extract`**
Accepts `{ url }` in the body. Fetches the page HTML using `fetch`, parses it with cheerio, extracts video source URLs. Returns `{ src, type }` where type is `hls` or `mp4`. Details in section 4.

## 3. Data Flows

### Room Creation
```
User clicks "Create Room" (optional PIN entered)
  → POST /api/rooms { pin?: string }
  → Server generates roomId = nanoid(8)
  → Server calls PartyKit HTTP: POST /parties/room/{roomId} { pin, hostToken }
  → Returns { roomId } to client
  → Client redirects to /room/{roomId}
  → If creator set a PIN, they store hostToken in sessionStorage to auto-auth
```

### Joining a Room
```
User opens /room/{roomId}
  → Client opens WebSocket to PartyKit: wss://watchparty.{user}.partykit.dev/parties/room/{roomId}
  → PartyKit onConnect checks if room has PIN
    → If PIN set and no auth token in connection params:
      → Send { type: "pin-required" } to connection
      → Client renders PinGate
      → User enters PIN → client sends { type: "pin-auth", pin: "1234" }
      → PartyKit validates → sends { type: "auth-ok" } or { type: "auth-fail" }
    → If no PIN or auth succeeds:
      → Send state snapshot: { type: "sync", videoUrl, videoType, position, isPlaying, viewers }
      → Broadcast { type: "viewer-count", count } to all
```

### Video Submission
```
Host pastes URL into UrlInput
  → Client checks if URL matches YouTube pattern (youtube.com, youtu.be)
    → If YouTube:
      → Send via WebSocket: { type: "set-video", url, videoType: "youtube" }
    → If other:
      → POST /api/extract { url }
      → Server fetches page, extracts .m3u8 or .mp4 source
      → Returns { src, type: "hls" | "mp4" }
      → Send via WebSocket: { type: "set-video", url: src, videoType: type }
  → PartyKit updates room state, broadcasts { type: "video-change", url, videoType } to all
  → All clients load the new video
```

### Playback Sync
```
Any user plays/pauses/seeks
  → VideoPlayer fires onPlay/onPause/onSeek
  → Client sends WebSocket message:
    { type: "play", position: 42.5 }
    { type: "pause", position: 42.5 }
    { type: "seek", position: 120.0 }
  → PartyKit updates state, broadcasts to ALL OTHER connections (not sender)
  → Receiving clients update their player state
  → Drift correction: every 5 seconds, host sends { type: "heartbeat", position }
    → PartyKit broadcasts to all non-host connections
    → Clients check drift — if >2 seconds off, seek to correct position
```

## 4. Video Extraction Strategy

The `/api/extract` route handles non-YouTube URLs. The extraction pipeline:

**Step 1 — Fetch the page**
```
const html = await fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 ..." }
}).then(r => r.text())
```

**Step 2 — Parse with cheerio and extract sources**

Priority order (first match wins):

1. Direct `.m3u8` link in the URL itself — return immediately as `{ src: url, type: "hls" }`
2. Direct `.mp4` link in the URL itself — return as `{ src: url, type: "mp4" }`
3. `<source>` tags with `src` attribute containing `.m3u8` or `.mp4`
4. `<video>` tags with `src` attribute containing `.m3u8` or `.mp4`
5. Regex scan of full HTML body for URLs matching `https?://[^\s"']+\.m3u8[^\s"']*`
6. Regex scan for URLs matching `https?://[^\s"']+\.mp4[^\s"']*`
7. Look inside `<script>` tags for JSON objects containing `file`, `src`, `source`, or `url` keys with video extensions
8. Check `<iframe>` src attributes — if found, recursively fetch and parse the iframe page (max depth: 1)

**Step 3 — Validate the extracted URL**
```
HEAD request to the extracted src
  → Check Content-Type contains "video" or "mpegurl" or "octet-stream"
  → Check status is 200
  → If validation fails, try next candidate from step 2
```

**Step 4 — Return or fail**
```
Success: { src: "https://...", type: "hls" | "mp4" }
Failure: { error: "Could not extract video source", candidates: [...] }
```

**Fallback behavior:** If extraction fails entirely, the client shows an error message suggesting the user try a different source URL. No silent failures.

**Rate limiting:** The extract endpoint should be rate-limited to 10 requests per minute per IP to prevent abuse as a general scraping proxy. Use Vercel's `headers()` to read `x-forwarded-for`.

## 5. PartyKit Room State Schema

```typescript
interface RoomState {
  // Room identity
  roomId: string

  // Access control
  pin: string | null          // null = public room
  hostToken: string | null    // token issued to room creator for auto-auth
  hostConnectionId: string | null  // connection ID of current host

  // Video state
  videoUrl: string | null     // current video URL (YouTube URL or extracted src)
  videoType: "youtube" | "hls" | "mp4" | null
  isPlaying: boolean
  position: number            // playback position in seconds
  lastUpdateAt: number        // Date.now() of last position update — used to calculate drift

  // Connections
  viewers: Map<string, {
    joinedAt: number
    authed: boolean           // always true for public rooms, PIN-validated for private
  }>
}
```

**State initialization (onRequest for room creation):**
```typescript
{
  roomId: id,
  pin: request.pin || null,
  hostToken: request.pin ? nanoid(16) : null,
  hostConnectionId: null,
  videoUrl: null,
  videoType: null,
  isPlaying: false,
  position: 0,
  lastUpdateAt: Date.now(),
  viewers: new Map()
}
```

**Host promotion rule:** First authed connection becomes host. If host disconnects, the earliest `joinedAt` connection becomes host. Host is the only one who can submit video URLs. All users can play/pause/seek.

**State persistence:** PartyKit Durable Objects persist state automatically. Rooms with zero connections for 30+ minutes can be considered expired. PartyKit handles hibernation natively — no cleanup cron needed.

## 6. Deployment Architecture

```
┌──────────────────────────┐     ┌──────────────────────────────┐
│       VERCEL              │     │       PARTYKIT                │
│                          │     │       (Cloudflare Edge)       │
│  Next.js App             │     │                              │
│  - SSR pages             │     │  Durable Object per room     │
│  - /api/rooms            │     │  - WebSocket connections     │
│  - /api/extract          │     │  - Room state                │
│                          │     │  - Sync broadcasts           │
│  Edge Network CDN        │     │  - PIN validation            │
│  for static assets       │     │                              │
│                          │     │  Auto-scales per room        │
│  Env vars:               │     │  Zero cold start (hibernation)│
│  - PARTYKIT_HOST         │     │                              │
│  - RATE_LIMIT_SECRET     │     │  Env vars:                   │
│                          │     │  - (none needed)             │
└──────────────────────────┘     └──────────────────────────────┘
```

**Vercel config:**
- Framework: Next.js (App Router)
- Build command: `next build`
- No serverless function size concerns — cheerio is lightweight
- Environment variable `NEXT_PUBLIC_PARTYKIT_HOST` points to the PartyKit deployment

**PartyKit config (`partykit.json`):**
```json
{
  "name": "watchparty",
  "main": "party/room.ts",
  "compatibilityDate": "2024-01-01"
}
```

**Deploy commands:**
- Vercel: `vercel --prod` (or Git push to main with Vercel integration)
- PartyKit: `npx partykit deploy`

**Domain setup:** Vercel serves the frontend at the primary domain. PartyKit runs on its own subdomain (default: `watchparty.{username}.partykit.dev`). The client connects to PartyKit via the `NEXT_PUBLIC_PARTYKIT_HOST` env var.

## 7. File/Folder Structure

```
watchparty/
├── app/
│   ├── layout.tsx              # Root layout — html, body, global styles
│   ├── page.tsx                # Landing page — Create Room + optional PIN
│   ├── room/
│   │   └── [id]/
│   │       └── page.tsx        # Room page — player, URL input, viewer count
│   └── api/
│       ├── rooms/
│       │   └── route.ts        # POST handler — generate room ID, init PartyKit state
│       └── extract/
│           └── route.ts        # POST handler — scrape URL, return video source
├── components/
│   ├── VideoPlayer.tsx         # Switches between ReactPlayer and HlsPlayer
│   ├── HlsPlayer.tsx           # HLS.js wrapper around <video>
│   ├── PinGate.tsx             # PIN entry modal overlay
│   ├── UrlInput.tsx            # URL paste input (host only)
│   └── ViewerCount.tsx         # Shows current viewer count
├── lib/
│   ├── extractVideo.ts         # cheerio extraction logic (used by API route)
│   ├── partykit.ts             # PartyKit connection helper + message types
│   ├── types.ts                # Shared TypeScript types (RoomState, messages)
│   └── utils.ts                # nanoid wrapper, YouTube URL detection, helpers
├── party/
│   └── room.ts                 # PartyKit server — all room logic
├── public/
│   └── favicon.ico
├── partykit.json               # PartyKit deployment config
├── next.config.ts              # Next.js config
├── package.json
├── tsconfig.json
├── tailwind.config.ts          # Tailwind CSS config
├── .env.local                  # NEXT_PUBLIC_PARTYKIT_HOST
├── .gitignore
├── README.md
└── ARCHITECTURE.md             # This file
```

## Build Sequence for Codex

Ordered steps. Each step should be a working commit. Do not skip ahead.

1. **Scaffold** — `npx create-next-app@latest watchparty --typescript --tailwind --app --src-dir=false`. Add partykit, nanoid, react-player, hls.js, cheerio to dependencies. Create `partykit.json`. Create the folder structure above.

2. **Types and utils** — Write `lib/types.ts` with all message types and RoomState interface. Write `lib/utils.ts` with `generateRoomId()`, `isYouTubeUrl()`, and URL validation helpers.

3. **PartyKit server** — Write `party/room.ts`. Implement onConnect (state snapshot), onMessage (play/pause/seek/set-video/pin-auth), onClose (viewer removal, host promotion), onRequest (room init with optional PIN). Test locally with `npx partykit dev`.

4. **Landing page** — Build `app/page.tsx` with room creation form (optional PIN input, Create Room button). Wire up `POST /api/rooms` — the route generates an ID, calls PartyKit onRequest to init the room, returns the ID. Redirect to `/room/[id]`.

5. **Room page shell** — Build `app/room/[id]/page.tsx`. Connect to PartyKit WebSocket on mount. Handle `pin-required` flow by rendering PinGate. Once authed, render the room UI shell (empty player area, URL input, viewer count).

6. **Video player** — Build `VideoPlayer.tsx` and `HlsPlayer.tsx`. VideoPlayer switches on `videoType` — renders ReactPlayer for YouTube, HlsPlayer for HLS/MP4. Wire up play/pause/seek event handlers that send WebSocket messages.

7. **Sync logic** — Wire incoming WebSocket messages (play/pause/seek/video-change) to VideoPlayer props. Implement heartbeat drift correction (host sends position every 5s, clients correct if drift > 2s).

8. **Video extraction** — Write `lib/extractVideo.ts` with the cheerio pipeline from section 4. Wire it into `app/api/extract/route.ts`. Add rate limiting. Test with known streaming URLs.

9. **Polish** — Error states (extraction failure, WebSocket disconnect, room not found). Loading states. Mobile responsive layout. Viewer count display.

10. **Deploy** — Deploy PartyKit with `npx partykit deploy`. Deploy Next.js to Vercel. Set `NEXT_PUBLIC_PARTYKIT_HOST` env var. Verify end-to-end flow.

## Failure Modes

| Failure | Impact | Mitigation |
|---|---|---|
| Video extraction fails | Host sees error, no video plays | Show clear error with "try another URL" message. Return candidate URLs so host can manually pick one. |
| PartyKit connection drops | Viewer loses sync | Auto-reconnect with exponential backoff (PartyKit client SDK handles this). On reconnect, server sends full state snapshot. |
| Host disconnects | No one can submit new videos | Auto-promote next viewer to host by earliest joinedAt. |
| Drift accumulates | Viewers get out of sync | Heartbeat every 5s from host. Force seek if drift > 2s. |
| Streaming site blocks scraper | Extraction returns nothing | Use browser-like User-Agent header. If blocked, return error — this is inherent to scraping and cannot be fully solved serverlessly. |
| PIN brute force | Someone guesses into a private room | Rate limit PIN attempts to 5 per connection per minute. Disconnect after 10 failures. |
