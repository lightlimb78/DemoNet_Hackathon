"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { RadarCanvas, type RadarPlayer } from "./radar-canvas"
import { PlayerHUD } from "./player-hud"
import { AlertBanner } from "./alert-banner"
import { AbilitiesPanel } from "./abilities-panel"
import { BroadcastPanel } from "./broadcast-panel"
import { VoteScreen } from "./vote-screen"
import { PostGameScreen } from "./post-game-screen"
import { FlashCard, useFlashCard } from "./flash-card"
import { useGPS } from "@/hooks/use-gps"
import { useHaptics } from "@/hooks/use-haptics"
import { useSpatialAudio } from "@/hooks/use-spatial-audio"

// ── Types ──────────────────────────────────────────────────
interface Player {
  id: string
  name: string
  role: string
  status: string
  lat: number | null
  lng: number | null
  x: number
  y: number
  isVisible?: boolean
  isDecoy?: boolean
  abilities?: Record<string, { used: boolean; activeUntil: number }>
}

interface PhaseConfig {
  demoSpeedMult: number
  radarMult: number
  interferenceBoost: number
}

interface Broadcast {
  id: string
  message: string
  triggeredBy: string
  timestamp: number
}

interface VoteSession {
  initiatorName: string
  eligiblePlayers: { id: string; name: string }[]
  timeRemaining: number
  voteCast: number
  totalPlayers: number
}

interface ThreatData {
  threatLevel: number
  bearing: number | null
  distanceMetres: number
  demogorgonNearby: boolean
}

interface PreyDirection {
  bearing: number
  distanceMetres: number
}

interface GameEndData {
  winner: "security" | "demogorgon"
  reason: string
  replay: {
    stats: {
      id: string
      name: string
      role: string
      survived: boolean
      survivalTime: number
      eliminations: number
    }[]
    gameDuration: number
  }
}

// ── GPS to radar metre offset (relative to self) ────────────
function gpsToMetreOffset(
  refLat: number, refLng: number,
  targetLat: number | null, targetLng: number | null
): { x: number; y: number } {
  if (targetLat == null || targetLng == null) return { x: 0, y: 0 }
  const metersPerDegLat = 111320
  const metersPerDegLng = 111320 * Math.cos((refLat * Math.PI) / 180)
  return {
    x: (targetLng - refLng) * metersPerDegLng,
    y: (targetLat - refLat) * metersPerDegLat,
  }
}

// ── Props ──────────────────────────────────────────────────
interface GameScreenProps {
  playerName: string
  playerId: string
  role: string
  gameCode: string
  isHost: boolean
  gameSettings: { duration: number; radarRange: number; enableAbilities: boolean; enableVoting: boolean }
  onLeave: () => void
}

export function GameScreen({
  playerName,
  playerId,
  role,
  gameCode,
  isHost,
  gameSettings,
  onLeave,
}: GameScreenProps) {
  const { vibrateHeartbeat, vibrateCaught, vibrateAlert, vibrateElimination, vibrateAbility } = useHaptics()
  const { playPing, playDirectionalAlert, playEliminationScream, playStaticBurst, unlock } = useSpatialAudio()
  const { current: flashCard, show: showFlash, dismiss: dismissFlash } = useFlashCard()

  // ── Game state ──────────────────────────────────────────
  const [players, setPlayers] = useState<Player[]>([])
  const [phase, setPhase] = useState("early")
  const [phaseConfig, setPhaseConfig] = useState<PhaseConfig>({ demoSpeedMult: 1, radarMult: 1, interferenceBoost: 0 })
  const [timeRemaining, setTimeRemaining] = useState(gameSettings.duration)
  const [threat, setThreat] = useState<ThreatData>({ threatLevel: 0, bearing: null, distanceMetres: Infinity, demogorgonNearby: false })
  const [preyDirection, setPreyDirection] = useState<PreyDirection | undefined>()
  const [myAbilities, setMyAbilities] = useState<Record<string, { used: boolean; activeUntil: number }>>({})
  const [isVisible, setIsVisible] = useState(true)
  const [isAlive, setIsAlive] = useState(true)

  // ── Alert ────────────────────────────────────────────────
  const [alert, setAlert] = useState<{ message: string; type: "danger" | "warning" | "info" | "scream" } | null>(null)
  const alertTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Broadcasts ───────────────────────────────────────────
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])

  // ── Vote ─────────────────────────────────────────────────
  const [voteSession, setVoteSession] = useState<VoteSession | null>(null)
  const [myVote, setMyVote] = useState<string | null>(null)

  // ── Triangulation ─────────────────────────────────────────
  const [triangulationActive, setTriangulationActive] = useState(false)
  const [triangulationPos, setTriangulationPos] = useState<{ x: number; y: number } | null>(null)

  // ── Game end ─────────────────────────────────────────────
  const [gameEnd, setGameEnd] = useState<GameEndData | null>(null)

  // ── Panel visibility ─────────────────────────────────────
  const [showAbilities, setShowAbilities] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)

  // ── GPS ──────────────────────────────────────────────────
  const myPosRef = useRef<{ lat: number; lng: number } | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPhaseRef = useRef<string>("early")

  const { position: gpsPos, error: gpsError } = useGPS(true, (pos) => {
    myPosRef.current = pos
  })

  // ── Audio unlock on first touch ──────────────────────────
  useEffect(() => {
    const handler = () => unlock()
    window.addEventListener("touchstart", handler, { once: true })
    window.addEventListener("click", handler, { once: true })
    return () => {
      window.removeEventListener("touchstart", handler)
      window.removeEventListener("click", handler)
    }
  }, [unlock])

  // ── Show alert helper ─────────────────────────────────────
  const showAlert = useCallback((message: string, type: "danger" | "warning" | "info" | "scream", duration = 4000) => {
    setAlert({ message, type })
    if (alertTimeout.current) clearTimeout(alertTimeout.current)
    alertTimeout.current = setTimeout(() => setAlert(null), duration)
  }, [])

  // ── Poll game state ─────────────────────────────────────
  const fetchGameState = useCallback(async () => {
    if (!myPosRef.current) return

    try {
      const response = await fetch("/api/game/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode,
          playerId,
          lat: myPosRef.current.lat,
          lng: myPosRef.current.lng
        })
      })

      if (!response.ok) return
      const data = await response.json()

      // Update time remaining
      if (data.timeRemaining !== undefined) {
        setTimeRemaining(data.timeRemaining)
      }

      // Update phase
      if (data.phase) {
        if (data.phase !== prevPhaseRef.current) {
          const phaseMessages: Record<string, string> = {
            mid: "PHASE 2 — Interference increasing",
            late: "PHASE 3 — Demogorgon grows stronger",
            bloodmoon: "BLOOD MOON — All systems failing"
          }
          if (phaseMessages[data.phase]) {
            showAlert(phaseMessages[data.phase], data.phase === "bloodmoon" ? "scream" : "warning", 6000)
            if (data.phase === "bloodmoon") {
              playStaticBurst(0.8)
              showFlash({ type: "phase_bloodmoon" })
            }
          }
          prevPhaseRef.current = data.phase
        }
        setPhase(data.phase)
        
        // Update phase config based on phase
        const configs: Record<string, PhaseConfig> = {
          early: { demoSpeedMult: 1, radarMult: 1, interferenceBoost: 0 },
          mid: { demoSpeedMult: 1.15, radarMult: 0.85, interferenceBoost: 0.15 },
          late: { demoSpeedMult: 1.3, radarMult: 0.7, interferenceBoost: 0.35 },
          bloodmoon: { demoSpeedMult: 1.5, radarMult: 0.4, interferenceBoost: 0.7 }
        }
        setPhaseConfig(configs[data.phase] || configs.early)
      }

      // Update threat info
      if (data.threatLevel !== undefined) {
        const newThreat: ThreatData = {
          threatLevel: Math.round(data.threatLevel * 100),
          bearing: data.threatBearing || null,
          distanceMetres: data.threatLevel > 0 ? Math.round((1 - data.threatLevel) * 200) : Infinity,
          demogorgonNearby: data.threatLevel > 0.3
        }
        setThreat(newThreat)
        
        if (newThreat.threatLevel > 0) {
          vibrateHeartbeat(newThreat.threatLevel / 100)
          if (newThreat.demogorgonNearby && newThreat.bearing !== null) {
            playDirectionalAlert(newThreat.bearing, newThreat.distanceMetres, newThreat.threatLevel / 100)
          }
        }
      }

      // Update alive status
      if (data.isAlive !== undefined) {
        if (isAlive && !data.isAlive) {
          vibrateCaught()
          showAlert("YOU HAVE BEEN CAUGHT BY THE DEMOGORGON", "scream", 8000)
          showFlash({ type: "caught" })
        }
        setIsAlive(data.isAlive)
      }

      // Update visible players (convert to radar format)
      if (data.visiblePlayers && myPosRef.current) {
        const refLat = myPosRef.current.lat
        const refLng = myPosRef.current.lng
        
        const processedPlayers: Player[] = data.visiblePlayers.map((p: { id: string; name: string; role?: string; position?: { lat: number; lng: number }; isAlive: boolean }) => {
          const offset = gpsToMetreOffset(refLat, refLng, p.position?.lat ?? null, p.position?.lng ?? null)
          return {
            id: p.id,
            name: p.name,
            role: p.role || "unknown",
            status: p.isAlive ? "alive" : "dead",
            lat: p.position?.lat ?? null,
            lng: p.position?.lng ?? null,
            x: offset.x,
            y: offset.y,
            isVisible: true
          }
        })
        
        // Add self
        processedPlayers.unshift({
          id: playerId,
          name: playerName,
          role: role,
          status: data.isAlive ? "alive" : "dead",
          lat: refLat,
          lng: refLng,
          x: 0,
          y: 0,
          isVisible: true
        })
        
        setPlayers(processedPlayers)
      }

      // Check game end
      if (data.state === "ended" && data.winner) {
        const endData: GameEndData = {
          winner: data.winner,
          reason: data.winner === "security" ? "Time expired - Security wins!" : "All agents eliminated",
          replay: {
            stats: players.map(p => ({
              id: p.id,
              name: p.name,
              role: p.role,
              survived: p.status === "alive",
              survivalTime: gameSettings.duration - data.timeRemaining,
              eliminations: 0
            })),
            gameDuration: gameSettings.duration - data.timeRemaining
          }
        }
        showFlash({ type: endData.winner === "security" ? "game_win" : "game_lose" })
        setTimeout(() => setGameEnd(endData), 1200)
      }

      // Check voting state
      if (data.state === "voting") {
        // Set up vote session if not already
        if (!voteSession) {
          const eligiblePlayers = players.filter(p => p.status === "alive" && p.id !== playerId).map(p => ({ id: p.id, name: p.name }))
          setVoteSession({
            initiatorName: "Emergency Meeting",
            eligiblePlayers,
            timeRemaining: 60,
            voteCast: 0,
            totalPlayers: eligiblePlayers.length + 1
          })
          vibrateAlert()
          showFlash({ type: "vote_called", playerName: "Emergency" })
        }
      } else if (voteSession) {
        setVoteSession(null)
      }

    } catch (error) {
      console.error("Failed to fetch game state:", error)
    }
  }, [gameCode, playerId, playerName, role, gameSettings.duration, isAlive, voteSession, players,
      showAlert, vibrateHeartbeat, vibrateCaught, vibrateAlert, playDirectionalAlert, playStaticBurst, showFlash])

  // Poll every 2 seconds
  useEffect(() => {
    fetchGameState()
    pollIntervalRef.current = setInterval(fetchGameState, 500)
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchGameState])

  // ── Radar ping every sweep ────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (threat.threatLevel === 0) playPing(0.4)
      else playPing(0.2 + (threat.threatLevel / 100) * 0.8)
    }, 2400)
    return () => clearInterval(id)
  }, [playPing, threat.threatLevel])

  // ── Handlers ─────────────────────────────────────────────
  const handleAbilityUse = useCallback(async (ability: string) => {
    try {
      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode,
          playerId,
          action: "ability",
          abilityType: ability
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        vibrateAbility()
        showAlert(`Ability activated: ${ability.replace("_", " ").toUpperCase()}`, "info", 3000)
        
        if (ability === "triangulate" && data.data?.approximatePosition) {
          const refLat = myPosRef.current?.lat ?? 0
          const refLng = myPosRef.current?.lng ?? 0
          const offset = gpsToMetreOffset(refLat, refLng, data.data.approximatePosition.lat, data.data.approximatePosition.lng)
          setTriangulationPos(offset)
          setTriangulationActive(true)
          playStaticBurst(0.5)
          vibrateAlert()
          showFlash({ type: "triangulation" })
          showAlert("TRIANGULATION LOCK — Demogorgon position revealed!", "warning", 5000)
          setTimeout(() => { setTriangulationActive(false); setTriangulationPos(null) }, 5000)
        }
      } else {
        showAlert(data.error || "Ability failed", "warning", 3000)
      }
    } catch (error) {
      console.error("Ability use failed:", error)
    }
    setShowAbilities(false)
  }, [gameCode, playerId, vibrateAbility, vibrateAlert, showAlert, playStaticBurst, showFlash])

  const handleCatch = useCallback(async () => {
    // Find nearest player to catch
    const nearestPlayer = players.find(p => p.id !== playerId && p.status === "alive" && Math.abs(p.x) < 15 && Math.abs(p.y) < 15)
    
    if (!nearestPlayer) {
      showAlert("No agent in range", "warning", 2000)
      return
    }
    
    try {
      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode,
          playerId,
          action: "catch",
          targetId: nearestPlayer.id
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.data?.caught) {
        playEliminationScream()
        vibrateElimination()
        showAlert(`${nearestPlayer.name} HAS BEEN ELIMINATED`, "scream", 5000)
        showFlash({ type: "elimination", playerName: nearestPlayer.name })
      } else {
        showAlert(data.error || "Target too far", "warning", 2000)
      }
    } catch (error) {
      console.error("Catch failed:", error)
    }
  }, [gameCode, playerId, players, showAlert, playEliminationScream, vibrateElimination, showFlash])

  const handleVoteCall = useCallback(async () => {
    try {
      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode,
          playerId,
          action: "callVote"
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        showAlert(data.error || "Cannot call meeting", "warning", 3000)
      }
    } catch (error) {
      console.error("Vote call failed:", error)
    }
  }, [gameCode, playerId, showAlert])

  const handleVoteCast = useCallback(async (suspectId: string) => {
    setMyVote(suspectId)
    
    try {
      await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode,
          playerId,
          action: "vote",
          targetId: suspectId
        })
      })
    } catch (error) {
      console.error("Vote cast failed:", error)
    }
  }, [gameCode, playerId])

  const handleBroadcastSend = useCallback((message: string) => {
    setBroadcasts(prev => [...prev, {
      id: `broadcast_${Date.now()}`,
      message,
      triggeredBy: playerName,
      timestamp: Date.now()
    }])
  }, [playerName])

  const handleBroadcastTemplate = useCallback((templateIndex: number, targetPlayerName?: string) => {
    const templates = [
      "Stay alert - movement detected",
      "Regroup at safe zone",
      `Watch ${targetPlayerName || "suspicious player"}`,
      "Demogorgon spotted nearby"
    ]
    handleBroadcastSend(templates[templateIndex] || templates[0])
  }, [handleBroadcastSend])

  // ── Game end ─────────────────────────────────────────────
  if (gameEnd) {
    return (
      <PostGameScreen
        winner={gameEnd.winner}
        reason={gameEnd.reason}
        stats={gameEnd.replay.stats}
        gameDuration={gameEnd.replay.gameDuration}
        myId={playerId}
        onPlayAgain={() => { setGameEnd(null); onLeave() }}
        onExit={onLeave}
      />
    )
  }

  const isDemo = role === "demogorgon"
  const isBloodMoon = phase === "bloodmoon"
  const radarPlayers: RadarPlayer[] = players.map(p => ({
    id: p.id, name: p.name, role: p.role, status: p.status,
    x: p.x, y: p.y, isDecoy: p.isDecoy,
  }))

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        background: isBloodMoon
          ? "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(180,0,8,0.35) 0%, transparent 55%), var(--st-void)"
          : "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(150,0,6,0.18) 0%, transparent 55%), var(--st-void)",
      }}
    >
      {/* Grain overlay */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")` }}
      />

      {/* Flash card overlay — highest z-index events */}
      <FlashCard card={flashCard} onDismiss={dismissFlash} />

      {/* Vote screen overlay */}
      {voteSession && (
        <VoteScreen
          initiatorName={voteSession.initiatorName}
          eligiblePlayers={voteSession.eligiblePlayers}
          timeRemaining={voteSession.timeRemaining}
          voteCast={voteSession.voteCast}
          totalPlayers={voteSession.totalPlayers}
          onVote={handleVoteCast}
          myVote={myVote}
        />
      )}

      {/* Top nav */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-2 flex-shrink-0"
        style={{
          borderBottom: "1px solid rgba(192,0,10,0.2)",
          background: "rgba(4,2,12,0.75)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="font-[var(--font-display)] text-[18px] tracking-[0.1em]"
          style={{ color: "var(--st-crimson-glow)", textShadow: "0 0 8px rgba(255,26,46,0.35)", animation: "flicker 8s infinite" }}
        >
          ◈ DR-1983
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-[8px] h-[8px] rounded-full"
            style={{
              background: gpsError ? "var(--st-crimson)" : "var(--st-teal)",
              boxShadow: `0 0 6px ${gpsError ? "var(--st-crimson)" : "var(--st-teal)"}`,
              animation: "blink 2s infinite",
            }}
          />
          <span className="font-[var(--font-title)] text-[8px] tracking-[0.25em] uppercase" style={{ color: "rgba(232,221,208,0.3)" }}>
            {gpsError ? "NO GPS" : "GPS LOCKED"}
          </span>
        </div>
        <div
          className="font-(--font-title) text-[8px] tracking-[0.3em] uppercase px-2 py-1"
          style={{
            border: `1px solid ${isDemo ? "rgba(192,0,10,0.4)" : "rgba(0,180,170,0.3)"}`,
            color: isDemo ? "var(--st-crimson-glow)" : "var(--st-teal)",
          }}
        >
          {isDemo ? "DEMOGORGON" : role === "stealth" ? "STEALTH" : "SECURITY"}
        </div>
      </div>

      {/* Alert banner */}
      {alert && (
        <AlertBanner
          message={alert.message}
          type={alert.type}
          visible={true}
          onDismiss={() => setAlert(null)}
        />
      )}

      {/* Main body — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 p-3">

          {/* HUD (timer, phase, threat bar) */}
          <PlayerHUD
            role={role}
            threatLevel={threat.threatLevel}
            bearing={threat.bearing}
            distanceMetres={threat.distanceMetres}
            phase={phase}
            timeRemaining={timeRemaining}
            isVisible={isVisible}
            preyDirection={preyDirection}
          />

          {/* Radar */}
          <div
            className="relative"
            style={{
              borderRadius: "50%",
              boxShadow: isBloodMoon
                ? "0 0 30px rgba(200,0,10,0.5), 0 0 60px rgba(200,0,10,0.2)"
                : threat.threatLevel > 60
                  ? "0 0 20px rgba(200,0,10,0.3), 0 0 40px rgba(200,0,10,0.12)"
                  : "0 0 20px rgba(0,180,170,0.15), 0 0 40px rgba(0,180,170,0.06)",
            }}
          >
            <RadarCanvas
              players={radarPlayers}
              myId={playerId}
              myRole={role}
              radarRangeMult={phaseConfig.radarMult}
              interferenceBoost={phaseConfig.interferenceBoost}
              triangulationActive={triangulationActive}
              triangulationPos={triangulationPos}
              radarRangeMetres={gameSettings.radarRange}
            />
            {/* Catch button for Demogorgon — overlaid center */}
            {isDemo && (
              <button
                onMouseDown={handleCatch}
                onTouchStart={(e) => { e.preventDefault(); handleCatch() }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 font-[var(--font-display)] text-[14px] tracking-[0.18em] uppercase"
                style={{
                  background: "rgba(120,0,8,0.7)",
                  border: "1px solid var(--st-crimson-glow)",
                  color: "var(--st-crimson-glow)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 0 14px rgba(200,0,10,0.4)",
                  cursor: "pointer",
                }}
              >
                ☠ CATCH
              </button>
            )}
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 w-full">
            {/* Vote button — agents only, not demo */}
            {!isDemo && gameSettings.enableVoting && (
              <button
                onClick={handleVoteCall}
                className="flex-1 py-2.5 font-[var(--font-display)] text-[14px] tracking-[0.14em] uppercase transition-all duration-200"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,100,0,0.35)",
                  color: "var(--st-ember)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(120,50,0,0.2)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(255,100,0,0.2)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.5)"; e.currentTarget.style.boxShadow = "none" }}
              >
                🚨 Call Meeting
              </button>
            )}

            {/* Abilities — demo only */}
            {isDemo && gameSettings.enableAbilities && (
              <button
                onClick={() => setShowAbilities(v => !v)}
                className="flex-1 py-2.5 font-[var(--font-display)] text-[14px] tracking-[0.14em] uppercase transition-all duration-200"
                style={{
                  background: showAbilities ? "rgba(80,0,5,0.6)" : "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(192,0,10,0.4)",
                  color: "var(--st-crimson-glow)",
                  cursor: "pointer",
                }}
              >
                ⚡ Abilities
              </button>
            )}

            {/* Intel feed */}
            <button
              onClick={() => setShowBroadcast(v => !v)}
              className="flex-1 py-2.5 font-[var(--font-display)] text-[14px] tracking-[0.14em] uppercase transition-all duration-200"
              style={{
                background: showBroadcast ? "rgba(0,40,36,0.5)" : "rgba(0,0,0,0.5)",
                border: `1px solid rgba(0,180,170,${broadcasts.length > 0 ? "0.5" : "0.2"})`,
                color: "var(--st-teal-bright)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              📻 Intel
              {broadcasts.length > 0 && (
                <span
                  className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full"
                  style={{ background: "var(--st-ember)", boxShadow: "0 0 4px var(--st-ember)" }}
                />
              )}
            </button>

            {/* Leave */}
            <button
              onClick={onLeave}
              className="px-3 py-2.5 font-[var(--font-display)] text-[12px] tracking-[0.12em] uppercase transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid rgba(192,0,10,0.18)",
                color: "rgba(232,221,208,0.3)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--st-crimson)"; e.currentTarget.style.color = "var(--st-pale)" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(192,0,10,0.18)"; e.currentTarget.style.color = "rgba(232,221,208,0.3)" }}
            >
              ←
            </button>
          </div>

          {/* Abilities panel */}
          {showAbilities && isDemo && (
            <div className="w-full" style={{ animation: "fadeUp 0.2s ease" }}>
              <AbilitiesPanel
                abilities={myAbilities}
                onUse={handleAbilityUse}
              />
            </div>
          )}

          {/* Broadcast / intel panel */}
          {showBroadcast && (
            <div className="w-full" style={{ animation: "fadeUp 0.2s ease" }}>
              <BroadcastPanel
                isHost={isHost}
                broadcasts={broadcasts}
                players={players.filter(p => p.status === "alive").map(p => ({ id: p.id, name: p.name }))}
                onSend={handleBroadcastSend}
                onSendTemplate={handleBroadcastTemplate}
              />
            </div>
          )}

          {/* Player list */}
          <div
            className="w-full p-3"
            style={{
              background: "rgba(4,2,14,0.8)",
              border: "1px solid rgba(192,0,10,0.15)",
            }}
          >
            <div className="font-[var(--font-title)] text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: "var(--st-teal)", opacity: 0.6 }}>
              Agents — {players.filter(p => p.status === "alive").length} alive
            </div>
            {players.map(p => {
              const isMe = p.id === playerId
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: "1px solid rgba(192,0,10,0.07)" }}
                >
                  <div
                    className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                    style={{
                      background: p.status === "alive" ? "var(--st-teal)" : "var(--st-crimson)",
                      boxShadow: p.status === "alive" ? "0 0 4px var(--st-teal)" : "0 0 4px var(--st-crimson)",
                    }}
                  />
                  <span
                    className="font-[var(--font-body)] text-[12px] flex-1"
                    style={{ color: p.status === "alive" ? "var(--st-pale)" : "rgba(232,221,208,0.3)" }}
                  >
                    {p.name === "???" ? "Unknown Signal" : p.name}
                    {isMe && <span className="ml-1 text-[10px]" style={{ color: "var(--st-teal)" }}>(you)</span>}
                  </span>
                  <span
                    className="font-[var(--font-title)] text-[8px] tracking-[0.2em] uppercase"
                    style={{ color: p.status === "alive" ? "rgba(232,221,208,0.3)" : "var(--st-crimson)", opacity: 0.7 }}
                  >
                    {p.status === "dead" ? "ELIMINATED" : ""}
                  </span>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
