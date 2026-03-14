import { NextResponse } from "next/server"
import { startGame, getRoom } from "@/lib/game-store"

export async function POST(request: Request) {
  try {
    const { gameCode, playerId } = await request.json()
    
    if (!gameCode || !playerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const room = getRoom(gameCode)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }
    
    if (room.hostId !== playerId) {
      return NextResponse.json({ error: "Only host can start the game" }, { status: 403 })
    }
    
    const result = startGame(gameCode)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    // Get player's role
    const player = room.players.get(playerId)
    
    return NextResponse.json({
      success: true,
      role: player?.role
    })
  } catch (error) {
    console.error("Start game error:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}
