import { NextResponse } from "next/server"
import { getGameState, updatePlayerPosition, getRoom } from "@/lib/game-store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameCode = searchParams.get("gameCode")
  const playerId = searchParams.get("playerId")
  
  if (!gameCode || !playerId) {
    return NextResponse.json({ error: "Missing gameCode or playerId" }, { status: 400 })
  }
  
  const state = getGameState(gameCode, playerId)
  
  if (!state) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }
  
  return NextResponse.json(state)
}

export async function POST(request: Request) {
  try {
    const { gameCode, playerId, lat, lng } = await request.json()
    
    if (!gameCode || !playerId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const success = updatePlayerPosition(gameCode, playerId, lat, lng)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update position" }, { status: 400 })
    }
    
    const state = getGameState(gameCode, playerId)
    return NextResponse.json(state)
  } catch (error) {
    console.error("Game state error:", error)
    return NextResponse.json({ error: "Failed to update game state" }, { status: 500 })
  }
}
