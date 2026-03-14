import { NextResponse } from "next/server"
import { joinRoom, getRoom } from "@/lib/game-store"

export async function POST(request: Request) {
  try {
    const { gameCode, playerId, playerName } = await request.json()
    
    if (!gameCode || !playerId || !playerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const result = joinRoom(gameCode, playerId, playerName)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    const room = getRoom(gameCode)
    
    return NextResponse.json({
      success: true,
      gameCode: room?.code,
      isHost: room?.hostId === playerId
    })
  } catch (error) {
    console.error("Join lobby error:", error)
    return NextResponse.json({ error: "Failed to join lobby" }, { status: 500 })
  }
}
