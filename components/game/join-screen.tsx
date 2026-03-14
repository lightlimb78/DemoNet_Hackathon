"use client"

import { useState } from "react"
import { LightningBackground } from "./lightning-background"
import { Trees } from "./trees"
import ReactAudioPlayer from "react-audio-player"

interface JoinScreenProps {
  onCreateMission: (name: string) => void
  onJoinMission: (name: string, code: string) => void
}

export function JoinScreen({ onCreateMission, onJoinMission }: JoinScreenProps) {
  const [mode, setMode] = useState<"create" | "join">("create")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isConnected, setIsConnected] = useState(false)

  // Simulate connection
  useState(() => {
    const timer = setTimeout(() => setIsConnected(true), 1500)
    return () => clearTimeout(timer)
  })

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Enter your agent name")
      setTimeout(() => setError(""), 3000)
      return
    }
    onCreateMission(name.trim())
  }

  const handleJoin = () => {
    if (!name.trim()) {
      setError("Enter your agent name")
      setTimeout(() => setError(""), 3000)
      return
    }
    if (code.length < 4) {
      setError("Enter a valid access code")
      setTimeout(() => setError(""), 3000)
      return
    }
    onJoinMission(name.trim(), code.toUpperCase())
  }

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 100% 55% at 50% 0%, rgba(160,0,8,0.55) 0%, transparent 65%),
          radial-gradient(ellipse 70% 30% at 50% 100%, rgba(0,150,140,0.12) 0%, transparent 60%),
          linear-gradient(180deg, #0c0005 0%, #06000f 60%, #02040f 100%)
        `
      }}
    >
      <ReactAudioPlayer
      src="/song2.mpeg"
        autoPlay
        loop
        volume={1}
      />

      {/* Grain Overlay */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none opacity-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.045'/%3E%3C/svg%3E")`
        }}
      />

      <LightningBackground />
      <Trees />
      
      {/* Ground Mist */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[22%] pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(0,180,170,0.08) 0%, transparent 100%)"
        }}
      />

      {/* Logo Block */}
      <div 
        className="relative z-10 text-center mb-9"
        style={{ animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div 
          className="font-[var(--font-title)] font-light text-[11px] tracking-[0.55em] uppercase mb-3.5"
          style={{ color: "var(--st-teal)", opacity: 0.65 }}
        >
          Hawkins Laboratory — Field Protocol
        </div>
        <div 
          className="leading-[0.88] tracking-[0.07em] flex flex-col items-center"
          style={{ 
            fontSize: "clamp(54px, 9vw, 88px)",
          }}
        >
          <span 
            className="font-[var(--font-display)] relative"
            style={{ 
              color: "var(--st-crimson-glow)",
              textShadow: "0 0 12px var(--st-crimson-glow), 0 0 30px rgba(255,26,46,0.5), 0 0 70px rgba(200,0,10,0.25)",
              animation: "flicker 7s infinite",
              letterSpacing: "0.18em"
            }}
          >
            <span style={{ 
              display: "inline-block",
              transform: "skewX(-4deg)",
              textShadow: "0 0 18px var(--st-crimson-glow), 0 0 40px rgba(255,26,46,0.6), 0 0 80px rgba(200,0,10,0.3), 2px 2px 0 rgba(0,0,0,0.5)"
            }}>DEMO</span>
            <span style={{ 
              display: "inline-block",
              color: "var(--st-teal-bright)",
              textShadow: "0 0 15px var(--st-teal), 0 0 35px rgba(0,230,220,0.5), 0 0 60px rgba(0,180,170,0.3)",
              transform: "skewX(-4deg)",
              marginLeft: "-0.02em"
            }}>NET</span>
          </span>
          <span 
            className="font-[var(--font-title)] font-light uppercase mt-1"
            style={{ 
              fontSize: "clamp(16px, 3vw, 26px)",
              letterSpacing: "0.45em",
              color: "rgba(232,221,208,0.55)",
              textShadow: "0 0 8px rgba(232,221,208,0.2)",
              position: "relative"
            }}
          >
            <span style={{ 
              position: "absolute",
              left: "-1.5em",
              opacity: 0.4,
              color: "var(--st-crimson)"
            }}>//</span>
            Radar Hunt
            <span style={{ 
              position: "absolute",
              right: "-1.5em",
              opacity: 0.4,
              color: "var(--st-crimson)"
            }}>//</span>
          </span>
        </div>
        <div 
          className="font-[var(--font-title)] font-light text-[11px] tracking-[0.5em] uppercase mt-2.5"
          style={{ color: "rgba(232,221,208,0.25)" }}
        >
          Security System · Est. 1983
        </div>
      </div>

      {/* Card */}
      <div 
        className="relative z-10 w-full max-w-[400px] p-8 pb-7"
        style={{
          background: "rgba(4,2,14,0.88)",
          border: "1px solid rgba(192,0,10,0.28)",
          borderTop: "2px solid var(--st-crimson)",
          boxShadow: "0 0 50px rgba(200,0,10,0.15), 0 0 120px rgba(200,0,10,0.06), inset 0 1px 0 rgba(255,60,30,0.08)",
          animation: "fadeUp 0.9s 0.15s cubic-bezier(0.16,1,0.3,1) both"
        }}
      >
        {/* Scanlines */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)"
          }}
        />

        {mode === "create" ? (
          <div className="relative z-10">
            {/* Agent Name Field */}
            <div className="mb-4">
              <label 
                className="block font-[var(--font-title)] font-normal text-[10px] tracking-[0.4em] uppercase mb-2"
                style={{ color: "var(--st-teal)", opacity: 0.7 }}
              >
                Agent Name
              </label>
              <input
                type="text"
                placeholder="Enter your callsign…"
                maxLength={22}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm tracking-[0.04em] outline-none transition-all duration-200"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(192,0,10,0.22)",
                  borderBottom: "1px solid rgba(192,0,10,0.45)",
                  color: "var(--st-pale)",
                  fontFamily: "var(--font-body)",
                  borderRadius: "1px"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--st-crimson)"
                  e.target.style.boxShadow = "0 0 14px rgba(200,0,10,0.22), inset 0 0 8px rgba(200,0,10,0.06)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(192,0,10,0.22)"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            {/* Error Line */}
            <div 
              className="font-[var(--font-title)] text-[11px] tracking-[0.2em] text-center min-h-[18px] mb-1.5"
              style={{ 
                color: "var(--st-crimson-glow)",
                animation: error ? "pulseOpacity 1.4s infinite" : "none"
              }}
            >
              {error}
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              className="w-full py-3 font-[var(--font-display)] text-[22px] tracking-[0.22em] uppercase border-none cursor-pointer mb-2.5 relative overflow-hidden transition-all duration-200 text-white"
              style={{
                background: "linear-gradient(135deg, var(--st-crimson) 0%, #880008 100%)",
                boxShadow: "0 0 22px rgba(200,0,10,0.38), 0 2px 0 #500005",
                textShadow: "0 0 8px rgba(255,100,60,0.4)",
                borderRadius: "1px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 38px rgba(255,20,40,0.55), 0 2px 0 #500005"
                e.currentTarget.style.transform = "translateY(-1px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 22px rgba(200,0,10,0.38), 0 2px 0 #500005"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              ◈ Create Mission
            </button>

            {/* Join Button */}
            <button
              onClick={() => setMode("join")}
              className="w-full py-3 font-[var(--font-display)] text-[22px] tracking-[0.22em] uppercase cursor-pointer mb-2.5 transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid rgba(192,0,10,0.32)",
                color: "rgba(232,221,208,0.5)",
                borderRadius: "1px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--st-crimson)"
                e.currentTarget.style.color = "var(--st-pale)"
                e.currentTarget.style.background = "rgba(192,0,10,0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(192,0,10,0.32)"
                e.currentTarget.style.color = "rgba(232,221,208,0.5)"
                e.currentTarget.style.background = "transparent"
              }}
            >
              ⊕ Join Existing Mission
            </button>

            <span 
              className="block text-center font-[var(--font-title)] text-[11px] tracking-[0.22em] uppercase cursor-pointer mt-4 transition-colors duration-200"
              style={{ color: "rgba(232,221,208,0.28)" }}
              onClick={() => setMode("join")}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--st-teal)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(232,221,208,0.28)"}
            >
              {"Have a code? Join instead →"}
            </span>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Agent Name Field */}
            <div className="mb-4">
              <label 
                className="block font-[var(--font-title)] font-normal text-[10px] tracking-[0.4em] uppercase mb-2"
                style={{ color: "var(--st-teal)", opacity: 0.7 }}
              >
                Agent Name
              </label>
              <input
                type="text"
                placeholder="Enter your callsign…"
                maxLength={22}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm tracking-[0.04em] outline-none transition-all duration-200"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(192,0,10,0.22)",
                  borderBottom: "1px solid rgba(192,0,10,0.45)",
                  color: "var(--st-pale)",
                  fontFamily: "var(--font-body)",
                  borderRadius: "1px"
                }}
              />
            </div>

            {/* Access Code Field */}
            <div className="mb-4">
              <label 
                className="block font-[var(--font-title)] font-normal text-[10px] tracking-[0.4em] uppercase mb-2"
                style={{ color: "var(--st-teal)", opacity: 0.7 }}
              >
                Access Code
              </label>
              <input
                type="text"
                placeholder="XXXXXX"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full py-2.5 text-center outline-none transition-all duration-200"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(192,0,10,0.22)",
                  borderBottom: "1px solid rgba(192,0,10,0.45)",
                  color: "var(--st-teal-bright)",
                  fontFamily: "var(--font-display)",
                  fontSize: "30px",
                  letterSpacing: "0.5em",
                  textShadow: "0 0 10px var(--st-teal)",
                  borderRadius: "1px"
                }}
              />
            </div>

            {/* Error Line */}
            <div 
              className="font-[var(--font-title)] text-[11px] tracking-[0.2em] text-center min-h-[18px] mb-1.5"
              style={{ 
                color: "var(--st-crimson-glow)",
                animation: error ? "pulseOpacity 1.4s infinite" : "none"
              }}
            >
              {error}
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoin}
              className="w-full py-3 font-[var(--font-display)] text-[22px] tracking-[0.22em] uppercase border-none cursor-pointer mb-2.5 relative overflow-hidden transition-all duration-200 text-white"
              style={{
                background: "linear-gradient(135deg, var(--st-crimson) 0%, #880008 100%)",
                boxShadow: "0 0 22px rgba(200,0,10,0.38), 0 2px 0 #500005",
                textShadow: "0 0 8px rgba(255,100,60,0.4)",
                borderRadius: "1px"
              }}
            >
              ⊕ Enter Mission
            </button>

            {/* Back Button */}
            <button
              onClick={() => setMode("create")}
              className="w-full py-3 font-[var(--font-display)] text-[22px] tracking-[0.22em] uppercase cursor-pointer transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid rgba(192,0,10,0.32)",
                color: "rgba(232,221,208,0.5)",
                borderRadius: "1px"
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Divider */}
        <div 
          className="h-px my-5 relative z-10"
          style={{ background: "linear-gradient(90deg, transparent, rgba(192,0,10,0.35), transparent)" }}
        />

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mt-6 font-[var(--font-title)] text-[10px] tracking-[0.3em] uppercase relative z-10" style={{ color: "rgba(232,221,208,0.28)" }}>
          <div 
            className="w-[7px] h-[7px] rounded-full"
            style={{
              background: isConnected ? "var(--st-teal)" : "var(--st-crimson)",
              boxShadow: isConnected ? "0 0 8px var(--st-teal)" : "0 0 8px var(--st-crimson)",
              animation: "blink 2.2s infinite"
            }}
          />
          <span>{isConnected ? "Connected to Hawkins Net" : "Connecting to Hawkins Net…"}</span>
        </div>
      </div>
    </div>
  )
}
