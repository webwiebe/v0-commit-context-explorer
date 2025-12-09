"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcutHandlers {
  onFocusSearch?: () => void
  onOpenCommandPalette?: () => void
  onShowHelp?: () => void
  onEscape?: () => void
}

function isInputElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function useKeyboardShortcuts({
  onFocusSearch,
  onOpenCommandPalette,
  onShowHelp,
  onEscape,
}: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isInInput = isInputElement(event.target)

      // Cmd/Ctrl+K: Open command palette (works anywhere)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        onOpenCommandPalette?.()
        return
      }

      // Escape: Close/clear current view
      if (event.key === "Escape") {
        onEscape?.()
        return
      }

      // Don't handle these shortcuts when in input fields
      if (isInInput) {
        return
      }

      // /: Focus search input
      if (event.key === "/") {
        event.preventDefault()
        onFocusSearch?.()
        return
      }

      // ?: Show keyboard shortcuts help
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault()
        onShowHelp?.()
        return
      }
    },
    [onFocusSearch, onOpenCommandPalette, onShowHelp, onEscape]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}
