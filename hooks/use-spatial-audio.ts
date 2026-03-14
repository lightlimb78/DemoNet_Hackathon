"use client"

import { useRef, useCallback, useEffect } from "react"

export function useSpatialAudio() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  useEffect(() => {
    return () => { ctxRef.current?.close() }
  }, [])

  // Classic radar ping
  const playPing = useCallback((intensity = 1.0) => {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4)
      gain.gain.setValueAtTime(0.15 * intensity, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }, [getCtx])

  // Directional growl — bearing shifts L/R panner
  const playDirectionalAlert = useCallback((bearing: number, distanceMetres: number, intensity: number) => {
    try {
      const ctx = getCtx()
      const bufSize = ctx.sampleRate * 0.6
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3))
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer

      const panner = ctx.createPanner()
      panner.panningModel = "HRTF"
      panner.distanceModel = "inverse"
      // Convert bearing (0=N,90=E) to x/z coords
      const rad = (bearing - 90) * (Math.PI / 180)
      panner.setPosition(Math.cos(rad), 0, Math.sin(rad))

      const gain = ctx.createGain()
      const vol = Math.min(0.4, (0.4 * intensity) / 100)
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)

      const filter = ctx.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = 300 + (1 - intensity / 100) * 400

      source.connect(filter)
      filter.connect(panner)
      panner.connect(gain)
      gain.connect(ctx.destination)
      source.start()
    } catch {}
  }, [getCtx])

  // Sync scream — all phones hear this simultaneously
  const playEliminationScream = useCallback(() => {
    try {
      const ctx = getCtx()
      const duration = 1.2
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = "sawtooth"
      osc2.type = "square"
      osc1.frequency.setValueAtTime(220, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + duration)
      osc2.frequency.setValueAtTime(440, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.start(); osc2.start()
      osc1.stop(ctx.currentTime + duration)
      osc2.stop(ctx.currentTime + duration)
    } catch {}
  }, [getCtx])

  // Static burst for interference
  const playStaticBurst = useCallback((durationSecs = 0.3) => {
    try {
      const ctx = getCtx()
      const bufSize = ctx.sampleRate * durationSecs
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSecs)
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start()
    } catch {}
  }, [getCtx])

  // Unlock audio context on first user interaction
  const unlock = useCallback(() => { getCtx() }, [getCtx])

  return { playPing, playDirectionalAlert, playEliminationScream, playStaticBurst, unlock }
}
