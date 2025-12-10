"use client"

import { use } from "react"
import useSWR from "swr"
import { PageLayout } from "@/components/page-layout"
import { ChangelogDisplay } from "@/components/changelog-display"
import { CopyLinkButton } from "@/components/copy-link-button"
import { SnarkyLoader } from "@/components/snarky-loader"
import { AlertCircle } from "lucide-react"
import type { ChangelogContext } from "@/lib/types"
import { useSearchParams } from "next/navigation"

const DEFAULT_REPO = "frasers-group/ec-fx-components"

const fetcher = async (url: string): Promise<ChangelogContext> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to generate changelog")
  }
  return res.json()
}

function parseRange(range: string): { from: string; to: string } | null {
  // Handle URL-encoded range (from..to becomes from..to after decoding)
  const decoded = decodeURIComponent(range)
  const parts = decoded.split("..")
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { from: parts[0], to: parts[1] }
  }
  return null
}

export default function ChangelogPage({ params }: { params: Promise<{ range: string }> }) {
  const { range } = use(params)
  const searchParams = useSearchParams()
  const repo = searchParams.get("repo") || DEFAULT_REPO

  const parsed = parseRange(range)

  const { data, error, isLoading } = useSWR<ChangelogContext>(
    parsed ? `/api/changelog?repo=${encodeURIComponent(repo)}&from=${parsed.from}&to=${parsed.to}` : null,
    fetcher,
  )

  // Invalid range format
  if (!parsed) {
    return (
      <PageLayout initialMode="changelog" initialRepo={repo}>
        <div className="border-t border-border mb-8" />
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            Invalid changelog range format. Expected format: <code className="font-mono">from..to</code> (e.g.,{" "}
            <code className="font-mono">abc1234..def5678</code>)
          </p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      isLoading={isLoading}
      initialMode="changelog"
      initialFromSha={parsed.from}
      initialToSha={parsed.to}
      initialRepo={repo}
    >
      {/* Divider */}
      <div className="border-t border-border mb-8" />

      {/* Copy Link */}
      <div className="flex justify-end mb-4">
        <CopyLinkButton />
      </div>

      {/* Loading State */}
      {isLoading && <SnarkyLoader />}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Results */}
      {data && !isLoading && <ChangelogDisplay changelog={data} />}
    </PageLayout>
  )
}
