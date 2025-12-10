"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
]

const TIMEOUT_MS = 2000

interface UseKonamiCodeOptions {
  onActivate?: () => void
}

export function useKonamiCode(options: UseKonamiCodeOptions = {}) {
  const [isActivated, setIsActivated] = useState(false)
  const sequenceIndex = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetSequence = useCallback(() => {
    sequenceIndex.current = 0
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const deactivate = useCallback(() => {
    setIsActivated(false)
    resetSequence()
  }, [resetSequence])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const expectedKey = KONAMI_SEQUENCE[sequenceIndex.current]
      const pressedKey = event.code

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (pressedKey === expectedKey) {
        sequenceIndex.current++

        // Check if sequence is complete
        if (sequenceIndex.current === KONAMI_SEQUENCE.length) {
          setIsActivated(true)
          options.onActivate?.()
          resetSequence()
        } else {
          // Set timeout for next key
          timeoutRef.current = setTimeout(resetSequence, TIMEOUT_MS)
        }
      } else {
        // Wrong key - reset
        resetSequence()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [options, resetSequence])

  return { isActivated, deactivate }
}
