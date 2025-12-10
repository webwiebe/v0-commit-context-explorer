"use client"

import { useState, useEffect, useCallback } from "react"

// Fallback messages in case the API fails or is slow to respond initially
const FALLBACK_MESSAGES = [
  "Generating changelog... unlike your standups, this actually produces something useful",
  "Please hold while we pretend this is instant...",
  "Loading... much like your quarterly OKRs, this is 'in progress'",
  "Consulting the ancient scrolls of git history...",
  "Still faster than waiting for your PR approval",
]

interface SnarkyLoaderProps {
  intervalMs?: number
}

export function SnarkyLoader({ intervalMs = 4000 }: SnarkyLoaderProps) {
  const [message, setMessage] = useState(() =>
    FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]
  )
  const [isTransitioning, setIsTransitioning] = useState(false)

  const fetchSnark = useCallback(async () => {
    try {
      const res = await fetch("/api/snark")
      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          // Fade out, change message, fade in
          setIsTransitioning(true)
          setTimeout(() => {
            setMessage(data.message)
            setIsTransitioning(false)
          }, 200)
        }
      }
    } catch {
      // Silently fail and keep current message
    }
  }, [])

  useEffect(() => {
    // Fetch first message immediately
    fetchSnark()

    // Then fetch new messages at the interval
    const interval = setInterval(fetchSnark, intervalMs)

    return () => clearInterval(interval)
  }, [fetchSnark, intervalMs])

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3 max-w-md text-center">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span
          className={`text-muted-foreground text-sm transition-opacity duration-200 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {message}
        </span>
      </div>
    </div>
  )
}
