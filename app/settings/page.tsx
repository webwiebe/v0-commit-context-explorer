"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { IntegrationCard } from "@/components/integration-card"
import type { IntegrationConfig } from "@/lib/types"
import { Settings, ArrowLeft, Github, Bug, Ticket, Activity, AlertCircle } from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch settings")
  return res.json()
}

const integrationIcons: Record<string, React.ReactNode> = {
  github: <Github className="h-5 w-5" />,
  sentry: <Bug className="h-5 w-5" />,
  jira: <Ticket className="h-5 w-5" />,
  honeycomb: <Activity className="h-5 w-5" />,
}

const integrationDocs: Record<string, string> = {
  github:
    "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
  sentry: "https://docs.sentry.io/api/auth/",
  jira: "https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
  honeycomb: "https://docs.honeycomb.io/get-started/configure/environments/manage-api-keys/",
}

const integrationEnvVars: Record<string, string[]> = {
  github: ["GITHUB_TOKEN"],
  sentry: ["SENTRY_AUTH_TOKEN", "SENTRY_ORG"],
  jira: ["JIRA_API_TOKEN", "JIRA_BASE_URL", "JIRA_EMAIL"],
  honeycomb: ["HONEYCOMB_API_KEY"],
}

export default function SettingsPage() {
  const { data, error, isLoading } = useSWR<{ integrations: IntegrationConfig[] }>("/api/settings", fetcher)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const connectedCount = data?.integrations.filter((i) => i.status === "connected").length ?? 0
  const totalCount = data?.integrations.length ?? 0

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 rounded-lg border border-border bg-secondary hover:border-cyan hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Configure integrations and API credentials</p>
            </div>
          </div>
        </div>

        {/* Integration status summary */}
        {data && (
          <div className="mb-6 p-4 rounded-lg bg-secondary border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Integration Status</span>
              <span className="text-sm font-medium text-foreground">
                {connectedCount} of {totalCount} connected
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${(connectedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading integrations...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-error/10 border border-error/30 text-error">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Failed to load integration settings</p>
          </div>
        )}

        {/* Integrations list */}
        {data && (
          <div className="space-y-4">
            {data.integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                icon={integrationIcons[integration.id]}
                docsUrl={integrationDocs[integration.id]}
                envVars={integrationEnvVars[integration.id]}
              />
            ))}
          </div>
        )}

        {/* Help section */}
        <div className="mt-8 p-4 rounded-lg bg-secondary/50 border border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">Configuration Guide</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Integrations are configured via environment variables. Create a{" "}
            <code className="px-1.5 py-0.5 bg-muted rounded text-cyan text-xs font-mono">.env.local</code> file in your
            project root:
          </p>
          <pre className="p-3 bg-background rounded-md border border-border text-xs font-mono text-muted-foreground overflow-x-auto">
            {`# GitHub (required for basic functionality)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Sentry (Phase 2 - error correlation)
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxx
SENTRY_ORG=your-org-slug

# Jira (Phase 3 - ticket enrichment)
JIRA_API_TOKEN=xxxxxxxxxxxxxxxxxxxxx
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com

# Honeycomb (Phase 4 - observability)
HONEYCOMB_API_KEY=xxxxxxxxxxxxxxxxxxxxx`}
          </pre>
        </div>
      </div>
    </main>
  )
}
