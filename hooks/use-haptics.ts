"use client"

import { useCallback } from "react"

// Escalating heartbeat patterns — dual-thump like a real heartbeat
const PATTERNS = {
  calm:     [60, 80, 60, 600],       // slow, relaxed
  elevated: [70, 60, 70, 400],       // noticeable
  danger:   [80, 50, 80, 250],       // urgent
  critical: [100, 40, 100, 150],     // panic
}

function vibrate(pattern: number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern)
  }
}

export function useHaptics() {
  const vibrateHeartbeat = useCallback((threatLevel: number) => {
    if (threatLevel < 20) vibrate(PATTERNS.calm)
    else if (threatLevel < 50) vibrate(PATTERNS.elevated)
    else if (threatLevel < 80) vibrate(PATTERNS.danger)
    else vibrate(PATTERNS.critical)
  }, [])

  const vibrateCaught = useCallback(() => {
    vibrate([200, 100, 200, 100, 400, 100, 800])
  }, [])

  const vibrateAlert = useCallback(() => {
    vibrate([100, 80, 100, 80, 100])
  }, [])

  const vibrateElimination = useCallback(() => {
    vibrate([50, 50, 50, 50, 400])
  }, [])

  const vibrateAbility = useCallback(() => {
    vibrate([30, 40, 200])
  }, [])

  return { vibrateHeartbeat, vibrateCaught, vibrateAlert, vibrateElimination, vibrateAbility }
}
