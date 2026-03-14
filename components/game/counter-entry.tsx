"use client"

import { useState, useCallback, useEffect } from "react"
import ReactAudioPlayer from 'react-audio-player';

type MenuState = "intro" | "mainMenu" | "agentMenu" | "codeMenu"

interface CounterEntryProps {
  onAgentMenu: () => void

}

export function CounterEntry({ onAgentMenu }: CounterEntryProps) {
  const [menuState, setMenuState] = useState<MenuState>("intro")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)

  // Random flicker effect for the 011 display
  useEffect(() => {
    if (menuState !== "intro") return

    const flickerInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitchActive(true)
        setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100)
      }
    }, 200)

    return () => clearInterval(flickerInterval)
  }, [menuState])

  const handleEnter = useCallback(() => {
    setGlitchActive(true)
    setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setMenuState("mainMenu")
        setIsTransitioning(false)
        setGlitchActive(false)
      }, 400)
    }, 200)
  }, [])

  const handleJoinAsAgent = useCallback(() => {
    onAgentMenu()
  }, [onAgentMenu])

  const [audioMute, setAudioMute] = useState(true);

  const handleUnmute = useCallback(() => {
    const audio = document.querySelector('audio') as HTMLAudioElement
    if (audio) {
      if (audio.paused) {
        setAudioMute(false);
        audio.play();
      } else {
        setAudioMute(true);
        audio.pause();
      }
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: "#0a0a0c" }}
    >
      {/* Scanline overlay */}
      <ReactAudioPlayer
        src="/song1.mpeg"
        autoPlay
        loop
        volume={1}
      />
      <button className="fixed bottom-0 text-red-700/70 bg-red" onClick={handleUnmute}>
        {!audioMute ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume2-icon lucide-volume-2"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-off-icon lucide-volume-off"><path d="M16 9a5 5 0 0 1 .95 2.293"/><path d="M19.364 5.636a9 9 0 0 1 1.889 9.96"/><path d="m2 2 20 20"/><path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"/><path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686"/></svg>}
        
      </button>
      <div
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        }}
      />

      {/* Glitch bars during transition */}
      {glitchActive && (
        <div className="pointer-events-none absolute inset-0 z-40">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-full"
              style={{
                top: `${Math.random() * 100}%`,
                background: `linear-gradient(90deg, transparent, ${Math.random() > 0.5 ? '#dc143c' : '#00FFF7'}, transparent)`,
                opacity: 0.8,
                transform: `translateX(${Math.random() * 20 - 10}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* 011 INTRO SCREEN */}
      {menuState === "intro" && (
        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-500 ${isTransitioning ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
          onClick={handleEnter}
          style={{ cursor: "pointer" }}
        >
          {/* Outer glow ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: "280px",
              height: "280px",
              background: "radial-gradient(circle, rgba(220, 20, 60, 0.15) 0%, transparent 70%)",
              animation: "pulse 3s ease-in-out infinite",
            }}
          />

          {/* Counter circle */}
          <div
            className="relative flex h-56 w-56 items-center justify-center rounded-full border-4"
            style={{
              borderColor: glitchActive ? "#fff" : "#dc143c",
              boxShadow: glitchActive
                ? "0 0 60px #fff, 0 0 120px #fff, inset 0 0 60px rgba(255, 255, 255, 0.3)"
                : "0 0 30px #dc143c, 0 0 60px rgba(220, 20, 60, 0.5), 0 0 100px rgba(220, 20, 60, 0.3), inset 0 0 40px rgba(220, 20, 60, 0.2)",
              background: "rgba(10, 10, 12, 0.9)",
              transition: "all 0.1s ease",
            }}
          >
            {/* Inner ring */}
            <div
              className="absolute rounded-full border-2"
              style={{
                width: "200px",
                height: "200px",
                borderColor: "rgba(220, 20, 60, 0.4)",
              }}
            />

            {/* 011 Text */}
            <span
              className="relative font-mono text-7xl font-bold tracking-widest"
              style={{
                color: glitchActive ? "#fff" : "#dc143c",
                textShadow: glitchActive
                  ? "0 0 20px #fff, 0 0 40px #fff, 0 0 80px #fff"
                  : "0 0 10px #dc143c, 0 0 20px #dc143c, 0 0 40px rgba(220, 20, 60, 0.8), 0 0 80px rgba(220, 20, 60, 0.5)",
                transform: glitchActive ? `translateX(${Math.random() * 4 - 2}px)` : "none",
                transition: "color 0.05s ease",
              }}
            >
              011
            </span>
          </div>

          {/* Tap to enter text */}
          <div
            className="mt-8 text-xs uppercase tracking-[0.4em]"
            style={{
              color: "rgba(220, 20, 60, 0.7)",
              textShadow: "0 0 10px rgba(220, 20, 60, 0.5)",
              animation: "fadeInOut 2s ease-in-out infinite",
            }}
          >
            Tap to Enter
          </div>
        </div>
      )}

      {/* MAIN MENU */}
      {menuState === "mainMenu" && (
        <div
          className={`relative z-10 flex flex-col items-center gap-8 transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
        >
          {/* Small 011 badge */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border-2"
            style={{
              borderColor: "#dc143c",
              boxShadow: "0 0 20px rgba(220, 20, 60, 0.5), inset 0 0 15px rgba(220, 20, 60, 0.2)",
              background: "rgba(10, 10, 12, 0.9)",
            }}
          >
            <span
              className="font-mono text-xl font-bold"
              style={{
                color: "#dc143c",
                textShadow: "0 0 10px #dc143c",
              }}
            >
              011
            </span>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1
              className="text-3xl font-bold uppercase tracking-[0.25em]"
              style={{
                color: "#dc143c",
                textShadow: "0 0 10px #dc143c, 0 0 30px rgba(220, 20, 60, 0.6)",
              }}
            >
              Hawkins Lab
            </h1>
            <div
              className="mt-2 text-xs uppercase tracking-[0.4em]"
              style={{
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              Access Terminal
            </div>
          </div>

          {/* Decorative line */}
          <div
            className="h-px w-48"
            style={{
              background: "linear-gradient(90deg, transparent, #dc143c, transparent)",
              boxShadow: "0 0 10px rgba(220, 20, 60, 0.5)",
            }}
          />

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleJoinAsAgent}
              className="group relative w-64 overflow-hidden rounded border-2 px-6 py-4 text-center uppercase tracking-[0.15em] transition-all duration-300 hover:scale-105 focus:outline-none"
              style={{
                borderColor: "#dc143c",
                background: "rgba(220, 20, 60, 0.08)",
                boxShadow: "0 0 15px rgba(220, 20, 60, 0.2), inset 0 0 20px rgba(220, 20, 60, 0.05)",
              }}
            >
              <span
                className="relative z-10 text-sm font-semibold text-center"
                style={{
                  color: "#dc143c",
                  textShadow: "0 0 8px rgba(220, 20, 60, 0.8)",
                }}
              >
                Access as Agent
              </span>
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(180deg, rgba(220, 20, 60, 0.3) 0%, rgba(220, 20, 60, 0.1) 100%)",
                }}
              />
            </button>
          </div>

          {/* Corner decorations */}
          <div
            className="absolute left-2 top-4 h-12 w-12 border-l border-t"
            style={{ borderColor: "rgba(220, 20, 60, 0.3)" }}
          />
          <div
            className="absolute right-3 top-4 h-12 w-12 border-r border-t"
            style={{ borderColor: "rgba(220, 20, 60, 0.3)" }}
          />
          <div
            className="absolute -bottom-3 left-2 h-12 w-12 border-b border-l"
            style={{ borderColor: "rgba(220, 20, 60, 0.3)" }}
          />
          <div
            className="absolute -bottom-3 right-3 h-12 w-12 border-b border-r"
            style={{ borderColor: "rgba(220, 20, 60, 0.3)" }}
          />

          {/* CSS Animations */}
          <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
      `}</style>
        </div>
      )
      }
    </div>)
}
