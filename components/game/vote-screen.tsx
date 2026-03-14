"use client"

import { useEffect, useState } from "react"

interface VotePlayer {
  id: string
  name: string
}

interface VoteScreenProps {
  initiatorName: string
  eligiblePlayers: VotePlayer[]
  timeRemaining: number
  voteCast: number
  totalPlayers: number
  onVote: (suspectId: string) => void
  myVote: string | null
}

export function VoteScreen({
  initiatorName,
  eligiblePlayers,
  timeRemaining,
  voteCast,
  totalPlayers,
  onVote,
  myVote,
}: VoteScreenProps) {
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    if (timeRemaining <= 10) {
      const id = setInterval(() => setGlitch((g) => !g), 300)
      return () => clearInterval(id)
    }
  }, [timeRemaining])

  const pct = (timeRemaining / 60) * 100

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-[360px] mx-4"
        style={{
          background: "rgba(4,2,14,0.97)",
          border: "1px solid rgba(192,0,10,0.4)",
          borderTop: "2px solid var(--st-crimson-glow)",
          boxShadow: "0 0 60px rgba(200,0,10,0.3)",
          animation: "fadeUp 0.4s ease",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(192,0,10,0.2)" }}>
          <div
            className="font-[var(--font-title)] text-[9px] tracking-[0.5em] uppercase mb-1"
            style={{ color: "rgba(232,221,208,0.35)" }}
          >
            Emergency Meeting
          </div>
          <div
            className="font-[var(--font-display)] text-[18px] tracking-[0.06em]"
            style={{ color: "var(--st-crimson-glow)", textShadow: "0 0 12px var(--st-crimson-glow)" }}
          >
            {initiatorName} called a vote
          </div>
        </div>

        {/* Timer bar */}
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(192,0,10,0.15)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-[var(--font-title)] text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(232,221,208,0.35)" }}>
              Time remaining
            </span>
            <span
              className="font-[var(--font-display)] text-[22px]"
              style={{
                color: timeRemaining <= 10 ? "var(--st-crimson-glow)" : "var(--st-pale)",
                animation: glitch ? "pulseOpacity 0.3s infinite" : "none",
              }}
            >
              {timeRemaining}s
            </span>
          </div>
          <div className="h-[4px]" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: timeRemaining > 20 ? "var(--st-teal)" : "var(--st-crimson-glow)",
                boxShadow: `0 0 6px ${timeRemaining > 20 ? "var(--st-teal)" : "var(--st-crimson-glow)"}`,
              }}
            />
          </div>
          <div className="font-[var(--font-title)] text-[9px] tracking-[0.25em] uppercase mt-1 text-right" style={{ color: "rgba(232,221,208,0.25)" }}>
            {voteCast}/{totalPlayers} voted
          </div>
        </div>

        {/* Suspect list */}
        <div className="px-5 py-3">
          <div className="font-[var(--font-title)] text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: "rgba(232,221,208,0.35)" }}>
            Vote to eliminate:
          </div>
          <div className="flex flex-col gap-1.5">
            {eligiblePlayers.map((p) => {
              const isMyVote = myVote === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => !myVote && onVote(p.id)}
                  disabled={!!myVote}
                  className="flex items-center gap-3 px-3 py-2.5 text-left w-full transition-all duration-150"
                  style={{
                    background: isMyVote ? "rgba(192,0,10,0.2)" : "rgba(0,0,0,0.4)",
                    border: `1px solid ${isMyVote ? "var(--st-crimson-glow)" : "rgba(192,0,10,0.18)"}`,
                    cursor: myVote ? "default" : "pointer",
                    opacity: myVote && !isMyVote ? 0.45 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!myVote) e.currentTarget.style.borderColor = "var(--st-crimson)"
                  }}
                  onMouseLeave={(e) => {
                    if (!myVote) e.currentTarget.style.borderColor = "rgba(192,0,10,0.18)"
                  }}
                >
                  <div
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center font-[var(--font-display)] text-[14px] flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, var(--st-crimson-deep), rgba(0,30,28,0.5))",
                      border: "1px solid rgba(192,0,10,0.3)",
                      color: "var(--st-pale)",
                    }}
                  >
                    {p.name[0]}
                  </div>
                  <span
                    className="font-[var(--font-body)] text-[13px] flex-1"
                    style={{ color: isMyVote ? "var(--st-crimson-glow)" : "var(--st-pale)" }}
                  >
                    {p.name}
                  </span>
                  {isMyVote && (
                    <span className="font-[var(--font-title)] text-[9px] tracking-[0.2em] uppercase" style={{ color: "var(--st-crimson-glow)" }}>
                      ✓ Voted
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-5 pb-4 font-[var(--font-title)] text-[9px] tracking-[0.25em] uppercase text-center" style={{ color: "rgba(232,221,208,0.18)" }}>
          Majority rules — wrong call boosts the Demogorgon
        </div>
      </div>
    </div>
  )
}
