"use client"

import { use } from "react"
import useSWR from "swr"
import { PageLayout } from "@/components/page-layout"
import { ReleaseHealthDisplay } from "@/components/release-health-display"
import { CopyLinkButton } from "@/components/copy-link-button"
import { AlertCircle } from "lucide-react"
import type { ReleaseHealthMetrics } from "@/lib/types"

const fetcher = async (url: string): Promise<ReleaseHealthMetrics> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch release health")
  }
  return res.json()
}

export default function HealthPage({ params }: { params: Promise<{ release: string }> }) {
  const { release } = use(params)
  const decodedRelease = decodeURIComponent(release)

  const { data, error, isLoading } = useSWR<ReleaseHealthMetrics>(
    release ? `/api/sentry/release-health?release=${encodeURIComponent(decodedRelease)}` : null,
    fetcher
  )

  return (
    <PageLayout
      isLoading={isLoading}
      initialMode="health"
      initialRelease={decodedRelease}
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
            <span>Fetching release health...</span>
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
      {data && !isLoading && <ReleaseHealthDisplay health={data} />}
    </PageLayout>
  )
}
