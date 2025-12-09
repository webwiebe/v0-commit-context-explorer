"use client"

import type React from "react"
import Link from "next/link"
import { Terminal, Settings } from "lucide-react"
import { CommitInput } from "@/components/commit-input"

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
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Terminal className="h-6 w-6 text-primary" />
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
    </main>
  )
}
