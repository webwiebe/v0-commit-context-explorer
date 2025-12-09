"use client"

import type React from "react"
import { useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Terminal, Settings } from "lucide-react"
import { CommitInput, type CommitInputRef } from "@/components/commit-input"
import { KonamiEffect } from "@/components/konami-effect"
import { CommandPalette } from "@/components/command-palette"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { useKonamiCode } from "@/hooks/use-konami-code"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface PageLayoutProps {
  children: React.ReactNode
  isLoading?: boolean
  initialMode?: "single" | "changelog" | "deployment"
  initialSha?: string
  initialFromSha?: string
  initialToSha?: string
  initialRepo?: string
}

export function PageLayout({
  children,
  isLoading = false,
  initialMode,
  initialSha,
  initialFromSha,
  initialToSha,
  initialRepo,
}: PageLayoutProps) {
  // Easter egg: Konami code detection
  const { isActivated: konamiActivated, deactivate: deactivateKonami } = useKonamiCode()

  // Keyboard navigation state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const commitInputRef = useRef<CommitInputRef>(null)

  const handleFocusSearch = useCallback(() => {
    commitInputRef.current?.focus()
  }, [])

  const handleOpenCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true)
  }, [])

  const handleShowHelp = useCallback(() => {
    setIsHelpOpen(true)
  }, [])

  const handleEscape = useCallback(() => {
    if (isCommandPaletteOpen) {
      setIsCommandPaletteOpen(false)
    } else if (isHelpOpen) {
      setIsHelpOpen(false)
    } else {
      commitInputRef.current?.blur()
    }
  }, [isCommandPaletteOpen, isHelpOpen])

  useKeyboardShortcuts({
    onFocusSearch: handleFocusSearch,
    onOpenCommandPalette: handleOpenCommandPalette,
    onShowHelp: handleShowHelp,
    onEscape: handleEscape,
  })

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Easter egg: Konami code effect */}
      <KonamiEffect isActive={konamiActivated} onComplete={deactivateKonami} />

      {/* Command Palette */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onShowHelp={handleShowHelp}
        onFocusSearch={handleFocusSearch}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />

      <div className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="glitch-container p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Terminal className="glitch-icon h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Commit Explorer</h1>
              <p className="text-sm text-muted-foreground">Explore commit context and generate changelogs</p>
            </div>
          </Link>
          <Link
            href="/settings"
            className="p-2 rounded-lg border border-border bg-secondary hover:border-cyan hover:bg-secondary/80 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <CommitInput
            ref={commitInputRef}
            isLoading={isLoading}
            initialMode={initialMode}
            initialSha={initialSha}
            initialFromSha={initialFromSha}
            initialToSha={initialToSha}
            initialRepo={initialRepo}
          />
        </div>

        {/* Content */}
        {children}
      </div>

      {/* Footer with keyboard hints */}
      <footer className="border-t border-border py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleFocusSearch}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <kbd className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 text-[10px] bg-secondary border border-border rounded">
              /
            </kbd>
            <span>search</span>
          </button>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={handleOpenCommandPalette}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <kbd className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 text-[10px] bg-secondary border border-border rounded">
              ⌘K
            </kbd>
            <span>palette</span>
          </button>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={handleShowHelp}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <kbd className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 text-[10px] bg-secondary border border-border rounded">
              ?
            </kbd>
            <span>shortcuts</span>
          </button>
        </div>
      </footer>
    </main>
  )
}
