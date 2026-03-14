 🔦 Stranger Things: Real-World GPS Hunt

> *Among Us — but you physically walk, run, and hide in the real world.*

A real-time, location-based multiplayer game where players take on secret roles and physically move through the real world to hunt — or survive — the Demogorgon. Built with Next.js, Socket.IO, and the browser Geolocation API.

---

## 🎮 How It Works

1. A **host** creates a lobby and shares a 6-character room code.
2. Players **join** on their phones and mark themselves ready.
3. The server **secretly assigns roles** — Demogorgon, Security, or Stealth.
4. Everyone **physically moves** through the real-world area. Your GPS position is your game position.
5. Security agents track threat proximity via a **radar**. The Demogorgon hunts using special abilities.
6. The game ends when either the **timer expires** (Security wins) or **all agents are caught** (Demogorgon wins).

---

## 👥 Roles

| Role | Team | Win Condition | Key Abilities |
|------|------|---------------|---------------|
| **Demogorgon** | Hunter | Catch all Security agents | Phase Shift (10s invisibility), Sense (detect nearest prey) |
| **Security** | Survivors | Survive 15 min or vote out the Demogorgon | GPS radar, Triangulate (approximate Demogorgon position) |
| **Stealth** | Hunter | Help Demogorgon eliminate all Security | Hidden from radar, Fake Signal (mislead agents) |

> Stealth is only assigned in games with **4 or more players**.

---

## ⚡ Game Phases

The Demogorgon's effective radar detection range grows as the game progresses — tension is guaranteed even in quiet early rounds.

| Phase | Time Window | Radar Range |
|-------|-------------|-------------|
| Early | 0–25% | 150 m |
| Mid | 25–50% | 200 m |
| Late | 50–75% | 300 m |
| Blood Moon | 75–100% | 500 m |

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** — React framework with App Router and API routes
- **[Socket.IO Client](https://socket.io/)** — Real-time bidirectional event communication
- **Browser Geolocation API** — Continuous GPS tracking via `watchPosition`
- **[Tailwind CSS v4](https://tailwindcss.com/)** + **[Radix UI](https://www.radix-ui.com/)** — Accessible, styled UI components
- **Spatial Audio & Haptics** — Immersive mobile feedback hooks

### Backend
- **[Socket.IO Server](https://socket.io/)** — Node.js WebSocket server handling all game events
- **In-memory game state** — Fast, serverless-friendly room management (swap to Redis for production)
- **Haversine formula** — Server-side GPS distance and bearing calculations
- **Server-authoritative logic** — Role assignment, catch validation, vote processing all happen server-side

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── game/
│   │   │   ├── action/route.ts    # catch, ability, vote endpoints
│   │   │   ├── start/route.ts     # start game endpoint
│   │   │   └── state/route.ts     # poll game state
│   │   └── lobby/
│   │       ├── create/route.ts    # create a new room
│   │       ├── join/route.ts      # join existing room
│   │       └── state/route.ts     # poll lobby state
│   └── page.tsx                   # Entry point
├── components/
│   └── game/
│       ├── stranger-things-game.tsx   # Root game component
│       ├── lobby-screen.tsx           # Waiting room UI
│       ├── role-reveal-screen.tsx     # Role assignment reveal
│       ├── game-screen.tsx            # Main gameplay UI
│       ├── vote-screen.tsx            # Emergency vote UI
│       ├── post-game-screen.tsx       # Results screen
│       ├── player-hud.tsx             # In-game HUD (radar, timer)
│       ├── abilities-panel.tsx        # Ability buttons + cooldowns
│       ├── radar-canvas.tsx           # Proximity radar renderer
│       └── flash-card.tsx             # Role/event notification cards
├── hooks/
│   ├── use-gps.ts                 # GPS watchPosition wrapper
│   ├── use-socket.ts              # Socket.IO connection hook
│   ├── use-spatial-audio.ts       # Positional audio hook
│   └── use-haptics.ts             # Device vibration hook
├── lib/
│   └── game-store.ts              # In-memory game state + logic
└── server/
    └── index.ts                   # Socket.IO server (separate process)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- A device with GPS (or Chrome DevTools location spoofing for testing)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/stranger-things-gps.git
cd stranger-things-gps
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# For local development — the Socket.IO server runs on port 4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 4. Run the development servers

You need to run **both** the Next.js frontend and the Socket.IO server:

```bash
# Run both simultaneously
npm run dev:all

# Or in separate terminals:
npm run dev          # Next.js on http://localhost:3000
npm run dev:socket   # Socket.IO server on http://localhost:4000
```

### 5. Open in browser

Go to `http://localhost:3000`, create a lobby, and share the room code with other players.

> **Testing alone?** Open multiple browser tabs — each tab gets an independent player session.

---

## 🌐 Deployment

### Frontend (Next.js)

Deploy to [Vercel](https://vercel.com) with zero config:

```bash
vercel --prod
```

Set the environment variable in your Vercel project dashboard:
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
```

### Socket.IO Server

The Socket.IO server needs a persistent Node.js environment (not serverless). Recommended platforms:

- **[Railway](https://railway.app)** — `npm run start:socket`
- **[Render](https://render.com)** — Web Service with `node dist/index.js`
- **[Fly.io](https://fly.io)** — Good for WebSocket-heavy workloads

Build the server before deploying:

```bash
npm run build:socket   # Compiles TypeScript to dist/
npm run start:socket   # Starts compiled server
```

Set `CORS_ORIGIN` on the server to your frontend URL:
```env
CORS_ORIGIN=https://your-app.vercel.app
PORT=4000
```

---

## 🎮 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run dev:socket` | Start Socket.IO server with hot reload |
| `npm run dev:all` | Run both servers concurrently |
| `npm run build` | Build Next.js for production |
| `npm run build:socket` | Compile Socket.IO server TypeScript |
| `npm run start` | Start Next.js production server |
| `npm run start:socket` | Start compiled Socket.IO server |
| `npm run lint` | Run ESLint |

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby:create` | `{ playerId, playerName }` | Create a new room |
| `lobby:join` | `{ gameCode, playerId, playerName }` | Join an existing room |
| `lobby:ready` | `{ gameCode, playerId, ready }` | Toggle ready state |
| `lobby:leave` | `{ gameCode, playerId }` | Leave the room |
| `game:start` | `{ gameCode, playerId }` | Host starts the game |
| `game:position` | `{ gameCode, playerId, lat, lng }` | Broadcast GPS position |
| `game:catch` | `{ gameCode, playerId, targetId }` | Demogorgon attempts a catch |
| `game:ability` | `{ gameCode, playerId, abilityType }` | Use a role ability |
| `game:callVote` | `{ gameCode, playerId }` | Trigger emergency vote |
| `game:vote` | `{ gameCode, playerId, targetId }` | Cast vote for a player |

### Server → Client

| Event | Description |
|-------|-------------|
| `lobby:state` | Updated lobby player list |
| `game:started` | Game has begun, includes assigned role |
| `game:state` | Per-player game state update (1 s tick) |
| `game:phaseChange` | Game phase has escalated |
| `game:elimination` | A player has been caught |
| `game:voteStarted` | Emergency vote initiated |
| `game:voteUpdate` | Vote count progress |
| `game:voteResult` | Vote outcome + eliminated player |
| `game:ended` | Game over with winner |

---

## ⚙️ Configuration

Key game constants in `lib/game-store.ts` and `server/index.ts`:

| Constant | Default | Description |
|----------|---------|-------------|
| `gameDuration` | `900` s (15 min) | Total game length |
| `CATCH_RANGE` | `10` m | Demogorgon catch radius |
| `phaseShift duration` | `10` s | Invisibility ability duration |
| `triangulate cooldown` | `60` s | Cooldown for Triangulate ability |
| `other ability cooldown` | `30` s | Cooldown for other abilities |
| `voting window` | `60` s | Time to cast votes |
| `max players` | `10` | Max players per room |
| `ROOM_EXPIRY_MS` | `2` hr | Inactive room cleanup time |

---

## 🧠 Architecture Notes

**Why a separate Socket.IO server?**
Next.js API routes are stateless and short-lived. Real-time game state (positions, cooldowns, vote counts) needs a persistent process with shared memory. The Socket.IO server holds all game rooms in a `Map` and broadcasts updates every second.

**GPS accuracy**
The browser Geolocation API requests `enableHighAccuracy: true`. In practice, accuracy ranges from 3–15 m outdoors. The 10 m catch radius accounts for this — works reliably in open spaces, less so in dense buildings.

**Production state**
The current in-memory store works for small deployments. For multi-server production, replace `gameRooms` with a Redis-backed store and use Socket.IO's Redis adapter for cross-instance event broadcasting.

---

## 🗺️ Roadmap

- [ ] Persistent leaderboard (Redis / Supabase)
- [ ] Custom game zones (draw map boundaries)
- [ ] Spectator mode with god's-eye view
- [ ] PWA / installable native app
- [ ] Configurable game duration and player caps
- [ ] Sound packs and custom themes

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

> *Built at a hackathon. Ready to be played anywhere.*
