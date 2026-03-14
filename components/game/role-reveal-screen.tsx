"use client"

type Role = "security" | "stealth" | "demogorgon"

interface RoleRevealScreenProps {
  role: Role
  onContinue: () => void
}

const ROLES: Record<string, {
  icon: string
  name: string
  cls: string
  desc: string
  aura: string
  color: string
  textShadow: string
}> = {
  security: {
    icon: "🛡",
    name: "SECURITY",
    cls: "sec",
    desc: "Protect Hawkins. Track the anomaly. Trust no one.",
    aura: "rgba(0,180,170,0.18)",
    color: "var(--st-teal-bright)",
    textShadow: "0 0 20px var(--st-teal), 0 0 50px rgba(0,200,190,0.35)"
  },
  stealth: {
    icon: "👁",
    name: "STEALTH AGENT",
    cls: "stealth",
    desc: "You are invisible on radar — but the Demogorgon can still sense you close up.",
    aura: "rgba(255,200,50,0.12)",
    color: "#ffd060",
    textShadow: "0 0 18px rgba(255,200,50,0.55)"
  },
  demogorgon: {
    icon: "☠",
    name: "DEMOGORGON",
    cls: "demo",
    desc: "You are the predator. Hunt them. Stay hidden. Consume all.",
    aura: "rgba(200,0,10,0.2)",
    color: "var(--st-crimson-glow)",
    textShadow: "0 0 20px var(--st-crimson-glow), 0 0 55px rgba(255,26,46,0.45)"
  }
}

export function RoleRevealScreen({ role, onContinue }: RoleRevealScreenProps) {
  const cfg = ROLES[role] || ROLES.security

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center cursor-pointer"
      style={{ background: "var(--st-void)" }}
      onClick={onContinue}
    >
      {/* Grain Overlay */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none opacity-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")`
        }}
      />

      {/* Role Aura */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 65% at 50% 50%, ${cfg.aura} 0%, transparent 70%)`
        }}
      />

      {/* Content */}
      <div 
        className="relative z-10 text-center flex flex-col items-center gap-4"
        style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div 
          className="font-[var(--font-title)] text-[10px] tracking-[0.5em] uppercase"
          style={{ color: "rgba(232,221,208,0.35)" }}
        >
          Your Assignment
        </div>

        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            border: `2px solid ${cfg.color}`,
            color: cfg.color
          }}
        >
          {cfg.icon}
        </div>

        <div 
          className="font-[var(--font-display)] leading-none tracking-[0.06em]"
          style={{
            fontSize: "clamp(56px, 11vw, 82px)",
            color: cfg.color,
            textShadow: cfg.textShadow,
            animation: role === "demogorgon" ? "flicker 1.6s infinite" : "none"
          }}
        >
          {cfg.name}
        </div>

        <div 
          className="font-[var(--font-body)] italic text-[13px] max-w-[280px] leading-[1.7]"
          style={{ color: "rgba(232,221,208,0.5)" }}
        >
          {cfg.desc}
        </div>

        <div 
          className="font-[var(--font-title)] text-[10px] tracking-[0.35em] uppercase mt-4"
          style={{ 
            color: "rgba(232,221,208,0.22)",
            animation: "blink 2.5s infinite"
          }}
        >
          — Tap to continue —
        </div>
      </div>
    </div>
  )
}
