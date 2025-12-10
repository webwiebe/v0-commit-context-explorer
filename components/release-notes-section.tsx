"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  Briefcase,
  Clock,
  Code,
  ExternalLink,
  FileCode,
  Loader2,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Ticket,
} from "lucide-react"

interface JiraTicket {
  key: string
  summary?: string
  status?: string
  type?: string
  priority?: string
  assignee?: string | null
  description?: string | null
  labels?: string[]
  url: string
  error?: string
}

interface JiraStatus {
  configured: boolean
  connectionFailed: boolean
  failureReason?: string
  retryIn?: number
}

interface ReleaseSummaries {
  business: string
  developer: string
  devops: string
}

interface ReleaseResult {
  summaries: ReleaseSummaries
  commit: {
    sha?: string
    message?: string
    author?: any
    stats?: { additions: number; deletions: number; total: number }
    files?: any[]
    tickets?: string[]
    commits?: any[]
  }
  ticketDetails?: JiraTicket[]
  jiraStatus?: JiraStatus
  cached?: boolean
}

interface ReleaseNotesSectionProps {
  repo: string
  headRef: string
  baseRef?: string
  componentPath?: string
  environment?: string
  tickets?: string[]
}

const jiraBaseUrl = "https://sportsdirect.atlassian.net/browse"

const statusColor = (status?: string) => {
  const value = status?.toLowerCase() || ""
  if (value.includes("done") || value.includes("closed") || value.includes("resolved")) {
    return "text-green-600 dark:text-green-400"
  }
  if (value.includes("progress") || value.includes("review")) {
    return "text-blue-600 dark:text-blue-400"
  }
  if (value.includes("todo") || value.includes("open") || value.includes("backlog")) {
    return "text-muted-foreground"
  }
  return "text-foreground"
}

const renderMarkdown = (text?: string) => {
  if (!text) return ""
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h2>')
    .replace(/^\* (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/---/g, '<hr class="my-4 border-border" />')
    .replace(
      /(?<!\[)(?<!"\/browse\/)(PX-\d{5,})(?!\])/g,
      `<a href="${jiraBaseUrl}/$1" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline">$1</a>`,
    )
}

export function ReleaseNotesSection({
  repo,
  headRef,
  baseRef,
  componentPath,
  environment,
  tickets,
}: ReleaseNotesSectionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReleaseResult | null>(null)

  const handleGenerate = async () => {
    if (!repo || !headRef) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: repo.trim(),
          sha: headRef.trim(),
          baseRef: baseRef?.trim() || undefined,
          componentPath: componentPath?.trim() || undefined,
          environment,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate release notes")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card/80">
      <CardHeader className="space-y-1 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-primary" />
            Release Notes
            {environment && (
              <Badge variant="secondary" className="text-xs">
                {environment}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {componentPath ? `${componentPath} ·` : null} {baseRef ? `${baseRef} → ` : null}
            {headRef}
          </CardDescription>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {result ? "Regenerate" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {!result && !loading && (
          <p className="text-sm text-muted-foreground">
            Generate tailored release notes for this component with business, developer, DevOps, and ticket views.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating release notes...</span>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {result.cached && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                Loaded from cache
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-md bg-secondary/40 border border-border px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Plus className="h-4 w-4 text-green-500" />
                  Additions
                </div>
                <span className="text-lg font-semibold text-green-500">
                  {result.commit.stats?.additions?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/40 border border-border px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Minus className="h-4 w-4 text-red-500" />
                  Deletions
                </div>
                <span className="text-lg font-semibold text-red-500">
                  {result.commit.stats?.deletions?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/40 border border-border px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileCode className="h-4 w-4 text-primary" />
                  Files
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {result.commit.files?.length || result.commit.stats?.total || 0}
                </span>
              </div>
            </div>

            <Tabs defaultValue="tickets" className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-3">
                <TabsTrigger value="tickets" className="gap-2 text-xs sm:text-sm">
                  <Ticket className="h-4 w-4 hidden sm:block" />
                  Tickets
                </TabsTrigger>
                <TabsTrigger value="business" className="gap-2 text-xs sm:text-sm">
                  <Briefcase className="h-4 w-4 hidden sm:block" />
                  Business
                </TabsTrigger>
                <TabsTrigger value="developer" className="gap-2 text-xs sm:text-sm">
                  <Code className="h-4 w-4 hidden sm:block" />
                  Developer
                </TabsTrigger>
                <TabsTrigger value="devops" className="gap-2 text-xs sm:text-sm">
                  <Shield className="h-4 w-4 hidden sm:block" />
                  DevOps
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tickets" className="mt-0 space-y-2">
                {result.ticketDetails && result.ticketDetails.length > 0 ? (
                  result.ticketDetails.map((ticket) => (
                    <a
                      key={ticket.key}
                      href={ticket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md border border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">
                              {ticket.key}
                            </Badge>
                            {ticket.status && (
                              <Badge variant="outline" className={`text-xs ${statusColor(ticket.status)}`}>
                                {ticket.status}
                              </Badge>
                            )}
                            {ticket.type && <Badge variant="secondary">{ticket.type}</Badge>}
                          </div>
                          {ticket.summary && (
                            <p className="text-sm text-foreground truncate" title={ticket.summary}>
                              {ticket.summary}
                            </p>
                          )}
                          {ticket.error && <p className="text-xs text-destructive">{ticket.error}</p>}
                          {ticket.assignee && (
                            <p className="text-xs text-muted-foreground">Assignee: {ticket.assignee}</p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </a>
                  ))
                ) : result.commit.tickets && result.commit.tickets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.commit.tickets.map((ticket) => (
                      <a
                        key={ticket}
                        href={`${jiraBaseUrl}/${ticket}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-mono hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                      >
                        {ticket}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                ) : tickets && tickets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tickets.map((ticket) => (
                      <a
                        key={ticket}
                        href={`${jiraBaseUrl}/${ticket}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-mono hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                      >
                        {ticket}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tickets detected for this change.</p>
                )}
              </TabsContent>

              <TabsContent value="business" className="mt-0">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div
                    className="whitespace-pre-wrap text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result.summaries.business) }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="developer" className="mt-0">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div
                    className="whitespace-pre-wrap text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result.summaries.developer) }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="devops" className="mt-0">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div
                    className="whitespace-pre-wrap text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result.summaries.devops) }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
