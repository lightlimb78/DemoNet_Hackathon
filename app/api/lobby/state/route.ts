import { NextResponse } from "next/server"
import { getLobbyState, setPlayerReady, leaveRoom, getRoom } from "@/lib/game-store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameCode = searchParams.get("gameCode")
  const playerId = searchParams.get("playerId")
  
  if (!gameCode) {
    return NextResponse.json({ error: "Missing gameCode" }, { status: 400 })
  }
  
  // First check if game has started
  const room = getRoom(gameCode)
  if (room && room.state === "playing" && playerId) {
    // Game has started - return the player's role so they can transition
    const player = room.players.get(playerId)
    return NextResponse.json({
      state: "playing",
      gameStarted: true,
      role: player?.role
    })
  }
  
  const state = getLobbyState(gameCode)
  
  if (!state) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }
  
  return NextResponse.json(state)
}

export async function POST(request: Request) {
  try {
    const { gameCode, playerId, action, ready } = await request.json()
    
    if (!gameCode || !playerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    if (action === "ready") {
      const success = setPlayerReady(gameCode, playerId, ready)
      if (!success) {
        return NextResponse.json({ error: "Failed to update ready state" }, { status: 400 })
      }
    } else if (action === "leave") {
      const result = leaveRoom(gameCode, playerId)
      return NextResponse.json({ success: result.success, newHostId: result.newHostId })
    }
    
    const state = getLobbyState(gameCode)
    return NextResponse.json(state)
  } catch (error) {
    console.error("Lobby state error:", error)
    return NextResponse.json({ error: "Failed to update lobby" }, { status: 500 })
  }
}
