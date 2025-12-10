"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"

interface KonamiEffectProps {
  isActive: boolean
  onComplete: () => void
  duration?: number
}

interface MatrixColumn {
  id: number
  x: number
  chars: string[]
  speed: number
  delay: number
}

// Git-themed characters for the Matrix rain
const GIT_CHARS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "git",
  "sha",
  "PR",
  "#",
  "->",
  "|",
  "*",
  "+",
  "-",
  "~",
]

function generateRandomSha(): string {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

function generateColumnChars(): string[] {
  const length = 15 + Math.floor(Math.random() * 10)
  return Array.from({ length }, () => {
    const rand = Math.random()
    if (rand < 0.3) {
      return generateRandomSha()
    }
    return GIT_CHARS[Math.floor(Math.random() * GIT_CHARS.length)]
  })
}

export function KonamiEffect({ isActive, onComplete, duration = 5000 }: KonamiEffectProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isFading, setIsFading] = useState(false)

  // Generate columns once when effect becomes active
  const columns = useMemo<MatrixColumn[]>(() => {
    if (!isActive) return []
    const columnCount = Math.floor(window.innerWidth / 30)
    return Array.from({ length: columnCount }, (_, i) => ({
      id: i,
      x: (i / columnCount) * 100,
      chars: generateColumnChars(),
      speed: 3 + Math.random() * 4,
      delay: Math.random() * 2,
    }))
  }, [isActive])

  const startEffect = useCallback(() => {
    setIsVisible(true)
    setIsFading(false)
  }, [])

  const endEffect = useCallback(() => {
    setIsFading(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsFading(false)
      onComplete()
    }, 500)
  }, [onComplete])

  useEffect(() => {
    if (isActive) {
      startEffect()
      const timer = setTimeout(endEffect, duration)
      return () => clearTimeout(timer)
    }
  }, [isActive, duration, startEffect, endEffect])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 overflow-hidden pointer-events-none",
        "transition-opacity duration-500",
        isFading ? "opacity-0" : "opacity-100",
      )}
      aria-hidden="true"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/80" />

      {/* CRT scanlines overlay */}
      <div className="absolute inset-0 crt-scanlines" />

      {/* Matrix rain columns */}
      <div className="absolute inset-0">
        {columns.map((column) => (
          <div
            key={column.id}
            className="absolute top-0 matrix-column"
            style={{
              left: `${column.x}%`,
              animationDuration: `${column.speed}s`,
              animationDelay: `${column.delay}s`,
            }}
          >
            {column.chars.map((char, charIndex) => (
              <div
                key={charIndex}
                className={cn(
                  "font-mono text-sm whitespace-nowrap",
                  charIndex === 0 ? "text-white" : "text-primary",
                  charIndex > 0 && charIndex < 3 && "opacity-90",
                  charIndex >= 3 && charIndex < 6 && "opacity-70",
                  charIndex >= 6 && "opacity-40",
                )}
              >
                {char}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Center message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center konami-message">
          <div className="text-4xl font-bold text-primary mb-2 font-mono tracking-wider">KONAMI CODE ACTIVATED</div>
          <div className="text-lg text-primary/70 font-mono">↑↑↓↓←→←→BA</div>
        </div>
      </div>
    </div>
  )
}
