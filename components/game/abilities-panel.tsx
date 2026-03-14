"use client"

interface Ability {
  used: boolean
  activeUntil: number
}

interface AbilitiesPanelProps {
  abilities: Record<string, Ability>
  onUse: (ability: string) => void
  requiresLocation?: string  // "fake_signal" needs GPS
}

const ABILITY_CONFIG = {
  phase_shift: {
    name: "Phase Shift",
    icon: "👻",
    desc: "Invisible on radar for 15s",
    color: "var(--st-teal)",
    glow: "rgba(0,200,190,0.3)",
  },
  fake_signal: {
    name: "Fake Signal",
    icon: "📡",
    desc: "Plant a decoy dot for 20s",
    color: "#ffd060",
    glow: "rgba(255,200,50,0.3)",
  },
  sense: {
    name: "Sense",
    icon: "🧠",
    desc: "Reveal nearest prey bearing for 10s",
    color: "var(--st-crimson-glow)",
    glow: "rgba(255,26,46,0.3)",
  },
}

export function AbilitiesPanel({ abilities, onUse }: AbilitiesPanelProps) {
  const now = Date.now()

  return (
    <div
      className="p-3"
      style={{
        background: "rgba(30,0,5,0.85)",
        border: "1px solid rgba(192,0,10,0.3)",
        borderTop: "2px solid rgba(192,0,10,0.5)",
      }}
    >
      <div
        className="font-[var(--font-title)] text-[9px] tracking-[0.45em] uppercase mb-2.5"
        style={{ color: "rgba(192,0,10,0.7)" }}
      >
        Demogorgon Abilities — One Use Each
      </div>

      <div className="flex flex-col gap-2">
        {Object.entries(ABILITY_CONFIG).map(([id, cfg]) => {
          const ability = abilities[id]
          const isUsed = ability?.used
          const isActive = ability?.used && ability.activeUntil > now
          const secsLeft = isActive ? Math.ceil((ability.activeUntil - now) / 1000) : 0

          return (
            <button
              key={id}
              disabled={isUsed}
              onClick={() => onUse(id)}
              className="flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 w-full"
              style={{
                background: isActive
                  ? `${cfg.glow}`
                  : isUsed
                    ? "rgba(0,0,0,0.3)"
                    : "rgba(0,0,0,0.5)",
                border: `1px solid ${isUsed ? "rgba(255,255,255,0.06)" : cfg.color + "55"}`,
                opacity: isUsed && !isActive ? 0.35 : 1,
                cursor: isUsed ? "default" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isUsed) e.currentTarget.style.boxShadow = `0 0 14px ${cfg.glow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <span className="text-[20px] flex-shrink-0">{cfg.icon}</span>
              <div className="flex-1">
                <div
                  className="font-[var(--font-display)] text-[13px] tracking-[0.06em]"
                  style={{ color: isUsed ? "rgba(232,221,208,0.3)" : cfg.color }}
                >
                  {cfg.name}
                  {isActive && (
                    <span className="ml-2 font-[var(--font-title)] text-[9px]" style={{ color: cfg.color, animation: "blink 1s infinite" }}>
                      {secsLeft}s
                    </span>
                  )}
                </div>
                <div
                  className="font-[var(--font-title)] text-[8px] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(232,221,208,0.3)" }}
                >
                  {isUsed && !isActive ? "USED" : cfg.desc}
                </div>
              </div>
              {!isUsed && (
                <div
                  className="font-[var(--font-title)] text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5"
                  style={{ border: `1px solid ${cfg.color}44`, color: cfg.color }}
                >
                  USE
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
