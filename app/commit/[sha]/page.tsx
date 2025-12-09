"use client"

import { use } from "react"
import useSWR from "swr"
import { PageLayout } from "@/components/page-layout"
import { CommitContextDisplay } from "@/components/commit-context-display"
import { CopyLinkButton } from "@/components/copy-link-button"
import { AlertCircle } from "lucide-react"
import type { CommitContext } from "@/lib/types"
import { useSearchParams } from "next/navigation"

const DEFAULT_REPO = "frasers-group/ec-fx-components"

const fetcher = async (url: string): Promise<CommitContext> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch commit context")
  }
  return res.json()
}

export default function CommitPage({ params }: { params: Promise<{ sha: string }> }) {
  const { sha } = use(params)
  const searchParams = useSearchParams()
  const repo = searchParams.get("repo") || DEFAULT_REPO

  const { data, error, isLoading } = useSWR<CommitContext>(
    sha ? `/api/commit/${sha}?repo=${encodeURIComponent(repo)}` : null,
    fetcher
  )

  return (
    <PageLayout
      isLoading={isLoading}
      initialMode="single"
      initialSha={sha}
      initialRepo={repo}
    >
      {/* Divider */}
      <div className="border-t border-border mb-8" />

      {/* Copy Link */}
      <div className="flex justify-end mb-4">
        <CopyLinkButton />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Fetching commit context...</span>
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
      {data && !isLoading && <CommitContextDisplay context={data} />}
    </PageLayout>
  )
}
