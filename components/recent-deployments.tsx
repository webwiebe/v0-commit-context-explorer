"use client"

import useSWR from "swr"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Rocket, User, Clock, AlertCircle, Loader2 } from "lucide-react"
import type { RecentDeployment } from "@/lib/types"
import { AuthorHover } from "./author-hover"

interface RecentDeploymentsProps {
  repo: string
}

interface ApiResponse {
  deployments: RecentDeployment[]
  error?: string
}

const fetcher = async (url: string): Promise<ApiResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch recent deployments")
  }
  return res.json()
}

export function RecentDeployments({ repo }: RecentDeploymentsProps) {
  const router = useRouter()
  const { data, error, isLoading } = useSWR<ApiResponse>(
    repo ? `/api/mach-config/recent?repo=${encodeURIComponent(repo)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const handleClick = (sha: string) => {
    router.push(`/deployment/${sha}?repo=${encodeURIComponent(repo)}`)
  }

  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-lg border border-border bg-secondary/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading recent deployments...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-4 p-4 rounded-lg border border-error/30 bg-error/10">
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load recent deployments</span>
        </div>
      </div>
    )
  }

  if (!data?.deployments?.length) {
    return (
      <div className="mt-4 p-4 rounded-lg border border-border bg-secondary/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Rocket className="h-4 w-4" />
          <span>No recent mach-config deployments found</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Recent Deployments</span>
        <span className="text-xs text-muted-foreground">({data.deployments.length})</span>
      </div>
      <div className="space-y-2">
        {data.deployments.map((deployment) => (
          <button
            key={deployment.sha}
            type="button"
            onClick={() => handleClick(deployment.sha)}
            className="w-full text-left p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-primary group-hover:text-cyan transition-colors">
                    {deployment.shortSha}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {deployment.environments.map((env) => (
                      <span
                        key={env}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider"
                      >
                        {env}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground truncate" title={deployment.message}>
                  {deployment.message}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <AuthorHover username={deployment.author}>{deployment.author}</AuthorHover>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(deployment.date), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-primary">View &rarr;</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
