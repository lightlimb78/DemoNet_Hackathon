<div align="center">

# 🔴 DEMONET: RADAR HUNT

### *A real-world GPS manhunt. One monster. Many hunters. No safe ground.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**Built at Hackathon 2025**

[Features](#-features) · [Roles](#-roles) · [Game Flow](#-game-flow) · [Architecture](#-architecture) · [Setup](#-getting-started) · [API Reference](#-api-reference) · [Team](#-team)

</div>

---

## 🎯 What Is DEMONET?

**DEMONET: RADAR HUNT** is a real-time, location-based multiplayer game played entirely in the physical world using your phone's GPS.

Players take on secret asymmetric roles — hunter or hunted — and physically move through a real-world space: a campus, park, or neighbourhood. Your real GPS coordinates are your in-game coordinates. There are no controllers. There is no screen to hide behind. There is only the radar, the map, and the sound of footsteps.

> *Think Among Us — except you actually run.*

The game is built as a **serverless-friendly web app** using Next.js API routes with **HTTP polling** for state synchronisation, requiring zero WebSocket infrastructure. One deployment. Fully playable on any phone browser.

---

## ✨ Features

- 🌍 **Real GPS gameplay** — your physical location is your game position, validated server-side
- 📡 **HTTP polling architecture** — no WebSocket server required; deploys cleanly to Vercel or any serverless host
- 🎭 **Asymmetric roles** — three completely different experiences on the same device
- ⚡ **Phase-based escalation** — Demogorgon's detection range grows over time, guaranteeing tension
- 🗳️ **Emergency voting** — any alive player can call a 60-second group vote to eliminate a suspect
- 📍 **10-metre catch radius** — the Demogorgon must *physically* close the gap; server validates distance
- 📱 **Mobile-first** — haptic feedback and spatial audio hooks for full immersion
- 🧹 **Auto cleanup** — game rooms expire after 2 hours of inactivity

---

## 👥 Roles

Three roles. Three completely different games.

### 🔴 Demogorgon — *The Hunter*

You are the threat. You see everyone. You are hunted only by suspicion.

| | |
|---|---|
| **Win condition** | Catch every Security agent |
| **Phase Shift** | Go invisible to the radar for 10 seconds (30s cooldown) |
| **Sense** | Instantly reveals the bearing and distance of the nearest prey (30s cooldown) |
| **Visibility** | Sees all players on the map at all times |

---

### 🟢 Security — *The Survivors*

You don't know who the Demogorgon is. Your radar tells you *something* is near. Move smart. Vote carefully.

| | |
|---|---|
| **Win condition** | Survive the full 15 minutes, or vote out the Demogorgon |
| **Radar** | Proximity pulse showing threat level and bearing direction |
| **Triangulate** | Returns the Demogorgon's approximate GPS position (±50–100m noise) with a 60s cooldown |
| **Emergency Vote** | Any alive player can trigger a 60-second group vote |

---

### 🟡 Stealth — The Ghost Agent (4+ players only)
You are Security — but nobody knows it, not even the Demogorgon. You stay off the radar until you're close enough to matter.
Your advantage is invisibility. The Demogorgon cannot detect you on its map. Security agents don't know you exist as a separate role. You move freely, get close to the Demogorgon without triggering its senses, and feed real intelligence back to your team — all without anyone knowing you were ever there.
TeamSecurity (wins when Security wins)Win conditionSurvive the full 15 minutes, or help vote out the DemogorgonRadar ghostDoes not appear on the Demogorgon's radar or map until within close proximityFake SignalBroadcasts a false radar ping to confuse and misdirect the Demogorgon (30s cooldown)VisibilityAppears as a normal player to everyone — no one knows the Stealth role exists until the game ends

---

## 🕹️ Game Flow

```
  Player opens app
       │
  ┌────┴────┐
  │  Entry  │  Choose name → Create or Join lobby
  └────┬────┘
       │
  ┌────┴────┐
  │  Lobby  │  Share 6-char code → All players mark Ready
  └────┬────┘
       │  Host hits START
  ┌────┴────────────┐
  │  Role Reveal    │  Server assigns roles secretly, each player sees only their own
  └────┬────────────┘
       │
  ┌────┴─────────────────────────────────────────────────────┐
  │                      LIVE GAME                           │
  │                                                          │
  │  • Phones poll /api/game/state every ~1 second           │
  │  • GPS positions posted to /api/game/state (POST)        │
  │  • Server recalculates threat levels, phases, win cond.  │
  │  • Abilities fired via /api/game/action                  │
  │  • Emergency vote via /api/game/action → callVote        │
  └────┬──────────────────┬───────────────────────────────────┘
       │                  │
  ┌────┴────┐        ┌────┴──────┐
  │  Caught │        │ Vote Out  │  60s majority vote
  └────┬────┘        └────┬──────┘
       └────────┬──────────┘
           ┌────┴────┐
           │  GAME   │  Winner declared → Post-game screen
           │  OVER   │
           └─────────┘
```

---

## 📈 Phase Escalation

The game automatically escalates through four phases based on elapsed time. The Demogorgon's effective radar detection range expands each phase — guaranteed chaos in the final stretch.

| Phase | Time Window | Security Radar Range | Atmosphere |
|-------|-------------|----------------------|------------|
| 🟢 **Early** | 0 – 25% | 150 m | Cautious exploration |
| 🟡 **Mid** | 25 – 50% | 200 m | Tension building |
| 🟠 **Late** | 50 – 75% | 300 m | Active pursuit begins |
| 🔴 **Blood Moon** | 75 – 100% | 500 m | All-out hunt |

> Phase transitions are computed server-side on every position update — no separate clock process needed.

---

## 🏗️ Architecture

DEMONET is built around a **polling-first, serverless-compatible** architecture. There is no persistent WebSocket server. All real-time state lives in Next.js API routes backed by an in-memory store.

```
┌──────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                        │
│                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌────────────────────┐  │
│  │  useGPS()   │   │  Game UI    │   │  Polling Loop      │  │
│  │  watchPos   │──▶│  Components │──▶│  GET /api/game/    │  │
│  │  ~2s update │   │             │   │  state every ~1s   │  │
│  └─────────────┘   └─────────────┘   └────────┬───────────┘  │
│                                               │               │
│         POST /api/game/state  (GPS position push)             │
│         POST /api/game/action (catch, vote, ability)          │
└───────────────────────────────────────────────┼──────────────┘
                                                │  HTTP
┌───────────────────────────────────────────────▼──────────────┐
│                  NEXT.JS API ROUTES (Serverless)               │
│                                                               │
│  /api/lobby/create    →  createRoom()                         │
│  /api/lobby/join      →  joinRoom()                           │
│  /api/lobby/state     →  getLobbyState(), setPlayerReady()    │
│  /api/game/start      →  startGame(), assignRoles()           │
│  /api/game/state      →  getGameState(), updatePosition()     │
│  /api/game/action     →  attemptCatch(), useAbility(),        │
│                           startVoting(), castVote()           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │               lib/game-store.ts                      │     │
│  │                                                      │     │
│  │  In-memory Map<roomCode, GameRoom>                   │     │
│  │  • Haversine distance & bearing calculations         │     │
│  │  • Role assignment (server-authoritative)            │     │
│  │  • Phase escalation logic                            │     │
│  │  • Catch validation (10m radius)                     │     │
│  │  • Ability cooldown tracking                         │     │
│  │  • Vote counting & majority resolution               │     │
│  │  • Room expiry cleanup (every 10 min)                │     │
│  └──────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### Why HTTP Polling?

| Concern | Decision |
|---------|----------|
| **Deployment simplicity** | Runs entirely on Vercel/Netlify — no separate server process |
| **Reliability** | HTTP is stateless; no connection drops, no reconnect logic |
| **Serverless compatible** | Each request is independent; works with edge functions |
| **Sufficient frequency** | 1-second polling matches the GPS update rate — imperceptible lag in practice |
| **Trade-off** | ~1s state latency vs real-time push. Acceptable for a walking-pace game |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript 5.7 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| UI Components | [Radix UI](https://www.radix-ui.com/) |
| Location | Browser Geolocation API (`watchPosition`) |
| State sync | HTTP Polling — native `fetch` against Next.js API routes |
| Spatial math | Haversine formula (built-in, zero dependencies) |
| Mobile UX | Web Vibration API (haptics) + Web Audio API (spatial sound) |
| Deployment | [Vercel](https://vercel.com) (zero config) |

---

## 📁 Project Structure

```
demonet-radar-hunt/
├── app/
│   ├── api/
│   │   ├── lobby/
│   │   │   ├── create/route.ts       # POST — create room, returns 6-char code
│   │   │   ├── join/route.ts         # POST — join by code
│   │   │   └── state/route.ts        # GET — poll lobby | POST — ready/leave
│   │   └── game/
│   │       ├── start/route.ts        # POST — host starts, roles assigned
│   │       ├── state/route.ts        # GET — poll game state | POST — push GPS
│   │       └── action/route.ts       # POST — catch / ability / vote
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Root → <StrangerThingsGame />
│
├── components/game/
│   ├── stranger-things-game.tsx      # Root state machine (screens + player ID)
│   ├── counter-entry.tsx             # Landing / entry screen
│   ├── join-screen.tsx               # Create or join lobby
│   ├── lobby-screen.tsx              # Waiting room with ready toggle
│   ├── role-reveal-screen.tsx        # Role assignment reveal
│   ├── game-screen.tsx               # Main gameplay view
│   ├── vote-screen.tsx               # Emergency vote UI
│   ├── post-game-screen.tsx          # Results + winner
│   ├── player-hud.tsx                # Radar, timer, phase indicator
│   ├── abilities-panel.tsx           # Ability buttons with cooldown display
│   ├── radar-canvas.tsx              # Canvas-based proximity radar renderer
│   ├── alert-banner.tsx              # In-game event notifications
│   ├── broadcast-panel.tsx           # Game-wide message feed
│   ├── flash-card.tsx                # Role / event overlay cards
│   ├── lightning-background.tsx      # Animated background effect
│   └── trees.tsx                     # Decorative scene elements
│
├── hooks/
│   ├── use-gps.ts                    # watchPosition wrapper with error handling
│   ├── use-socket.ts                 # Polling abstraction layer
│   ├── use-spatial-audio.ts          # Positional audio (Web Audio API)
│   ├── use-haptics.ts                # Device vibration patterns
│   ├── use-mobile.ts                 # Viewport / device detection
│   └── use-toast.ts                  # Toast notification hook
│
├── lib/
│   └── game-store.ts                 # In-memory game state + all game logic
│
└── styles/
    └── globals.css
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18+**
- npm or pnpm
- A phone or browser with GPS support
  *(Chrome DevTools → Sensors → Location can spoof coordinates for local testing)*

### 1. Clone

```bash
git clone https://github.com/your-username/demonet-radar-hunt.git
cd demonet-radar-hunt
```

### 2. Install

```bash
npm install
# or
pnpm install
```

### 3. Run

```bash
npm run dev
```

Open `http://localhost:3000`. No environment variables are required for local development.

> **Testing solo?** Open 3–4 browser tabs. Each tab generates an independent `playerId` — you can simulate a full game from one machine using Chrome DevTools to spoof different GPS coordinates per tab *(DevTools → More tools → Sensors → Location)*.

---

## 🌐 Deployment

DEMONET requires **no backend server**. Deploy the Next.js app and you're done.

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

All API routes deploy as serverless functions automatically. Zero configuration needed.

### Other platforms

Any platform that supports Next.js works — Netlify, Railway, Render, Fly.io.

```bash
npm run build
npm run start
```

> **Production note:** The in-memory game store does not persist across serverless function cold starts or multiple instances. For high-traffic or multi-region deployments, replace the `Map` in `lib/game-store.ts` with a Redis-backed store (e.g. [Upstash](https://upstash.com/)). The rest of the app does not need to change.

---

## 📡 API Reference

All endpoints are Next.js route handlers under `/api/`. State is polled client-side every ~1 second; no persistent connection is required.

### Lobby

#### `POST /api/lobby/create`
Create a new game room.

```jsonc
// Request
{ "playerId": "player_abc123", "playerName": "Eleven" }

// Response
{ "success": true, "gameCode": "XK7M2P", "isHost": true }
```

#### `POST /api/lobby/join`
Join an existing room by code.

```jsonc
// Request
{ "gameCode": "XK7M2P", "playerId": "player_def456", "playerName": "Mike" }

// Response
{ "success": true, "gameCode": "XK7M2P", "isHost": false }
```

#### `GET /api/lobby/state?gameCode=XK7M2P&playerId=player_abc123`
Poll lobby state. Returns player list, ready states, and host ID.
If the game has already started, returns `{ "state": "playing", "gameStarted": true, "role": "security" }` so late-polling clients can transition screens automatically.

#### `POST /api/lobby/state`
Update ready state or leave the room.

```jsonc
// Toggle ready
{ "gameCode": "XK7M2P", "playerId": "player_abc123", "action": "ready", "ready": true }

// Leave room
{ "gameCode": "XK7M2P", "playerId": "player_abc123", "action": "leave" }
```

---

### Game

#### `POST /api/game/start`
Host starts the game. Server randomly assigns roles and begins the timer.

```jsonc
// Request
{ "gameCode": "XK7M2P", "playerId": "player_abc123" }

// Response
{ "success": true, "role": "demogorgon" }
```

#### `GET /api/game/state?gameCode=XK7M2P&playerId=player_abc123`
Poll full game state for a specific player. Returns **role-filtered data** — Security cannot see the Demogorgon's exact position; Demogorgon sees everyone.

```jsonc
{
  "state": "playing",
  "phase": "mid",
  "role": "security",
  "isAlive": true,
  "timeRemaining": 742,
  "threatLevel": 0.72,
  "threatBearing": 134,
  "visiblePlayers": [...],
  "playerCount": 5,
  "aliveCount": 4,
  "winner": null
}
```

#### `POST /api/game/state`
Push the player's current GPS coordinates to the server. Triggers phase recalculation and win condition check. Returns the updated game state.

```jsonc
// Request
{ "gameCode": "XK7M2P", "playerId": "player_abc123", "lat": 20.2961, "lng": 85.8245 }
```

#### `POST /api/game/action`
Perform a game action. The `action` field determines behaviour.

| `action` | Who can use | Extra fields | Effect |
|----------|-------------|--------------|--------|
| `catch` | Demogorgon | `targetId` | Validates ≤10m gap; marks target eliminated |
| `ability` | Role-specific | `abilityType` | Executes ability, starts cooldown |
| `callVote` | Any alive player | — | Opens 60s voting window for all players |
| `vote` | Any alive player | `targetId` | Registers vote; resolves immediately if all votes are cast |

**Ability types:**

| `abilityType` | Role | Cooldown | Effect |
|---------------|------|----------|--------|
| `phaseShift` | Demogorgon | 30s | 10s radar invisibility |
| `sense` | Demogorgon | 30s | Returns bearing + distance of nearest prey |
| `triangulate` | Security | 60s | Returns Demogorgon's approx. position (±50–100m noise) |
| `fakeSignal` | Stealth | 30s | Emits a false radar ping to mislead Security |

---

## ⚙️ Game Configuration

Key constants in `lib/game-store.ts`:

| Constant | Default | Description |
|----------|---------|-------------|
| `gameDuration` | `900s` (15 min) | Total game length |
| Catch radius | `10 m` | Demogorgon must be within 10m to eliminate |
| Max players | `10` | Per room |
| Stealth threshold | `4 players` | Stealth role only assigned at 4+ players |
| Phase Shift duration | `10s` | Invisibility window |
| Default ability cooldown | `30s` | Phase Shift, Sense, Fake Signal |
| Triangulate cooldown | `60s` | Security's location reveal ability |
| Voting window | `60s` | Time for all alive players to cast votes |
| Room expiry | `2 hours` | Inactive rooms are automatically cleaned up |

---

## 🧠 Technical Notes

**GPS accuracy**
The Geolocation API is called with `enableHighAccuracy: true`, `maximumAge: 2000ms`, `timeout: 8000ms`. Real-world accuracy is typically 3–15m outdoors on modern phones. The 10m catch radius sits at the lower bound of this range — it requires genuine physical proximity.

**Server-authoritative design**
All sensitive logic runs server-side: role assignment, catch validation, distance calculation, ability resolution, and vote counting. Clients only send raw GPS coordinates and action intent — they cannot self-report a catch or fake a position that changes server state.

**Haversine distance**
All distance calculations use the Haversine great-circle formula to account for Earth's curvature. Accurate to within ~0.3% for the 10m–500m distances relevant to this game.

**Polling latency**
Clients poll `/api/game/state` approximately once per second, matching the GPS update cadence. The perceived lag between a position update and a radar change is under 2 seconds — imperceptible at walking or running speed.

**Scaling**
The in-memory `Map` is per-process. For horizontal scaling, replace the store with Redis and add a shared state layer. The `game-store.ts` module exposes a clean, synchronous-style interface — the rest of the app does not need to change.

---

## 🗺️ Roadmap

- [ ] Redis-backed persistent game store for multi-instance deployments
- [ ] Custom game zone boundaries — draw a polygon on a map to confine gameplay
- [ ] Spectator mode — live god's-eye view of the entire hunt
- [ ] Configurable game settings per lobby (duration, catch radius, cooldowns)
- [ ] Persistent leaderboard across sessions
- [ ] PWA packaging for home-screen install and offline splash screen

---

## 👨‍💻 Team

Built at **Hackathon 2025** by:

| Name | GitHub |
|------|--------|
| Ansuman Swain | [@lightlimb78](https://github.com/lightlimb78) |
| Dibyam Chandak | — |
| Ashutosh Narayan | [@Ashutosh-334](https://github.com/Ashutosh-334) |
| Suresh Kumar Ekka | [@sureshkum4r](https://github.com/sureshkum4r) |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built in a hackathon. Ready to be played anywhere.**

*DEMONET: RADAR HUNT — because the real Upside Down was the friends we hunted along the way.*

</div>
