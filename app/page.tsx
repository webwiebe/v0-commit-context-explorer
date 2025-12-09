"use client"

import { useState } from "react"
import useSWR from "swr"
import { CommitInput } from "@/components/commit-input"
import { CommitContextDisplay } from "@/components/commit-context-display"
import { ChangelogDisplay } from "@/components/changelog-display"
import { DeploymentDisplay } from "@/components/deployment-display"
import type { CommitContext, ChangelogContext, MachConfigDeployment } from "@/lib/types"
import Link from "next/link"
import { Terminal, AlertCircle, Settings } from "lucide-react"

const commitFetcher = async (url: string): Promise<CommitContext> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch commit context")
  }
  return res.json()
}

const changelogFetcher = async (url: string): Promise<ChangelogContext> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to generate changelog")
  }
  return res.json()
}

const deploymentFetcher = async (url: string): Promise<MachConfigDeployment> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to analyze deployment")
  }
  return res.json()
}

export default function HomePage() {
  const [commitParams, setCommitParams] = useState<{ sha: string; repo: string } | null>(null)
  const [changelogParams, setChangelogParams] = useState<{ from: string; to: string; repo: string } | null>(null)
  const [deploymentParams, setDeploymentParams] = useState<{ sha: string; repo: string } | null>(null)

  const {
    data: commitData,
    error: commitError,
    isLoading: commitLoading,
  } = useSWR<CommitContext>(
    commitParams ? `/api/commit/${commitParams.sha}?repo=${commitParams.repo}` : null,
    commitFetcher,
  )

  const {
    data: changelogData,
    error: changelogError,
    isLoading: changelogLoading,
  } = useSWR<ChangelogContext>(
    changelogParams
      ? `/api/changelog?repo=${changelogParams.repo}&from=${changelogParams.from}&to=${changelogParams.to}`
      : null,
    changelogFetcher,
  )

  const {
    data: deploymentData,
    error: deploymentError,
    isLoading: deploymentLoading,
  } = useSWR<MachConfigDeployment>(
    deploymentParams ? `/api/mach-config?repo=${deploymentParams.repo}&sha=${deploymentParams.sha}` : null,
    deploymentFetcher,
  )

  const handleSearch = (sha: string, repo: string) => {
    setChangelogParams(null)
    setDeploymentParams(null)
    setCommitParams({ sha, repo })
  }

  const handleChangelog = (from: string, to: string, repo: string) => {
    setCommitParams(null)
    setDeploymentParams(null)
    setChangelogParams({ from, to, repo })
  }

  const handleDeployment = (sha: string, repo: string) => {
    setCommitParams(null)
    setChangelogParams(null)
    setDeploymentParams({ sha, repo })
  }

  const isLoading = commitLoading || changelogLoading || deploymentLoading
  const error = commitError || changelogError || deploymentError
  const hasData = commitData || changelogData || deploymentData

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Terminal className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Commit Explorer</h1>
              <p className="text-sm text-muted-foreground">Explore commit context and generate changelogs</p>
            </div>
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-lg border border-border bg-secondary hover:border-cyan hover:bg-secondary/80 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Search Input - pass onDeployment */}
        <div className="mb-8">
          <CommitInput
            onSearch={handleSearch}
            onChangelog={handleChangelog}
            onDeployment={handleDeployment}
            isLoading={isLoading}
          />
        </div>

        {/* Divider */}
        {(hasData || isLoading || error) && <div className="border-t border-border mb-8" />}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>
                {deploymentLoading
                  ? "Analyzing deployment..."
                  : changelogLoading
                    ? "Generating changelog..."
                    : "Fetching commit context..."}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {/* Results */}
        {commitData && !isLoading && <CommitContextDisplay context={commitData} />}
        {changelogData && !isLoading && <ChangelogDisplay changelog={changelogData} />}
        {deploymentData && !isLoading && <DeploymentDisplay deployment={deploymentData} />}

        {/* Empty State */}
        {!commitParams && !changelogParams && !deploymentParams && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">
              Enter a commit SHA to explore its context, provide a range to generate a changelog, or analyze a
              mach-config deployment.
            </p>
            <p className="text-xs mt-2">Example: abc1234 → def5678</p>
          </div>
        )}
      </div>
    </main>
  )
}
