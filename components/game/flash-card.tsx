"use client"

import { useEffect, useState, useRef } from "react"

// ── Card type definitions ────────────────────────────────────
export type FlashCardType =
  | "phase_mid"
  | "phase_late"
  | "phase_bloodmoon"
  | "elimination"
  | "caught"
  | "triangulation"
  | "vote_called"
  | "vote_correct"
  | "vote_wrong"
  | "ability_phase_shift"
  | "ability_fake_signal"
  | "ability_sense"
  | "game_win"
  | "game_lose"

export interface FlashCardData {
  type: FlashCardType
  playerName?: string   // for elimination / vote cards
}

// ── Card visual config ────────────────────────────────────────
const CARD_CONFIG: Record<
  FlashCardType,
  {
    icon: string
    headline: string
    sub: (data: FlashCardData) => string
    duration: number          // ms before auto-dismiss
    bg: string
    borderColor: string
    glowColor: string
    textColor: string
    scanColor: string
    shake: boolean
    flicker: boolean
  }
> = {
  phase_mid: {
    icon: "⚡",
    headline: "MID PHASE",
    sub: () => "Demogorgon is accelerating — 30% faster",
    duration: 3200,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,106,0,0.22) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-ember)",
    glowColor: "rgba(255,106,0,0.45)",
    textColor: "var(--st-ember)",
    scanColor: "rgba(255,106,0,0.06)",
    shake: false,
    flicker: false,
  },
  phase_late: {
    icon: "☢",
    headline: "LATE PHASE",
    sub: () => "Radar range halved — Demogorgon +60% speed",
    duration: 3800,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(192,0,10,0.28) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-crimson-glow)",
    glowColor: "rgba(255,26,46,0.5)",
    textColor: "var(--st-crimson-glow)",
    scanColor: "rgba(200,0,10,0.07)",
    shake: true,
    flicker: false,
  },
  phase_bloodmoon: {
    icon: "🩸",
    headline: "BLOOD MOON",
    sub: () => "Radar offline. You are hunted. Survive.",
    duration: 4800,
    bg: "radial-gradient(ellipse 100% 70% at 50% 40%, rgba(200,0,10,0.45) 0%, rgba(80,0,5,0.3) 40%, var(--st-void) 75%)",
    borderColor: "#ff0020",
    glowColor: "rgba(255,0,20,0.7)",
    textColor: "#ff0020",
    scanColor: "rgba(220,0,10,0.09)",
    shake: true,
    flicker: true,
  },
  elimination: {
    icon: "☠",
    headline: "AGENT ELIMINATED",
    sub: (d) => `${d.playerName ?? "Unknown"} has been consumed`,
    duration: 3500,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(192,0,10,0.3) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-crimson)",
    glowColor: "rgba(200,0,10,0.5)",
    textColor: "var(--st-crimson-glow)",
    scanColor: "rgba(192,0,10,0.06)",
    shake: true,
    flicker: true,
  },
  caught: {
    icon: "💀",
    headline: "YOU ARE DEAD",
    sub: () => "The Demogorgon has consumed you",
    duration: 5000,
    bg: "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(180,0,8,0.55) 0%, rgba(60,0,4,0.4) 40%, var(--st-void) 75%)",
    borderColor: "#ff0020",
    glowColor: "rgba(255,0,20,0.8)",
    textColor: "#ffffff",
    scanColor: "rgba(220,0,10,0.1)",
    shake: true,
    flicker: true,
  },
  triangulation: {
    icon: "📡",
    headline: "LOCK ACQUIRED",
    sub: () => "Demogorgon position triangulated — 3s window",
    duration: 3000,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,150,140,0.25) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-teal-bright)",
    glowColor: "rgba(0,255,232,0.45)",
    textColor: "var(--st-teal-bright)",
    scanColor: "rgba(0,180,170,0.06)",
    shake: false,
    flicker: false,
  },
  vote_called: {
    icon: "🚨",
    headline: "EMERGENCY MEETING",
    sub: (d) => `${d.playerName ?? "An agent"} has called a vote`,
    duration: 3000,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,106,0,0.2) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-ember)",
    glowColor: "rgba(255,106,0,0.4)",
    textColor: "var(--st-ember)",
    scanColor: "rgba(255,106,0,0.05)",
    shake: false,
    flicker: false,
  },
  vote_correct: {
    icon: "✓",
    headline: "CORRECT",
    sub: (d) => `${d.playerName ?? "The target"} was the Demogorgon`,
    duration: 3500,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,120,110,0.25) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-teal)",
    glowColor: "rgba(0,200,190,0.4)",
    textColor: "var(--st-teal-bright)",
    scanColor: "rgba(0,180,170,0.05)",
    shake: false,
    flicker: false,
  },
  vote_wrong: {
    icon: "✗",
    headline: "WRONG TARGET",
    sub: (d) => `${d.playerName ?? "The target"} was innocent — Demogorgon grows stronger`,
    duration: 4000,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(192,0,10,0.25) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-crimson-glow)",
    glowColor: "rgba(255,26,46,0.45)",
    textColor: "var(--st-crimson-glow)",
    scanColor: "rgba(200,0,10,0.06)",
    shake: true,
    flicker: false,
  },
  ability_phase_shift: {
    icon: "👻",
    headline: "PHASE SHIFT",
    sub: () => "You are invisible on radar for 15 seconds",
    duration: 2800,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,100,90,0.22) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-teal)",
    glowColor: "rgba(0,200,190,0.4)",
    textColor: "var(--st-teal-bright)",
    scanColor: "rgba(0,180,170,0.05)",
    shake: false,
    flicker: true,
  },
  ability_fake_signal: {
    icon: "📡",
    headline: "FAKE SIGNAL",
    sub: () => "Decoy planted — agents chasing a ghost",
    duration: 2800,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,200,50,0.15) 0%, var(--st-void) 70%)",
    borderColor: "#ffd060",
    glowColor: "rgba(255,200,50,0.4)",
    textColor: "#ffd060",
    scanColor: "rgba(255,200,50,0.05)",
    shake: false,
    flicker: false,
  },
  ability_sense: {
    icon: "🧠",
    headline: "SENSE ACTIVATED",
    sub: () => "Nearest prey bearing revealed for 10 seconds",
    duration: 2800,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(192,0,10,0.2) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-crimson-glow)",
    glowColor: "rgba(255,26,46,0.4)",
    textColor: "var(--st-crimson-glow)",
    scanColor: "rgba(200,0,10,0.05)",
    shake: false,
    flicker: false,
  },
  game_win: {
    icon: "🛡",
    headline: "HAWKINS SECURE",
    sub: () => "Security forces have prevailed",
    duration: 5000,
    bg: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,140,130,0.3) 0%, var(--st-void) 70%)",
    borderColor: "var(--st-teal-bright)",
    glowColor: "rgba(0,255,232,0.5)",
    textColor: "var(--st-teal-bright)",
    scanColor: "rgba(0,200,190,0.06)",
    shake: false,
    flicker: false,
  },
  game_lose: {
    icon: "☠",
    headline: "THE UPSIDE DOWN WINS",
    sub: () => "All agents have been consumed",
    duration: 5000,
    bg: "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(200,0,10,0.45) 0%, rgba(60,0,4,0.3) 50%, var(--st-void) 75%)",
    borderColor: "#ff0020",
    glowColor: "rgba(255,0,20,0.7)",
    textColor: "#ff0020",
    scanColor: "rgba(220,0,10,0.09)",
    shake: true,
    flicker: true,
  },
}

// ── Glitch helper ─────────────────────────────────────────────
const GLITCH = "!@#$%^&*<>?/|[]{}~\\"
function scramble(text: string, progress: number) {
  return text
    .split("")
    .map((c, i) =>
      i / text.length > progress && Math.random() < 0.5
        ? GLITCH[Math.floor(Math.random() * GLITCH.length)]
        : c
    )
    .join("")
}

// ── Component ─────────────────────────────────────────────────
interface FlashCardProps {
  card: FlashCardData | null
  onDismiss: () => void
}

export function FlashCard({ card, onDismiss }: FlashCardProps) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [headlineText, setHeadlineText] = useState("")
  const [subText, setSubText] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mount / unmount card
  useEffect(() => {
    if (!card) return
    const cfg = CARD_CONFIG[card.type]
    if (!cfg) return

    // Reset
    setLeaving(false)
    setVisible(false)
    setHeadlineText("")
    setSubText("")

    const headline = cfg.headline
    const sub = cfg.sub(card)

    // Small delay so CSS transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })

    // Glitch-in text reveal over 600ms
    let elapsed = 0
    const step = 40
    frameRef.current = setInterval(() => {
      elapsed += step
      const progress = Math.min(elapsed / 600, 1)
      setHeadlineText(scramble(headline, progress))
      setSubText(scramble(sub, progress))
      if (progress >= 1) {
        setHeadlineText(headline)
        setSubText(sub)
        if (frameRef.current) clearInterval(frameRef.current)
      }
    }, step)

    // Auto-dismiss
    timerRef.current = setTimeout(() => dismiss(), cfg.duration)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (frameRef.current) clearInterval(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card])

  const dismiss = () => {
    setLeaving(true)
    setTimeout(() => {
      setVisible(false)
      setLeaving(false)
      onDismiss()
    }, 400)
  }

  if (!card || !visible) return null

  const cfg = CARD_CONFIG[card.type]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
      onClick={() => dismiss()}
      style={{
        background: cfg.bg,
        // Entrance / exit
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.04)" : "scale(1)",
        transition: leaving
          ? "opacity 0.4s ease, transform 0.4s ease"
          : "opacity 0.25s ease, transform 0.25s ease",
        // Shake for violent events
        animation: cfg.shake && !leaving ? "flashShake 0.55s ease" : undefined,
      }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, ${cfg.scanColor} 2px, ${cfg.scanColor} 4px)`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Corner brackets */}
      {[
        { top: 16, left: 16, rotate: "0deg" },
        { top: 16, right: 16, rotate: "90deg" },
        { bottom: 16, right: 16, rotate: "180deg" },
        { bottom: 16, left: 16, rotate: "270deg" },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-[32px] h-[32px] pointer-events-none"
          style={{
            ...pos,
            borderTop: `1.5px solid ${cfg.borderColor}`,
            borderLeft: `1.5px solid ${cfg.borderColor}`,
            opacity: 0.6,
            transform: `rotate(${pos.rotate ?? "0deg"})`,
          }}
        />
      ))}

      {/* Horizontal rule lines */}
      <div
        className="absolute left-[10%] right-[10%] pointer-events-none"
        style={{ top: "28%", height: "1px", background: `linear-gradient(90deg, transparent, ${cfg.borderColor}55, transparent)` }}
      />
      <div
        className="absolute left-[10%] right-[10%] pointer-events-none"
        style={{ bottom: "28%", height: "1px", background: `linear-gradient(90deg, transparent, ${cfg.borderColor}55, transparent)` }}
      />

      {/* Card body */}
      <div
        className="relative z-10 flex flex-col items-center gap-5 px-8 text-center max-w-[420px] w-full"
        style={{
          animation: "flashReveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Icon */}
        <div
          className="text-[72px] leading-none select-none"
          style={{
            filter: `drop-shadow(0 0 18px ${cfg.glowColor})`,
            animation: cfg.flicker ? "flicker 1.4s infinite" : undefined,
          }}
        >
          {cfg.icon}
        </div>

        {/* Headline */}
        <div
          className="font-[var(--font-display)] leading-none tracking-[0.08em]"
          style={{
            fontSize: "clamp(38px, 9vw, 62px)",
            color: cfg.textColor,
            textShadow: `0 0 20px ${cfg.glowColor}, 0 0 50px ${cfg.glowColor}66`,
            animation: cfg.flicker ? "flicker 1.8s infinite" : undefined,
          }}
        >
          {headlineText}
        </div>

        {/* Subtitle */}
        <div
          className="font-[var(--font-title)] text-[11px] tracking-[0.45em] uppercase leading-relaxed"
          style={{ color: "rgba(232,221,208,0.55)", maxWidth: 280 }}
        >
          {subText}
        </div>

        {/* Dismiss hint */}
        <div
          className="font-[var(--font-title)] text-[9px] tracking-[0.4em] uppercase mt-2"
          style={{ color: "rgba(232,221,208,0.18)", animation: "blink 2.4s infinite" }}
        >
          — tap to continue —
        </div>
      </div>

      {/* Outer border pulse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: `1px solid ${cfg.borderColor}`,
          opacity: 0.25,
          animation: "pulseOpacity 1.8s infinite",
        }}
      />
    </div>
  )
}

// ── Hook for queueing flash cards ────────────────────────────
import { useCallback } from "react"

export function useFlashCard() {
  const [queue, setQueue] = useState<FlashCardData[]>([])
  const [current, setCurrent] = useState<FlashCardData | null>(null)

  const show = useCallback((card: FlashCardData) => {
    setQueue(prev => [...prev, card])
  }, [])

  // Dequeue when current finishes
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [current, queue])

  const dismiss = useCallback(() => {
    setCurrent(null)
  }, [])

  return { current, show, dismiss }
}
