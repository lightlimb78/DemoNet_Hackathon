"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

let globalSocket: Socket | null = null

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(BACKEND_URL, {
        transports: ["websocket"],
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      })
    }
    socketRef.current = globalSocket
    return () => {}
  }, [])

  const emit = useCallback(<T>(event: string, data?: unknown, cb?: (res: T) => void) => {
    if (!socketRef.current) return
    if (cb) socketRef.current.emit(event, data, cb)
    else socketRef.current.emit(event, data)
  }, [])

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler)
    return () => { socketRef.current?.off(event, handler) }
  }, [])

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler)
  }, [])

  return { socket: socketRef.current, emit, on, off }
}
