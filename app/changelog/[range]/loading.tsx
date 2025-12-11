"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { LOADING_MESSAGES } from "@/lib/loading-messages"

export default function Loading() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    // Start with a random message
    setMessageIndex(Math.floor(Math.random() * LOADING_MESSAGES.length))

    // Rotate messages every 3 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-center max-w-md animate-pulse">
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  )
}
