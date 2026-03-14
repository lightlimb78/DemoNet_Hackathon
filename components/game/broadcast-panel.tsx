"use client"

import { useState } from "react"

interface BroadcastMessage {
  id: string
  message: string
  triggeredBy: string
  timestamp: number
}

interface BroadcastPanelProps {
  isHost: boolean
  broadcasts: BroadcastMessage[]
  players: { id: string; name: string }[]
  onSend: (message: string) => void
  onSendTemplate: (templateIndex: number, playerName?: string) => void
}

const TEMPLATES = [
  { label: "Agent gone silent", needsPlayer: true,  icon: "📡" },
  { label: "Demo near east wing", needsPlayer: false, icon: "⚠" },
  { label: "EM anomaly Level 2",  needsPlayer: false, icon: "⚡" },
  { label: "Agent compromised",   needsPlayer: true,  icon: "🔴" },
  { label: "Breach — converge",   needsPlayer: false, icon: "🚨" },
  { label: "Signal lost sectors", needsPlayer: false, icon: "📵" },
]

export function BroadcastPanel({ isHost, broadcasts, players, onSend, onSendTemplate }: BroadcastPanelProps) {
  const [custom, setCustom] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [tab, setTab] = useState<"feed" | "send">("feed")

  const handleCustomSend = () => {
    if (!custom.trim()) return
    onSend(custom.trim())
    setCustom("")
  }

  return (
    <div
      className="flex flex-col"
      style={{
        background: "rgba(4,2,14,0.9)",
        border: "1px solid rgba(192,0,10,0.2)",
      }}
    >
      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: "1px solid rgba(192,0,10,0.18)" }}>
        {(["feed", "send"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 font-[var(--font-title)] text-[9px] tracking-[0.35em] uppercase transition-colors duration-150"
            style={{
              background: tab === t ? "rgba(192,0,10,0.1)" : "transparent",
              color: tab === t ? "var(--st-crimson-glow)" : "rgba(232,221,208,0.3)",
              border: "none",
              borderBottom: tab === t ? "1px solid var(--st-crimson-glow)" : "none",
              cursor: "pointer",
            }}
          >
            {t === "feed" ? "📻 Intel Feed" : "📣 Broadcast"}
          </button>
        ))}
      </div>

      {/* Feed */}
      {tab === "feed" && (
        <div className="flex flex-col gap-1 p-2 max-h-[160px] overflow-y-auto">
          {broadcasts.length === 0 && (
            <div className="font-[var(--font-title)] text-[9px] tracking-[0.3em] uppercase text-center py-4" style={{ color: "rgba(232,221,208,0.2)" }}>
              No intel yet
            </div>
          )}
          {[...broadcasts].reverse().map((b) => (
            <div
              key={b.id}
              className="px-2 py-1.5 flex gap-2 items-start"
              style={{
                background: "rgba(0,0,0,0.3)",
                borderLeft: `2px solid ${b.triggeredBy === "host" ? "var(--st-ember)" : b.triggeredBy === "elimination" ? "var(--st-crimson)" : "rgba(192,0,10,0.3)"}`,
                animation: "slideIn 0.2s ease",
              }}
            >
              <span className="font-[var(--font-title)] text-[8px] tracking-[0.2em] uppercase flex-shrink-0 mt-0.5" style={{ color: "rgba(232,221,208,0.25)" }}>
                {new Date(b.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="font-[var(--font-body)] text-[11px] italic leading-snug" style={{ color: "rgba(232,221,208,0.7)" }}>
                {b.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Send (host only) */}
      {tab === "send" && isHost && (
        <div className="p-2 flex flex-col gap-2">
          {/* Player selector for templates */}
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full px-2 py-1.5 text-[11px] outline-none"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(192,0,10,0.2)",
              color: "var(--st-pale)",
              fontFamily: "var(--font-body)",
            }}
          >
            <option value="">— Select Agent —</option>
            {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>

          {/* Templates */}
          <div className="grid grid-cols-2 gap-1">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={i}
                onClick={() => onSendTemplate(i, tmpl.needsPlayer ? selectedPlayer : undefined)}
                className="px-2 py-1.5 text-left transition-all duration-150"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(192,0,10,0.18)",
                  color: "rgba(232,221,208,0.6)",
                  fontFamily: "var(--font-title)",
                  fontSize: "8px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--st-ember)"; e.currentTarget.style.color = "var(--st-pale)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(192,0,10,0.18)"; e.currentTarget.style.color = "rgba(232,221,208,0.6)" }}
              >
                {tmpl.icon} {tmpl.label}
              </button>
            ))}
          </div>

          {/* Custom */}
          <div className="flex gap-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSend()}
              placeholder="Custom broadcast…"
              maxLength={80}
              className="flex-1 px-2 py-1.5 text-[11px] outline-none"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(192,0,10,0.2)",
                color: "var(--st-pale)",
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              onClick={handleCustomSend}
              className="px-3 py-1.5 font-[var(--font-display)] text-[12px] tracking-[0.1em]"
              style={{
                background: "linear-gradient(135deg, var(--st-crimson), #880008)",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {tab === "send" && !isHost && (
        <div className="p-4 font-[var(--font-title)] text-[9px] tracking-[0.3em] uppercase text-center" style={{ color: "rgba(232,221,208,0.2)" }}>
          Host only
        </div>
      )}
    </div>
  )
}
