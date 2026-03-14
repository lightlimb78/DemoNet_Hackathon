// In-memory game state store (for serverless deployment)
// In production, replace with Redis or a database

export type Role = "security" | "stealth" | "demogorgon"
export type GamePhase = "early" | "mid" | "late" | "bloodmoon"
export type AbilityType = "phaseShift" | "fakeSignal" | "sense" | "triangulate"

export interface Position {
  lat: number
  lng: number
  timestamp: number
}

export interface Player {
  id: string
  name: string
  socketId?: string
  role?: Role
  position?: Position
  isReady: boolean
  isAlive: boolean
  isInvisible: boolean
  lastActivity: number
}

export interface Vote {
  voterId: string
  targetId: string
}

export interface AbilityCooldown {
  ability: AbilityType
  readyAt: number
}

export interface GameRoom {
  code: string
  hostId: string
  players: Map<string, Player>
  state: "lobby" | "playing" | "voting" | "ended"
  phase: GamePhase
  startTime?: number
  gameDuration: number // in seconds
  votes: Vote[]
  votingEndTime?: number
  triangulationCooldown: number
  lastTriangulationTime: number
  abilityCooldowns: Map<string, AbilityCooldown[]>
  winner?: "security" | "demogorgon"
  createdAt: number
}

// Global game rooms store
const gameRooms = new Map<string, GameRoom>()

// Cleanup old rooms periodically (rooms older than 2 hours)
const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000

function cleanupOldRooms() {
  const now = Date.now()
  for (const [code, room] of gameRooms) {
    if (now - room.createdAt > ROOM_EXPIRY_MS) {
      gameRooms.delete(code)
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldRooms, 10 * 60 * 1000)
}

export function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  // Ensure unique
  if (gameRooms.has(code)) {
    return generateGameCode()
  }
  return code
}

export function createRoom(hostId: string, hostName: string): GameRoom {
  const code = generateGameCode()
  const room: GameRoom = {
    code,
    hostId,
    players: new Map([
      [hostId, {
        id: hostId,
        name: hostName,
        isReady: false,
        isAlive: true,
        isInvisible: false,
        lastActivity: Date.now()
      }]
    ]),
    state: "lobby",
    phase: "early",
    gameDuration: 15 * 60, // 15 minutes default
    votes: [],
    triangulationCooldown: 60,
    lastTriangulationTime: 0,
    abilityCooldowns: new Map(),
    createdAt: Date.now()
  }
  gameRooms.set(code, room)
  return room
}

export function getRoom(code: string): GameRoom | undefined {
  return gameRooms.get(code.toUpperCase())
}

export function joinRoom(code: string, playerId: string, playerName: string): { success: boolean; error?: string; room?: GameRoom } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) {
    return { success: false, error: "Room not found" }
  }
  if (room.state !== "lobby") {
    return { success: false, error: "Game already in progress" }
  }
  if (room.players.size >= 10) {
    return { success: false, error: "Room is full" }
  }
  if (room.players.has(playerId)) {
    // Already in room, just update
    const player = room.players.get(playerId)!
    player.lastActivity = Date.now()
    return { success: true, room }
  }
  
  room.players.set(playerId, {
    id: playerId,
    name: playerName,
    isReady: false,
    isAlive: true,
    isInvisible: false,
    lastActivity: Date.now()
  })
  return { success: true, room }
}

export function leaveRoom(code: string, playerId: string): { success: boolean; newHostId?: string } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return { success: false }
  
  room.players.delete(playerId)
  
  // If room is empty, delete it
  if (room.players.size === 0) {
    gameRooms.delete(code.toUpperCase())
    return { success: true }
  }
  
  // If host left, assign new host
  let newHostId: string | undefined
  if (room.hostId === playerId) {
    const newHost = room.players.keys().next().value
    if (newHost) {
      room.hostId = newHost
      newHostId = newHost
    }
  }
  
  return { success: true, newHostId }
}

export function setPlayerReady(code: string, playerId: string, ready: boolean): boolean {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return false
  
  const player = room.players.get(playerId)
  if (!player) return false
  
  player.isReady = ready
  player.lastActivity = Date.now()
  return true
}

export function assignRoles(room: GameRoom): void {
  const playerIds = Array.from(room.players.keys())
  
  // Shuffle players
  for (let i = playerIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]]
  }
  
  // Assign roles
  playerIds.forEach((id, index) => {
    const player = room.players.get(id)!
    if (index === 0) {
      player.role = "demogorgon"
    } else if (index === 1 && playerIds.length >= 4) {
      player.role = "stealth"
    } else {
      player.role = "security"
    }
    player.isAlive = true
    player.isInvisible = false
  })
}

export function startGame(code: string): { success: boolean; error?: string } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return { success: false, error: "Room not found" }
  
  if (room.players.size < 2) {
    return { success: false, error: "Need at least 2 players" }
  }
  
  // Check all players ready
  for (const player of room.players.values()) {
    if (!player.isReady) {
      return { success: false, error: "Not all players are ready" }
    }
  }
  
  assignRoles(room)
  room.state = "playing"
  room.startTime = Date.now()
  room.phase = "early"
  
  return { success: true }
}

export function updatePlayerPosition(code: string, playerId: string, lat: number, lng: number): boolean {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return false
  
  const player = room.players.get(playerId)
  if (!player) return false
  
  player.position = { lat, lng, timestamp: Date.now() }
  player.lastActivity = Date.now()
  
  // Update game phase based on elapsed time
  if (room.startTime) {
    const elapsed = (Date.now() - room.startTime) / 1000
    const total = room.gameDuration
    
    if (elapsed < total * 0.25) {
      room.phase = "early"
    } else if (elapsed < total * 0.5) {
      room.phase = "mid"
    } else if (elapsed < total * 0.75) {
      room.phase = "late"
    } else {
      room.phase = "bloodmoon"
    }
    
    // Check for game end
    if (elapsed >= total) {
      room.state = "ended"
      room.winner = "security"
    }
  }
  
  return true
}

// Haversine formula for distance calculation
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

  const bearing = (Math.atan2(y, x) * 180) / Math.PI
  return (bearing + 360) % 360
}

export function getThreatLevel(distance: number, phase: GamePhase): number {
  const maxRange = phase === "bloodmoon" ? 500 : phase === "late" ? 300 : phase === "mid" ? 200 : 150
  if (distance > maxRange) return 0
  return Math.max(0, 1 - distance / maxRange)
}

export function getGameState(code: string, playerId: string): object | null {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return null
  
  const player = room.players.get(playerId)
  if (!player) return null
  
  // Find demogorgon for threat calculations
  let demogorgon: Player | undefined
  for (const p of room.players.values()) {
    if (p.role === "demogorgon") {
      demogorgon = p
      break
    }
  }
  
  // Calculate threat info for security players
  let threatLevel = 0
  let threatBearing = 0
  
  if (player.role === "security" && demogorgon?.position && player.position && !demogorgon.isInvisible) {
    const distance = calculateDistance(
      player.position.lat,
      player.position.lng,
      demogorgon.position.lat,
      demogorgon.position.lng
    )
    threatLevel = getThreatLevel(distance, room.phase)
    threatBearing = calculateBearing(
      player.position.lat,
      player.position.lng,
      demogorgon.position.lat,
      demogorgon.position.lng
    )
  }
  
  // Build visible players list
  const visiblePlayers: object[] = []
  for (const p of room.players.values()) {
    if (p.id === playerId) continue
    if (!p.isAlive) continue
    
    // Demogorgon sees everyone
    // Security sees other security
    // Stealth is only seen when very close
    const canSee = player.role === "demogorgon" || 
      (player.role === "security" && p.role === "security") ||
      (p.role !== "stealth" && !p.isInvisible)
    
    if (canSee && p.position) {
      visiblePlayers.push({
        id: p.id,
        name: p.name,
        role: player.role === "demogorgon" ? p.role : undefined,
        position: p.position,
        isAlive: p.isAlive
      })
    }
  }
  
  const timeRemaining = room.startTime 
    ? Math.max(0, room.gameDuration - (Date.now() - room.startTime) / 1000)
    : room.gameDuration
  
  return {
    gameCode: room.code,
    state: room.state,
    phase: room.phase,
    role: player.role,
    isAlive: player.isAlive,
    position: player.position,
    timeRemaining: Math.floor(timeRemaining),
    threatLevel,
    threatBearing,
    visiblePlayers,
    playerCount: room.players.size,
    aliveCount: Array.from(room.players.values()).filter(p => p.isAlive).length,
    winner: room.winner
  }
}

export function attemptCatch(code: string, catcherId: string, targetId: string): { success: boolean; caught: boolean; error?: string } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return { success: false, caught: false, error: "Room not found" }
  
  const catcher = room.players.get(catcherId)
  const target = room.players.get(targetId)
  
  if (!catcher || !target) return { success: false, caught: false, error: "Player not found" }
  if (catcher.role !== "demogorgon") return { success: false, caught: false, error: "Only Demogorgon can catch" }
  if (!target.isAlive) return { success: false, caught: false, error: "Target already eliminated" }
  if (!catcher.position || !target.position) return { success: false, caught: false, error: "Position unknown" }
  
  const distance = calculateDistance(
    catcher.position.lat,
    catcher.position.lng,
    target.position.lat,
    target.position.lng
  )
  
  if (distance <= 10) {
    target.isAlive = false
    
    // Check win condition
    const aliveNonDemogorgon = Array.from(room.players.values()).filter(
      p => p.isAlive && p.role !== "demogorgon"
    )
    
    if (aliveNonDemogorgon.length === 0) {
      room.state = "ended"
      room.winner = "demogorgon"
    }
    
    return { success: true, caught: true }
  }
  
  return { success: true, caught: false, error: "Target too far" }
}

export function useAbility(code: string, playerId: string, ability: AbilityType): { success: boolean; error?: string; data?: object } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return { success: false, error: "Room not found" }
  
  const player = room.players.get(playerId)
  if (!player) return { success: false, error: "Player not found" }
  
  // Check cooldown
  const cooldowns = room.abilityCooldowns.get(playerId) || []
  const activeCooldown = cooldowns.find(c => c.ability === ability && c.readyAt > Date.now())
  if (activeCooldown) {
    return { success: false, error: `Ability on cooldown for ${Math.ceil((activeCooldown.readyAt - Date.now()) / 1000)}s` }
  }
  
  const cooldownDuration = ability === "triangulate" ? 60000 : 30000
  
  // Add cooldown
  const newCooldowns = cooldowns.filter(c => c.ability !== ability)
  newCooldowns.push({ ability, readyAt: Date.now() + cooldownDuration })
  room.abilityCooldowns.set(playerId, newCooldowns)
  
  // Execute ability
  switch (ability) {
    case "phaseShift":
      if (player.role !== "demogorgon") return { success: false, error: "Only Demogorgon can use this" }
      player.isInvisible = true
      setTimeout(() => { player.isInvisible = false }, 10000) // 10 second invisibility
      return { success: true, data: { duration: 10 } }
      
    case "sense":
      if (player.role !== "demogorgon") return { success: false, error: "Only Demogorgon can use this" }
      // Find nearest prey
      let nearestPrey: { id: string; bearing: number; distance: number } | null = null
      for (const p of room.players.values()) {
        if (p.role === "demogorgon" || !p.isAlive || !p.position || !player.position) continue
        const dist = calculateDistance(player.position.lat, player.position.lng, p.position.lat, p.position.lng)
        if (!nearestPrey || dist < nearestPrey.distance) {
          nearestPrey = {
            id: p.id,
            bearing: calculateBearing(player.position.lat, player.position.lng, p.position.lat, p.position.lng),
            distance: dist
          }
        }
      }
      return { success: true, data: { nearestPrey } }
      
    case "triangulate":
      if (player.role !== "security") return { success: false, error: "Only Security can use this" }
      // Find demogorgon position with some fuzz
      let demoPos: { lat: number; lng: number } | null = null
      for (const p of room.players.values()) {
        if (p.role === "demogorgon" && p.position) {
          // Add random offset (50-100m)
          const offset = 0.0005 + Math.random() * 0.0005
          demoPos = {
            lat: p.position.lat + (Math.random() - 0.5) * offset,
            lng: p.position.lng + (Math.random() - 0.5) * offset
          }
          break
        }
      }
      return { success: true, data: { approximatePosition: demoPos } }
      
    default:
      return { success: false, error: "Unknown ability" }
  }
}

export function startVoting(code: string, callerId: string): { success: boolean; error?: string } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return { success: false, error: "Room not found" }
  if (room.state !== "playing") return { success: false, error: "Game not in progress" }
  
  room.state = "voting"
  room.votes = []
  room.votingEndTime = Date.now() + 60000 // 60 second voting
  
  return { success: true }
}

export function castVote(code: string, voterId: string, targetId: string): { success: boolean; error?: string } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return { success: false, error: "Room not found" }
  if (room.state !== "voting") return { success: false, error: "Not in voting phase" }
  
  const voter = room.players.get(voterId)
  if (!voter || !voter.isAlive) return { success: false, error: "Cannot vote" }
  
  // Remove previous vote
  room.votes = room.votes.filter(v => v.voterId !== voterId)
  room.votes.push({ voterId, targetId })
  
  // Check if all alive players voted
  const aliveCount = Array.from(room.players.values()).filter(p => p.isAlive).length
  if (room.votes.length >= aliveCount) {
    return processVoteResults(code)
  }
  
  return { success: true }
}

function processVoteResults(code: string): { success: boolean; error?: string; eliminated?: string } {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return { success: false, error: "Room not found" }
  
  // Count votes
  const voteCounts = new Map<string, number>()
  for (const vote of room.votes) {
    voteCounts.set(vote.targetId, (voteCounts.get(vote.targetId) || 0) + 1)
  }
  
  // Find most voted
  let maxVotes = 0
  let eliminated: string | undefined
  let tie = false
  
  for (const [id, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count
      eliminated = id
      tie = false
    } else if (count === maxVotes) {
      tie = true
    }
  }
  
  // Need majority and no tie
  const aliveCount = Array.from(room.players.values()).filter(p => p.isAlive).length
  if (!tie && eliminated && maxVotes > aliveCount / 2) {
    const player = room.players.get(eliminated)
    if (player) {
      player.isAlive = false
      
      // Check win conditions
      if (player.role === "demogorgon") {
        room.state = "ended"
        room.winner = "security"
      } else {
        const aliveNonDemogorgon = Array.from(room.players.values()).filter(
          p => p.isAlive && p.role !== "demogorgon"
        )
        if (aliveNonDemogorgon.length === 0) {
          room.state = "ended"
          room.winner = "demogorgon"
        }
      }
    }
  }
  
  room.state = room.state === "ended" ? "ended" : "playing"
  room.votes = []
  room.votingEndTime = undefined
  
  return { success: true, eliminated: tie ? undefined : eliminated }
}

export function getLobbyState(code: string): object | null {
  const room = gameRooms.get(code.toUpperCase())
  if (!room) return null
  
  const players = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    isReady: p.isReady
  }))
  
  return {
    code: room.code,
    hostId: room.hostId,
    players,
    state: room.state,
    canStart: players.length >= 2 && players.every(p => p.isReady)
  }
}
