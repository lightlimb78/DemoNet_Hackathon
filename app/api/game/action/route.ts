import { NextResponse } from "next/server"
import { attemptCatch, useAbility, startVoting, castVote, getGameState, type AbilityType } from "@/lib/game-store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameCode, playerId, action } = body
    
    if (!gameCode || !playerId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    let result: { success: boolean; error?: string; data?: object }
    
    switch (action) {
      case "catch": {
        const { targetId } = body
        if (!targetId) {
          return NextResponse.json({ error: "Missing targetId" }, { status: 400 })
        }
        const catchResult = attemptCatch(gameCode, playerId, targetId)
        result = { success: catchResult.success, error: catchResult.error, data: { caught: catchResult.caught } }
        break
      }
      
      case "ability": {
        const { abilityType } = body as { abilityType: AbilityType; gameCode: string; playerId: string; action: string }
        if (!abilityType) {
          return NextResponse.json({ error: "Missing abilityType" }, { status: 400 })
        }
        result = useAbility(gameCode, playerId, abilityType)
        break
      }
      
      case "callVote": {
        const voteResult = startVoting(gameCode, playerId)
        result = { success: voteResult.success, error: voteResult.error }
        break
      }
      
      case "vote": {
        const { targetId } = body
        if (!targetId) {
          return NextResponse.json({ error: "Missing targetId" }, { status: 400 })
        }
        const voteResult = castVote(gameCode, playerId, targetId)
        result = { success: voteResult.success, error: voteResult.error }
        break
      }
      
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    // Return updated game state
    const state = getGameState(gameCode, playerId)
    return NextResponse.json({ ...result, gameState: state })
  } catch (error) {
    console.error("Game action error:", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
