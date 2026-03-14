"use client"

import { useEffect, useState } from "react"

interface AlertBannerProps {
  message: string
  type?: "danger" | "warning" | "info" | "scream"
  visible: boolean
  onDismiss?: () => void
}

const GLITCH_CHARS = "!@#$%^&*<>?/|\\[]{}~"

function glitch(text: string) {
  return text
    .split("")
    .map((c) => (Math.random() < 0.15 ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : c))
    .join("")
}

export function AlertBanner({ message, type = "danger", visible, onDismiss }: AlertBannerProps) {
  const [displayText, setDisplayText] = useState(message)

  useEffect(() => {
    if (!visible) return
    setDisplayText(message)
    let cycles = 0
    const max = type === "scream" ? 12 : 6
    const id = setInterval(() => {
      cycles++
      if (cycles >= max) {
        setDisplayText(message)
        clearInterval(id)
      } else {
        setDisplayText(glitch(message))
      }
    }, 60)
    return () => clearInterval(id)
  }, [message, visible, type])

  if (!visible) return null

  const cfg = {
    danger:  { border: "var(--st-crimson-glow)", bg: "rgba(120,0,8,0.18)", color: "var(--st-crimson-glow)", icon: "⚠" },
    warning: { border: "var(--st-ember)",        bg: "rgba(120,50,0,0.15)", color: "var(--st-ember)",        icon: "!" },
    info:    { border: "var(--st-teal)",          bg: "rgba(0,60,55,0.15)", color: "var(--st-teal-bright)", icon: "◈" },
    scream:  { border: "var(--st-crimson-bright)",bg: "rgba(200,0,10,0.25)", color: "#ffffff",              icon: "☠" },
  }[type]

  return (
    <div
      className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.border}`,
        boxShadow: `0 0 20px ${cfg.border}44`,
        animation: type === "scream" ? "pulseOpacity 0.4s infinite" : "slideIn 0.25s ease",
      }}
      onClick={onDismiss}
    >
      <span
        className="font-[var(--font-display)] text-[20px] flex-shrink-0"
        style={{ color: cfg.color, textShadow: `0 0 10px ${cfg.color}` }}
      >
        {cfg.icon}
      </span>
      <span
        className="font-[var(--font-title)] text-[10px] tracking-[0.28em] uppercase flex-1"
        style={{ color: cfg.color, textShadow: `0 0 8px ${cfg.color}44` }}
      >
        {displayText}
      </span>
      {onDismiss && (
        <span className="font-[var(--font-title)] text-[10px] opacity-40" style={{ color: cfg.color }}>✕</span>
      )}
    </div>
  )
}
