"use client"

import { useState, useCallback } from "react"
import { CounterEntry } from "./counter-entry"
import { JoinScreen } from "./join-screen"
import { LobbyScreen } from "./lobby-screen"
import { RoleRevealScreen } from "./role-reveal-screen"
import { GameScreen } from "./game-screen"

type Screen = "entry" | "join" | "lobby" | "role" | "game"
type Role = "security" | "stealth" | "demogorgon"

interface GameState {
  screen: Screen
  playerName: string
  playerId: string
  gameCode: string
  isHost: boolean
  role: Role
  gameSettings: {
    duration: number
    radarRange: number
    enableAbilities: boolean
    enableVoting: boolean
  }
}

const DEFAULT_SETTINGS = {
  duration: 900, // 15 minutes
  radarRange: 100,
  enableAbilities: true,
  enableVoting: true,
}

function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function StrangerThingsGame() {
  const [state, setState] = useState<GameState>({
    screen: "entry",
    playerName: "",
    playerId: "",
    gameCode: "",
    isHost: false,
    role: "security",
    gameSettings: DEFAULT_SETTINGS,
  })

  const handleAgentMenu = useCallback(() => {
    setState(prev => ({ ...prev, screen: "join" }))
  }, [])

  const handleCreateMission = useCallback(async (name: string) => {
    const playerId = generatePlayerId()
    
    try {
      const response = await fetch("/api/lobby/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, playerName: name }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          screen: "lobby",
          playerName: name,
          playerId,
          gameCode: data.gameCode,
          isHost: true,
        }))
      }
    } catch (error) {
      console.error("Failed to create mission:", error)
    }
  }, [])

  const handleJoinMission = useCallback(async (name: string, code: string) => {
    const playerId = generatePlayerId()
    
    try {
      const response = await fetch("/api/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameCode: code, playerId, playerName: name }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          screen: "lobby",
          playerName: name,
          playerId,
          gameCode: data.gameCode,
          isHost: data.isHost,
        }))
      }
    } catch (error) {
      console.error("Failed to join mission:", error)
    }
  }, [])

  const handleStartGame = useCallback(async () => {
    try {
      const response = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          gameCode: state.gameCode, 
          playerId: state.playerId 
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          screen: "role",
          role: data.role,
        }))
      }
    } catch (error) {
      console.error("Failed to start game:", error)
    }
  }, [state.gameCode, state.playerId])

  const handleRoleContinue = useCallback(() => {
    setState(prev => ({ ...prev, screen: "game" }))
  }, [])

  // Called when a non-host player detects the game has started
  const handleGameStarted = useCallback((role: Role) => {
    setState(prev => ({
      ...prev,
      screen: "role",
      role,
    }))
  }, [])

  const handleLeave = useCallback(async () => {
    try {
      await fetch("/api/lobby/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          gameCode: state.gameCode, 
          playerId: state.playerId,
          action: "leave"
        }),
      })
    } catch (error) {
      console.error("Failed to leave:", error)
    }
    
    setState({
      screen: "join",
      playerName: "",
      playerId: "",
      gameCode: "",
      isHost: false,
      role: "security",
      gameSettings: DEFAULT_SETTINGS,
    })
  }, [state.gameCode, state.playerId])

  return (
    <>
      {state.screen === "entry" && (
        <CounterEntry
          onAgentMenu={handleAgentMenu}
        />
      )}

      {state.screen === "join" && (
        <JoinScreen
          onCreateMission={handleCreateMission}
          onJoinMission={handleJoinMission}
        />
      )}

      {state.screen === "lobby" && (
        <LobbyScreen
          gameCode={state.gameCode}
          playerName={state.playerName}
          playerId={state.playerId}
          isHost={state.isHost}
          onStartGame={handleStartGame}
          onGameStarted={handleGameStarted}
          onLeave={handleLeave}
        />
      )}

      {state.screen === "role" && (
        <RoleRevealScreen
          role={state.role}
          onContinue={handleRoleContinue}
        />
      )}

      {state.screen === "game" && (
        <GameScreen
          playerName={state.playerName}
          playerId={state.playerId}
          role={state.role}
          gameCode={state.gameCode}
          isHost={state.isHost}
          gameSettings={state.gameSettings}
          onLeave={handleLeave}
        />
      )}
    </>
  )
}
