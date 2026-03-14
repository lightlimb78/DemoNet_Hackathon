"use client"

export function LightningBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.22]">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <polyline 
          points="580,0 560,130 600,130 510,380 590,380 440,750" 
          stroke="#ff1a2e" 
          strokeWidth="2.5" 
          fill="none" 
          opacity="0.8"
          style={{ animation: "lightningFlash 5s 0s infinite" }}
        />
        <polyline 
          points="750,0 740,90 770,90 710,260 755,260 660,520" 
          stroke="#dd0016" 
          strokeWidth="1.8" 
          fill="none" 
          opacity="0.6"
          style={{ animation: "lightningFlash 5s 1.8s infinite" }}
        />
        <polyline 
          points="350,0 370,110 340,110 400,300 355,300 430,580" 
          stroke="#ff1a2e" 
          strokeWidth="1.2" 
          fill="none" 
          opacity="0.4"
          style={{ animation: "lightningFlash 5s 3.2s infinite" }}
        />
      </svg>
    </div>
  )
}
