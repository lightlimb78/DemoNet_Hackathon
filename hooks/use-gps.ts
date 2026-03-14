"use client"

import { useState, useEffect, useRef } from "react"

export interface GPSPosition {
  lat: number
  lng: number
  accuracy: number
}

export function useGPS(enabled: boolean, onPosition: (pos: GPSPosition) => void) {
  const [position, setPosition] = useState<GPSPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied">("prompt")
  const watchIdRef = useRef<number | null>(null)
  const onPositionRef = useRef(onPosition)
  onPositionRef.current = onPosition

  useEffect(() => {
    if (!enabled) return
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("GPS not supported on this device")
      return
    }

    const success = (pos: GeolocationPosition) => {
      const gpsPos: GPSPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }
      setPosition(gpsPos)
      setPermission("granted")
      setError(null)
      onPositionRef.current(gpsPos)
    }

    const fail = (err: GeolocationPositionError) => {
      if (err.code === 1) {
        setPermission("denied")
        setError("GPS permission denied")
      } else {
        setError("GPS signal lost")
      }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(success, fail, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 8000,
    })

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [enabled])

  return { position, error, permission }
}
