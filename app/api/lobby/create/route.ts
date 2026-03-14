import { NextResponse } from "next/server"
import { createRoom } from "@/lib/game-store"

export async function POST(request: Request) {
  try {
    const { playerId, playerName } = await request.json()
    
    if (!playerId || !playerName) {
      return NextResponse.json({ error: "Missing playerId or playerName" }, { status: 400 })
    }
    
    const room = createRoom(playerId, playerName)
    
    return NextResponse.json({
      success: true,
      gameCode: room.code,
      isHost: true
    })
  } catch (error) {
    console.error("Create lobby error:", error)
    return NextResponse.json({ error: "Failed to create lobby" }, { status: 500 })
  }
}
