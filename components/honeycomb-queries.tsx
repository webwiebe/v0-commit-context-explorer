"use client"

import type { HoneycombQueryUrl } from "@/lib/types"
import { ContextCard } from "./context-card"
import { Button } from "@/components/ui/button"
import {
  Search,
  AlertTriangle,
  Activity,
  Gauge,
  ExternalLink,
  Waves,
} from "lucide-react"

interface HoneycombQueriesProps {
  queries: HoneycombQueryUrl[]
  componentName?: string
  deploymentTime?: string
}

const QUERY_ICONS: Record<string, React.ReactNode> = {
  errors: <AlertTriangle className="h-4 w-4" />,
  latency: <Activity className="h-4 w-4" />,
  throughput: <Gauge className="h-4 w-4" />,
  traces: <Waves className="h-4 w-4" />,
}

const QUERY_COLORS: Record<string, string> = {
  errors: "text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10",
  latency: "text-yellow-400 hover:text-yellow-300 border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10",
  throughput: "text-blue-400 hover:text-blue-300 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10",
  traces: "text-purple-400 hover:text-purple-300 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10",
}

export function HoneycombQueries({ queries, componentName, deploymentTime }: HoneycombQueriesProps) {
  if (queries.length === 0) {
    return null
  }

  return (
    <ContextCard
      title="Honeycomb Queries"
      icon={<Search className="h-4 w-4" />}
    >
      <div className="space-y-3">
        {componentName && (
          <p className="text-xs text-muted-foreground">
            Observability queries for <span className="font-medium text-foreground">{componentName}</span>
            {deploymentTime && (
              <span> starting from deployment time</span>
            )}
          </p>
        )}

        <div className="grid gap-2">
          {queries.map((query) => (
            <a
              key={query.type}
              href={query.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className={`w-full justify-between h-auto py-2.5 px-3 ${QUERY_COLORS[query.type] || ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {QUERY_ICONS[query.type] || <Search className="h-4 w-4" />}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{query.label}</div>
                    <div className="text-xs opacity-70">{query.description}</div>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
              </Button>
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/70 pt-1">
          Queries are pre-filtered to 1 hour post-deployment window
        </p>
      </div>
    </ContextCard>
  )
}

interface HoneycombQueriesCompactProps {
  queries: HoneycombQueryUrl[]
}

export function HoneycombQueriesCompact({ queries }: HoneycombQueriesCompactProps) {
  if (queries.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {queries.map((query) => (
        <a
          key={query.type}
          href={query.url}
          target="_blank"
          rel="noopener noreferrer"
          title={query.description}
        >
          <Button
            variant="outline"
            size="sm"
            className={`h-7 px-2.5 text-xs gap-1.5 ${QUERY_COLORS[query.type] || ""}`}
          >
            {QUERY_ICONS[query.type] || <Search className="h-3 w-3" />}
            <span>{query.label.replace("View ", "")}</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
          </Button>
        </a>
      ))}
    </div>
  )
}
