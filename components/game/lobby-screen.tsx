"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import ReactAudioPlayer from "react-audio-player"

interface Player {
  id: string
  name: string
  isReady: boolean
}

type Role = "security" | "stealth" | "demogorgon"

interface LobbyScreenProps {
  gameCode: string
  playerName: string
  playerId: string
  isHost: boolean
  onStartGame: () => void
  onGameStarted: (role: Role) => void
  onLeave: () => void
}

export function LobbyScreen({ gameCode, playerName, playerId, isHost: initialIsHost, onStartGame, onGameStarted, onLeave }: LobbyScreenProps) {
  const [players, setPlayers] = useState<Player[]>([
    { id: playerId, name: playerName, isReady: false }
  ])
  const [isReady, setIsReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isHost, setIsHost] = useState(initialIsHost)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Poll for lobby state
  const fetchLobbyState = useCallback(async () => {
    try {
      const response = await fetch(`/api/lobby/state?gameCode=${gameCode}&playerId=${playerId}`)
      if (!response.ok) return
      
      const data = await response.json()
      
      // Check if game has started (for non-host players)
      if (data.gameStarted && data.role) {
        // Game started! Transition to role reveal
        onGameStarted(data.role)
        return
      }
      
      if (data.players) {
        setPlayers(data.players)
        // Update own ready state if different
        const me = data.players.find((p: Player) => p.id === playerId)
        if (me) {
          setIsReady(me.isReady)
        }
      }
      
      if (data.hostId) {
        setIsHost(data.hostId === playerId)
      }
    } catch (error) {
      console.error("Failed to fetch lobby state:", error)
    }
  }, [gameCode, playerId, onGameStarted])

  useEffect(() => {
    // Initial fetch
    fetchLobbyState()
    
    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(fetchLobbyState, 2000)
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchLobbyState])

  const toggleReady = async () => {
    const newReady = !isReady
    setIsReady(newReady)
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isReady: newReady } : p))
    
    try {
      await fetch("/api/lobby/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode,
          playerId,
          action: "ready",
          ready: newReady
        })
      })
    } catch (error) {
      console.error("Failed to update ready state:", error)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const allReady = players.every(p => p.isReady) && players.length >= 2
  const canStart = isHost && allReady

  return (
    <div 
      className="fixed inset-0 flex flex-col overflow-y-auto"
      style={{
        background: `
          radial-gradient(ellipse 80% 40% at 50% 0%, rgba(140,0,8,0.35) 0%, transparent 55%),
          radial-gradient(ellipse 50% 30% at 8% 90%, rgba(0,130,120,0.09) 0%, transparent 55%),
          var(--st-void)
        `
      }}
    >
      <ReactAudioPlayer
      src="/song2.mpeg"
        autoPlay
        loop
        volume={1}
      />
      {/* Grain Overlay */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none opacity-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")`
        }}
      />

      {/* Nav Bar */}
      <div 
        className="flex items-center justify-between flex-wrap gap-3 px-7 py-4"
        style={{
          borderBottom: "1px solid rgba(192,0,10,0.2)",
          background: "rgba(4,2,12,0.6)",
          backdropFilter: "blur(6px)"
        }}
      >
        <div 
          className="font-[var(--font-display)] text-[22px] tracking-[0.1em]"
          style={{ 
            color: "var(--st-crimson-glow)",
            textShadow: "0 0 10px rgba(255,26,46,0.4)"
          }}
        >
          ◈ MISSION BRIEFING
        </div>
        
        <div 
          className="flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-all duration-200"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(192,0,10,0.3)"
          }}
          onClick={copyCode}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--st-teal)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(192,0,10,0.3)"}
        >
          <div>
            <div 
              className="font-[var(--font-title)] text-[9px] tracking-[0.35em] uppercase"
              style={{ color: "rgba(232,221,208,0.35)" }}
            >
              Access Code
            </div>
            <div 
              className="font-[var(--font-display)] text-[28px] tracking-[0.4em]"
              style={{ 
                color: "var(--st-teal-bright)",
                textShadow: "0 0 12px var(--st-teal)"
              }}
            >
              {gameCode}
            </div>
          </div>
          <div className="text-[13px]" style={{ color: "rgba(232,221,208,0.25)" }}>
            {copied ? "✓" : "⎘"}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-wrap gap-4 p-6 items-start">
        {/* Players Panel */}
        <div 
          className="flex-1 min-w-[230px] p-4"
          style={{
            background: "rgba(4,2,14,0.82)",
            border: "1px solid rgba(192,0,10,0.18)",
            borderTop: "2px solid rgba(192,0,10,0.45)"
          }}
        >
          <div 
            className="flex items-center justify-between pb-3 mb-3.5"
            style={{ borderBottom: "1px solid rgba(192,0,10,0.15)" }}
          >
            <span 
              className="font-[var(--font-title)] text-[9px] tracking-[0.45em] uppercase"
              style={{ color: "var(--st-teal)", opacity: 0.7 }}
            >
              Connected Agents
            </span>
            <span 
              className="font-[var(--font-title)] text-[9px] tracking-[0.45em] uppercase"
              style={{ color: "var(--st-teal)", opacity: 0.7 }}
            >
              {players.length} agents
            </span>
          </div>
          
          {players.map((player) => (
            <div 
              key={player.id}
              className="flex items-center gap-2.5 p-2.5 mb-1.5"
              style={{
                border: player.id === playerId ? "1px solid rgba(0,200,190,0.25)" : "1px solid rgba(192,0,10,0.1)",
                background: player.id === playerId ? "rgba(0,60,55,0.12)" : "rgba(0,0,0,0.28)",
                animation: "slideIn 0.3s ease"
              }}
            >
              <div 
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-[var(--font-display)] text-[16px] flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--st-crimson-deep), rgba(0,70,65,0.4))",
                  border: "1px solid rgba(192,0,10,0.35)",
                  color: "var(--st-pale)"
                }}
              >
                {player.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-[var(--font-body)] text-[12px]" style={{ color: "var(--st-pale)" }}>
                  {player.name}
                  {player.id === playerId && (
                    <span className="ml-1 text-[10px]" style={{ color: "var(--st-teal)" }}>(you)</span>
                  )}
                </div>
                <div 
                  className="font-[var(--font-title)] text-[9px] tracking-[0.2em] uppercase mt-0.5"
                  style={{ color: player.isReady ? "var(--st-teal)" : "var(--st-ember)", opacity: player.isReady ? 1 : 0.7 }}
                >
                  {player.isReady ? "● Ready" : "○ Waiting"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Control Panel */}
        <div 
          className="w-[210px] p-4"
          style={{
            background: "rgba(4,2,14,0.82)",
            border: "1px solid rgba(192,0,10,0.18)",
            borderTop: "2px solid rgba(192,0,10,0.45)"
          }}
        >
          <div 
            className="font-[var(--font-title)] text-[9px] tracking-[0.45em] uppercase mb-3.5"
            style={{ color: "var(--st-teal)", opacity: 0.7 }}
          >
            Mission Control
          </div>

          {/* Ready Button */}
          <button
            onClick={toggleReady}
            className="w-full py-2.5 font-[var(--font-display)] text-[18px] tracking-[0.18em] uppercase cursor-pointer transition-all duration-200 mb-2"
            style={{
              background: isReady ? "rgba(255,106,0,0.1)" : "transparent",
              border: "1px solid rgba(255,106,0,0.4)",
              color: "var(--st-ember)",
              boxShadow: isReady ? "0 0 14px rgba(255,106,0,0.18)" : "none",
              borderRadius: "1px"
            }}
          >
            {isReady ? "✓ Ready" : "Mark Ready"}
          </button>

          {/* Start Button */}
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-2.5 font-[var(--font-display)] text-[18px] tracking-[0.18em] uppercase cursor-pointer transition-all duration-200 mb-2 text-white"
            style={{
              background: "linear-gradient(135deg, var(--st-crimson), #880008)",
              boxShadow: canStart ? "0 0 18px rgba(200,0,10,0.35)" : "none",
              opacity: canStart ? 1 : 0.28,
              borderRadius: "1px",
              border: "none"
            }}
          >
            ▶ Start
          </button>

          <div 
            className="h-px my-3"
            style={{ background: "linear-gradient(90deg, transparent, rgba(192,0,10,0.35), transparent)" }}
          />

          <p 
            className="font-[var(--font-body)] text-[10px] text-center leading-[1.7] my-1"
            style={{ color: "rgba(232,221,208,0.22)" }}
          >
            Share the code with your team. All agents must be ready before the mission can begin.
          </p>

          <div 
            className="h-px my-3"
            style={{ background: "linear-gradient(90deg, transparent, rgba(192,0,10,0.35), transparent)" }}
          />

          {/* Leave Button */}
          <button
            onClick={onLeave}
            className="w-full py-2.5 font-[var(--font-display)] text-[14px] tracking-[0.18em] uppercase cursor-pointer transition-all duration-200"
            style={{
              background: "transparent",
              border: "1px solid rgba(192,0,10,0.18)",
              color: "rgba(232,221,208,0.28)",
              borderRadius: "1px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--st-crimson)"
              e.currentTarget.style.color = "var(--st-pale)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(192,0,10,0.18)"
              e.currentTarget.style.color = "rgba(232,221,208,0.28)"
            }}
          >
            ← Leave
          </button>
        </div>
      </div>
    </div>
  )
}
