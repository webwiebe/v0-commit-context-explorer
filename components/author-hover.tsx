"use client"

import { useState, useEffect, useCallback } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

interface MonkeyImageData {
  image: string
  mimeType: string
  scenario: string
}

interface AuthorHoverProps {
  username: string
  children: React.ReactNode
}

const CACHE_KEY_PREFIX = "monkey-engineer-"
const SESSION_REQUESTED_KEY = "monkey-requested-"

export function AuthorHover({ username, children }: AuthorHoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageData, setImageData] = useState<MonkeyImageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const cacheKey = `${CACHE_KEY_PREFIX}${username}`
  const sessionKey = `${SESSION_REQUESTED_KEY}${username}`

  const fetchMonkeyImage = useCallback(async () => {
    // Check if already requested this session (rate limiting)
    const alreadyRequested = sessionStorage.getItem(sessionKey)
    if (alreadyRequested && !imageData) {
      return
    }

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsedCache = JSON.parse(cached) as MonkeyImageData
        setImageData(parsedCache)
        return
      }
    } catch {
      // Ignore cache read errors
    }

    // Mark as requested this session
    sessionStorage.setItem(sessionKey, "true")
    setIsLoading(true)
    setHasError(false)

    try {
      const response = await fetch(`/api/easteregg/monkey?username=${encodeURIComponent(username)}`)

      if (!response.ok) {
        throw new Error("Failed to fetch")
      }

      const data = await response.json() as MonkeyImageData
      setImageData(data)

      // Cache in localStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data))
      } catch {
        // Ignore cache write errors (quota exceeded, etc.)
      }
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [username, cacheKey, sessionKey, imageData])

  useEffect(() => {
    if (isOpen && !imageData && !isLoading && !hasError) {
      fetchMonkeyImage()
    }
  }, [isOpen, imageData, isLoading, hasError, fetchMonkeyImage])

  // Don't render hover card if there was an error (fail silently)
  if (hasError) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={500} closeDelay={100} open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer hover:text-primary transition-colors">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-3" side="top">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Engineer Profile: <span className="font-mono text-primary">{username}</span>
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="w-full aspect-square rounded-md bg-secondary animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-secondary animate-pulse" />
            </div>
          ) : imageData ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URLs don't benefit from next/image optimization */}
              <img
                src={`data:${imageData.mimeType};base64,${imageData.image}`}
                alt={`Monkey engineer representing ${username}`}
                className="w-full aspect-square rounded-md object-cover border border-border"
              />
              <p className="text-xs text-muted-foreground italic">
                {imageData.scenario}
              </p>
            </div>
          ) : (
            <div className="w-full aspect-square rounded-md bg-secondary flex items-center justify-center">
              <span className="text-4xl">🐵</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
