"use client"

interface PlayerHUDProps {
  role: string
  threatLevel: number       // 0–100
  bearing: number | null    // degrees, null if no threat
  distanceMetres: number    // Infinity if not nearby
  phase: string
  timeRemaining: number
  isVisible: boolean        // stealth agent visibility
  preyDirection?: { bearing: number; distanceMetres: number } // demo only
}

const PHASE_LABELS: Record<string, string> = {
  early:     "EARLY PHASE",
  mid:       "MID PHASE",
  late:      "LATE PHASE",
  bloodmoon: "BLOOD MOON",
}

const PHASE_COLORS: Record<string, string> = {
  early:     "var(--st-teal)",
  mid:       "var(--st-ember)",
  late:      "var(--st-crimson-glow)",
  bloodmoon: "#ff0020",
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function ThreatBar({ level }: { level: number }) {
  const color = level < 30 ? "var(--st-teal)" : level < 65 ? "var(--st-ember)" : "var(--st-crimson-glow)"
  const label = level < 20 ? "ALL CLEAR" : level < 50 ? "ELEVATED" : level < 80 ? "DANGER" : "CRITICAL"
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-[var(--font-title)] text-[9px] tracking-[0.4em] uppercase" style={{ color: "rgba(232,221,208,0.4)" }}>
          Threat Level
        </span>
        <span className="font-[var(--font-title)] text-[9px] tracking-[0.3em] uppercase" style={{ color, animation: level > 70 ? "blink 0.8s infinite" : "none" }}>
          {label}
        </span>
      </div>
      <div
        className="h-[6px] w-full relative overflow-hidden"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${level}%`,
            background: `linear-gradient(90deg, var(--st-teal-dim), ${color})`,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  )
}

function CompassBearing({ bearing }: { bearing: number }) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"]
  const idx = Math.round(bearing / 45) % 8
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
        style={{ border: "1px solid rgba(255,26,46,0.4)", background: "rgba(0,0,0,0.4)" }}
      >
        <span
          style={{
            display: "inline-block",
            transform: `rotate(${bearing}deg)`,
            color: "var(--st-crimson-glow)",
            fontSize: "14px",
            lineHeight: 1,
          }}
        >↑</span>
      </div>
      <div>
        <div className="font-[var(--font-title)] text-[8px] tracking-[0.35em] uppercase" style={{ color: "rgba(232,221,208,0.3)" }}>Signal</div>
        <div className="font-[var(--font-display)] text-[14px]" style={{ color: "var(--st-crimson-glow)" }}>{dirs[idx]}</div>
      </div>
    </div>
  )
}

export function PlayerHUD({
  role,
  threatLevel,
  bearing,
  distanceMetres,
  phase,
  timeRemaining,
  isVisible,
  preyDirection,
}: PlayerHUDProps) {
  const isDemo = role === "demogorgon"
  const isStealth = role === "stealth_agent"
  const phaseColor = PHASE_COLORS[phase] || PHASE_COLORS.early
  const isBloodMoon = phase === "bloodmoon"

  return (
    <div className="w-full flex flex-col gap-2 px-1">

      {/* Timer + Phase row */}
      <div className="flex items-center justify-between">
        <div
          className="font-[var(--font-title)] text-[9px] tracking-[0.4em] uppercase px-2 py-1"
          style={{ border: `1px solid ${phaseColor}44`, color: phaseColor, animation: isBloodMoon ? "blink 1s infinite" : "none" }}
        >
          {PHASE_LABELS[phase] || phase}
        </div>
        <div className="font-[var(--font-display)] text-[26px] tracking-[0.12em]" style={{ color: isBloodMoon ? "var(--st-crimson-glow)" : "var(--st-pale)" }}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Threat bar — agents only */}
      {!isDemo && (
        <div
          className="p-2.5"
          style={{ background: "rgba(4,2,14,0.8)", border: "1px solid rgba(192,0,10,0.18)" }}
        >
          <ThreatBar level={threatLevel} />
          {bearing !== null && distanceMetres < 999 && (
            <div className="flex items-center justify-between mt-2">
              <CompassBearing bearing={bearing} />
              <div className="text-right">
                <div className="font-[var(--font-title)] text-[8px] tracking-[0.3em] uppercase" style={{ color: "rgba(232,221,208,0.3)" }}>Distance</div>
                <div className="font-[var(--font-display)] text-[14px]" style={{ color: "var(--st-crimson-glow)" }}>
                  {Math.round(distanceMetres)}m
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stealth agent visibility badge */}
      {isStealth && (
        <div
          className="px-3 py-1.5 flex items-center gap-2"
          style={{
            background: isVisible ? "rgba(255,100,0,0.1)" : "rgba(0,40,38,0.5)",
            border: `1px solid ${isVisible ? "rgba(255,100,0,0.35)" : "rgba(0,180,170,0.2)"}`,
          }}
        >
          <div
            className="w-[8px] h-[8px] rounded-full flex-shrink-0"
            style={{
              background: isVisible ? "var(--st-ember)" : "var(--st-teal)",
              boxShadow: `0 0 6px ${isVisible ? "var(--st-ember)" : "var(--st-teal)"}`,
              animation: "blink 1.8s infinite",
            }}
          />
          <span className="font-[var(--font-title)] text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(232,221,208,0.5)" }}>
            {isVisible ? "EXPOSED — Move away" : "Stealth Active"}
          </span>
        </div>
      )}

      {/* Demogorgon prey direction */}
      {isDemo && preyDirection && (
        <div
          className="p-2.5 flex items-center justify-between"
          style={{ background: "rgba(60,0,5,0.7)", border: "1px solid rgba(192,0,10,0.3)" }}
        >
          <div>
            <div className="font-[var(--font-title)] text-[8px] tracking-[0.35em] uppercase mb-1" style={{ color: "rgba(232,221,208,0.35)" }}>
              Nearest Prey
            </div>
            <CompassBearing bearing={preyDirection.bearing} />
          </div>
          <div className="text-right">
            <div className="font-[var(--font-title)] text-[8px] tracking-[0.3em] uppercase" style={{ color: "rgba(232,221,208,0.3)" }}>Distance</div>
            <div className="font-[var(--font-display)] text-[18px]" style={{ color: "var(--st-crimson-glow)" }}>
              {Math.round(preyDirection.distanceMetres)}m
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
