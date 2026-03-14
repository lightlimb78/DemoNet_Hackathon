"use client"

interface PlayerStat {
  id: string
  name: string
  role: string
  survived: boolean
  survivalTime: number
  eliminations: number
}

interface PostGameScreenProps {
  winner: "security" | "demogorgon"
  reason: string
  stats: PlayerStat[]
  gameDuration: number
  myId: string
  onPlayAgain: () => void
  onExit: () => void
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const ROLE_COLOR: Record<string, string> = {
  demogorgon:   "var(--st-crimson-glow)",
  agent:        "var(--st-teal-bright)",
  stealth_agent:"#ffd060",
  security:     "var(--st-teal-bright)",
}

const ROLE_LABEL: Record<string, string> = {
  demogorgon:    "DEMOGORGON",
  agent:         "SECURITY",
  stealth_agent: "STEALTH",
  security:      "SECURITY",
}

export function PostGameScreen({ winner, reason, stats, gameDuration, myId, onPlayAgain, onExit }: PostGameScreenProps) {
  const securityWon = winner === "security"
  const titleColor  = securityWon ? "var(--st-teal-bright)" : "var(--st-crimson-glow)"
  const titleGlow   = securityWon ? "var(--st-teal)" : "var(--st-crimson-glow)"
  const title       = securityWon ? "HAWKINS SECURE" : "THE UPSIDE DOWN WINS"

  // Sort: demo first, then by survival time
  const sorted = [...stats].sort((a, b) => {
    if (a.role === "demogorgon") return -1
    if (b.role === "demogorgon") return 1
    return b.survivalTime - a.survivalTime
  })

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto"
      style={{
        background: securityWon
          ? "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,100,90,0.3) 0%, transparent 60%), var(--st-void)"
          : "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(150,0,8,0.4) 0%, transparent 60%), var(--st-void)",
      }}
    >
      {/* Grain */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")` }}
      />

      <div className="relative z-10 flex flex-col items-center p-6 gap-6 w-full max-w-[480px] mx-auto">

        {/* Title */}
        <div className="text-center mt-4" style={{ animation: "fadeUp 0.8s ease both" }}>
          <div className="font-[var(--font-title)] text-[9px] tracking-[0.5em] uppercase mb-3" style={{ color: "rgba(232,221,208,0.3)" }}>
            Mission Complete
          </div>
          <div
            className="font-[var(--font-display)] leading-none tracking-[0.06em]"
            style={{
              fontSize: "clamp(32px, 8vw, 52px)",
              color: titleColor,
              textShadow: `0 0 20px ${titleGlow}, 0 0 50px ${titleGlow}55`,
              animation: "flicker 4s infinite",
            }}
          >
            {title}
          </div>
          <div
            className="font-[var(--font-body)] italic text-[12px] mt-2"
            style={{ color: "rgba(232,221,208,0.4)" }}
          >
            {reason}
          </div>
        </div>

        {/* Game duration */}
        <div
          className="flex items-center gap-4 px-6 py-3 w-full"
          style={{
            background: "rgba(4,2,14,0.8)",
            border: "1px solid rgba(192,0,10,0.18)",
            animation: "fadeUp 0.8s 0.1s ease both",
          }}
        >
          <div className="text-center flex-1">
            <div className="font-[var(--font-title)] text-[8px] tracking-[0.35em] uppercase" style={{ color: "rgba(232,221,208,0.3)" }}>Duration</div>
            <div className="font-[var(--font-display)] text-[22px]" style={{ color: "var(--st-pale)" }}>{formatTime(gameDuration)}</div>
          </div>
          <div className="w-px h-10" style={{ background: "rgba(192,0,10,0.2)" }} />
          <div className="text-center flex-1">
            <div className="font-[var(--font-title)] text-[8px] tracking-[0.35em] uppercase" style={{ color: "rgba(232,221,208,0.3)" }}>Survivors</div>
            <div className="font-[var(--font-display)] text-[22px]" style={{ color: "var(--st-teal-bright)" }}>
              {stats.filter(s => s.survived && s.role !== "demogorgon").length}
            </div>
          </div>
          <div className="w-px h-10" style={{ background: "rgba(192,0,10,0.2)" }} />
          <div className="text-center flex-1">
            <div className="font-[var(--font-title)] text-[8px] tracking-[0.35em] uppercase" style={{ color: "rgba(232,221,208,0.3)" }}>Eliminated</div>
            <div className="font-[var(--font-display)] text-[22px]" style={{ color: "var(--st-crimson-glow)" }}>
              {stats.filter(s => !s.survived && s.role !== "demogorgon").length}
            </div>
          </div>
        </div>

        {/* Player breakdown */}
        <div
          className="w-full"
          style={{
            background: "rgba(4,2,14,0.85)",
            border: "1px solid rgba(192,0,10,0.18)",
            borderTop: "2px solid rgba(192,0,10,0.4)",
            animation: "fadeUp 0.8s 0.2s ease both",
          }}
        >
          <div
            className="px-4 py-2.5 font-[var(--font-title)] text-[9px] tracking-[0.45em] uppercase"
            style={{ color: "var(--st-teal)", opacity: 0.7, borderBottom: "1px solid rgba(192,0,10,0.15)" }}
          >
            Debrief
          </div>
          {sorted.map((p, i) => {
            const isMe = p.id === myId
            const roleColor = ROLE_COLOR[p.role] || "var(--st-pale)"
            const isDemo = p.role === "demogorgon"
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{
                  borderBottom: i < sorted.length - 1 ? "1px solid rgba(192,0,10,0.08)" : "none",
                  background: isMe ? "rgba(0,60,55,0.1)" : "transparent",
                  animation: `slideIn 0.3s ${i * 0.06}s ease both`,
                }}
              >
                <div
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center font-[var(--font-display)] text-[16px] flex-shrink-0"
                  style={{
                    background: isDemo
                      ? "rgba(80,0,5,0.5)"
                      : "linear-gradient(135deg, var(--st-crimson-deep), rgba(0,40,36,0.4))",
                    border: `1px solid ${roleColor}44`,
                    color: roleColor,
                  }}
                >
                  {p.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-[var(--font-body)] text-[13px]" style={{ color: "var(--st-pale)" }}>
                      {p.name}
                      {isMe && <span className="ml-1 text-[10px]" style={{ color: "var(--st-teal)" }}>(you)</span>}
                    </span>
                  </div>
                  <div className="font-[var(--font-title)] text-[8px] tracking-[0.25em] uppercase" style={{ color: roleColor, opacity: 0.8 }}>
                    {ROLE_LABEL[p.role] || p.role}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {isDemo ? (
                    <div className="font-[var(--font-display)] text-[13px]" style={{ color: "var(--st-crimson-glow)" }}>
                      {p.eliminations} caught
                    </div>
                  ) : (
                    <>
                      <div
                        className="font-[var(--font-title)] text-[9px] tracking-[0.2em] uppercase"
                        style={{ color: p.survived ? "var(--st-teal)" : "var(--st-crimson-glow)" }}
                      >
                        {p.survived ? "✓ Survived" : "✕ Eliminated"}
                      </div>
                      <div className="font-[var(--font-title)] text-[8px] tracking-[0.15em]" style={{ color: "rgba(232,221,208,0.3)" }}>
                        {formatTime(p.survivalTime)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full" style={{ animation: "fadeUp 0.8s 0.3s ease both" }}>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 font-[var(--font-display)] text-[18px] tracking-[0.18em] uppercase text-white transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, var(--st-crimson), #880008)",
              boxShadow: "0 0 18px rgba(200,0,10,0.35)",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 30px rgba(255,20,40,0.5)" }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 18px rgba(200,0,10,0.35)" }}
          >
            ↺ Play Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 font-[var(--font-display)] text-[18px] tracking-[0.18em] uppercase transition-all duration-200"
            style={{
              background: "transparent",
              border: "1px solid rgba(192,0,10,0.32)",
              color: "rgba(232,221,208,0.5)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--st-crimson)"; e.currentTarget.style.color = "var(--st-pale)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(192,0,10,0.32)"; e.currentTarget.style.color = "rgba(232,221,208,0.5)" }}
          >
            ← Exit
          </button>
        </div>

      </div>
    </div>
  )
}
