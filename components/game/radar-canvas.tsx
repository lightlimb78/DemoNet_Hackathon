"use client"

import { useRef, useEffect, useCallback } from "react"

export interface RadarPlayer {
  id: string
  name: string
  role: string
  status: string
  x: number   // metres from self
  y: number
  isDecoy?: boolean
}

interface RadarCanvasProps {
  players: RadarPlayer[]
  myId: string
  myRole: string
  radarRangeMult: number        // 0–1 from phase
  interferenceBoost: number     // 0–1 from phase
  triangulationActive: boolean
  triangulationPos: { x: number; y: number } | null
  radarRangeMetres: number
}

const CANVAS_SIZE = 320
const CENTER = CANVAS_SIZE / 2
const RADIUS = CENTER - 8

// Convert metres offset to canvas pixels
function metresToPx(metres: number, radarRangeMetres: number, effectiveMult: number) {
  return (metres / (radarRangeMetres * effectiveMult)) * RADIUS
}

export function RadarCanvas({
  players,
  myId,
  myRole,
  radarRangeMult,
  interferenceBoost,
  triangulationActive,
  triangulationPos,
  radarRangeMetres,
}: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sweepAngleRef = useRef(0)
  const frameRef = useRef<number>(0)
  const trailsRef = useRef<{ x: number; y: number; alpha: number }[]>([])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const interference = interferenceBoost
    const isBloodMoon = interferenceBoost > 0.8

    // ── Background ────────────────────────────────────────────
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Radar dish background
    const bg = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, RADIUS)
    bg.addColorStop(0, "rgba(0,30,28,0.95)")
    bg.addColorStop(1, "rgba(0,8,6,0.98)")
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // ── Interference overlay ─────────────────────────────────
    if (interference > 0.05) {
      // Scanline flicker
      for (let y = 0; y < CANVAS_SIZE; y += 4) {
        if (Math.random() < interference * 0.3) {
          ctx.fillStyle = `rgba(${isBloodMoon ? "200,0,10" : "0,200,190"},${0.04 * interference})`
          ctx.fillRect(CENTER - RADIUS, y, RADIUS * 2, 2)
        }
      }
      // Random pixel shift
      if (Math.random() < interference * 0.4) {
        const shiftX = (Math.random() - 0.5) * 6 * interference
        ctx.save()
        ctx.translate(shiftX, 0)
        // will draw rest shifted
      }
    }

    // ── Grid rings ───────────────────────────────────────────
    const ringCount = 4
    for (let i = 1; i <= ringCount; i++) {
      const r = (RADIUS / ringCount) * i * radarRangeMult
      ctx.beginPath()
      ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2)
      ctx.strokeStyle = isBloodMoon
        ? `rgba(192,0,10,${0.12 + i * 0.04})`
        : `rgba(0,180,170,${0.1 + i * 0.04})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    // Cross hairs
    ctx.strokeStyle = isBloodMoon ? "rgba(192,0,10,0.12)" : "rgba(0,180,170,0.1)"
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(CENTER, CENTER - RADIUS); ctx.lineTo(CENTER, CENTER + RADIUS)
    ctx.moveTo(CENTER - RADIUS, CENTER); ctx.lineTo(CENTER + RADIUS, CENTER)
    ctx.stroke()

    // ── Sweep line ───────────────────────────────────────────
    sweepAngleRef.current = (sweepAngleRef.current + 0.025) % (Math.PI * 2)
    const sweepAngle = sweepAngleRef.current

    // Afterglow arc (trailing glow)
    const arcSpan = Math.PI / 3
    const grad = ctx.createConicalGradient
      ? null  // not widely supported; use manual approach
      : null

    // Manual afterglow: draw a fading wedge
    const steps = 24
    for (let i = 0; i < steps; i++) {
      const startA = sweepAngle - arcSpan * (i / steps)
      const endA   = sweepAngle - arcSpan * ((i + 1) / steps)
      const alpha  = (1 - i / steps) * (isBloodMoon ? 0.18 : 0.12)
      ctx.beginPath()
      ctx.moveTo(CENTER, CENTER)
      ctx.arc(CENTER, CENTER, RADIUS * radarRangeMult, startA, endA, true)
      ctx.closePath()
      ctx.fillStyle = isBloodMoon
        ? `rgba(255,0,10,${alpha})`
        : `rgba(0,255,240,${alpha})`
      ctx.fill()
    }

    // Sweep line itself
    ctx.save()
    ctx.translate(CENTER, CENTER)
    ctx.rotate(sweepAngle)
    const lineGrad = ctx.createLinearGradient(0, 0, RADIUS * radarRangeMult, 0)
    lineGrad.addColorStop(0, isBloodMoon ? "rgba(255,20,30,0.8)" : "rgba(0,255,240,0.8)")
    lineGrad.addColorStop(1, "transparent")
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(RADIUS * radarRangeMult, 0)
    ctx.stroke()
    ctx.restore()

    // ── Clip everything to radar circle ─────────────────────
    ctx.save()
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2)
    ctx.clip()

    // ── Triangulation flash ──────────────────────────────────
    if (triangulationActive && triangulationPos) {
      const tx = CENTER + triangulationPos.x
      const ty = CENTER - triangulationPos.y
      // Dashed targeting lines
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = "rgba(255,200,0,0.6)"
      ctx.lineWidth = 1
      const corners = [
        [CENTER - RADIUS * 0.6, CENTER - RADIUS * 0.6],
        [CENTER + RADIUS * 0.6, CENTER - RADIUS * 0.6],
        [CENTER, CENTER + RADIUS * 0.6],
      ]
      corners.forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke()
      })
      ctx.setLineDash([])
      // Flash dot at demo location
      ctx.beginPath()
      ctx.arc(tx, ty, 10, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,200,0,0.25)"
      ctx.fill()
      ctx.beginPath()
      ctx.arc(tx, ty, 5, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,220,0,0.9)"
      ctx.fill()
    }

    // ── Player dots ──────────────────────────────────────────
    players.forEach((p) => {
      if (p.status === "dead") return
      const isSelf = p.id === myId
      const isDemo = p.role === "demogorgon"
      const isStealth = p.role === "stealth_agent"
      const isDecoy = p.isDecoy

      // Convert metres to pixels
      const px = CENTER + metresToPx(p.x, radarRangeMetres, radarRangeMult)
      const py = CENTER - metresToPx(p.y, radarRangeMetres, radarRangeMult)

      // Skip if out of range
      if (Math.hypot(px - CENTER, py - CENTER) > RADIUS) return

      let dotColor: string
      let glowColor: string
      let dotSize: number

      if (isSelf) {
        dotColor = "#ffffff"; glowColor = "rgba(255,255,255,0.6)"; dotSize = 5
      } else if (isDemo || isDecoy) {
        dotColor = "#ff1a2e"; glowColor = "rgba(255,26,46,0.7)"; dotSize = 7
      } else if (isStealth) {
        dotColor = "#ffd060"; glowColor = "rgba(255,200,50,0.6)"; dotSize = 5
      } else {
        dotColor = "#00ffe8"; glowColor = "rgba(0,255,232,0.5)"; dotSize = 5
      }

      // Glow halo
      const halo = ctx.createRadialGradient(px, py, 0, px, py, dotSize * 3.5)
      halo.addColorStop(0, glowColor)
      halo.addColorStop(1, "transparent")
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(px, py, dotSize * 3.5, 0, Math.PI * 2)
      ctx.fill()

      // Dot
      ctx.beginPath()
      ctx.arc(px, py, dotSize, 0, Math.PI * 2)
      ctx.fillStyle = dotColor
      ctx.fill()

      // Self indicator ring
      if (isSelf) {
        ctx.beginPath()
        ctx.arc(px, py, dotSize + 3, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(255,255,255,0.4)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Name label (not for demo unless you're demo)
      if (!isDemo || myRole === "demogorgon") {
        ctx.fillStyle = "rgba(232,221,208,0.7)"
        ctx.font = "9px monospace"
        ctx.fillText(p.name.substring(0, 8), px + dotSize + 3, py + 3)
      }
    })

    ctx.restore()

    // ── Outer ring ───────────────────────────────────────────
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2)
    ctx.strokeStyle = isBloodMoon ? "rgba(192,0,10,0.5)" : "rgba(0,180,170,0.35)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // ── CRT vignette ─────────────────────────────────────────
    const vig = ctx.createRadialGradient(CENTER, CENTER, RADIUS * 0.6, CENTER, CENTER, RADIUS)
    vig.addColorStop(0, "transparent")
    vig.addColorStop(1, "rgba(0,0,0,0.55)")
    ctx.fillStyle = vig
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2)
    ctx.fill()

    frameRef.current = requestAnimationFrame(draw)
  }, [players, myId, myRole, radarRangeMult, interferenceBoost, triangulationActive, triangulationPos, radarRangeMetres])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{ borderRadius: "50%", display: "block" }}
    />
  )
}
