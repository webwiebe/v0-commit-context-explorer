"use client"

import type { MachConfigDeployment, HoneycombQueryUrl } from "@/lib/types"
import { ContextCard } from "./context-card"
import { TicketBadge } from "./ticket-badge"
import { AuthorHover } from "./author-hover"
import { HoneycombQueries, HoneycombQueriesCompact } from "./honeycomb-queries"
import {
  Rocket,
  GitCommit,
  User,
  Clock,
  ExternalLink,
  Tag,
  FileCode,
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"

interface DeploymentDisplayProps {
  deployment: MachConfigDeployment
}

interface HoneycombResponse {
  configured: boolean
  queries: HoneycombQueryUrl[]
  config?: {
    team: string
    dataset: string
    environment?: string
    isEU: boolean
  }
  error?: string
}

const honeycombFetcher = async (url: string): Promise<HoneycombResponse> => {
  const res = await fetch(url)
  return res.json()
}

function ComponentHoneycombQueries({
  componentName,
  deploymentDate
}: {
  componentName: string
  deploymentDate: string
}) {
  const { data } = useSWR<HoneycombResponse>(
    `/api/honeycomb?deploymentDate=${encodeURIComponent(deploymentDate)}&componentName=${encodeURIComponent(componentName)}`,
    honeycombFetcher
  )

  if (!data?.configured || data.queries.length === 0) {
    return null
  }

  return (
    <div className="pt-2">
      <HoneycombQueriesCompact queries={data.queries} />
    </div>
  )
}

function RiskBadge({ text }: { text: string }) {
  const lower = text.toLowerCase()
  if (lower.includes("low")) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        <CheckCircle className="h-3 w-3" />
        Low Risk
      </span>
    )
  }
  if (lower.includes("high")) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
        <AlertTriangle className="h-3 w-3" />
        High Risk
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
      <AlertCircle className="h-3 w-3" />
      Medium Risk
    </span>
  )
}

export function DeploymentDisplay({ deployment }: DeploymentDisplayProps) {
  const { commitSha, commitMessage, author, date, components } = deployment
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(
    new Set(components.map((c) => c.componentName)),
  )

  // Fetch Honeycomb queries for the deployment
  const { data: honeycombData } = useSWR<HoneycombResponse>(
    date ? `/api/honeycomb?deploymentDate=${encodeURIComponent(date)}` : null,
    honeycombFetcher
  )

  const toggleComponent = (name: string) => {
    setExpandedComponents((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  // Aggregate all tickets across all components
  const allTickets = [...new Set(components.flatMap((c) => c.changelog?.allTickets || []))]

  return (
    <div className="space-y-4">
      {/* Deployment Summary */}
      <ContextCard title="Deployment Summary" icon={<Rocket className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{commitMessage}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono text-primary">{commitSha}</span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <AuthorHover username={author}>{author}</AuthorHover>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(date), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCode className="h-4 w-4" />
                <span>
                  {components.length} component{components.length !== 1 ? "s" : ""} updated
                </span>
              </div>
              {allTickets.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>
                    {allTickets.length} ticket{allTickets.length !== 1 ? "s" : ""} referenced
                  </span>
                </div>
              )}
            </div>
          </div>

          {allTickets.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">All Related Tickets</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTickets.map((ticket) => (
                  <TicketBadge key={ticket} ticket={ticket} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ContextCard>

      {/* Honeycomb Observability Queries */}
      {honeycombData?.configured && honeycombData.queries.length > 0 && (
        <HoneycombQueries
          queries={honeycombData.queries}
          deploymentTime={date}
        />
      )}

      {/* Component Changes */}
      {components.map((component) => {
        const isExpanded = expandedComponents.has(component.componentName)
        const { changelog } = component

        return (
          <div
            key={`${component.componentName}-${component.environment}`}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
            {/* Component Header */}
            <Button
              variant="ghost"
              onClick={() => toggleComponent(component.componentName)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 rounded-none h-auto"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{component.componentName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                      {component.environment}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                    <span className="text-red-400">{component.fromVersion}</span>
                    <span className="text-primary">→</span>
                    <span className="text-green-400">{component.toVersion}</span>
                  </div>
                </div>
              </div>
              {changelog && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{changelog.totalCommits} commits</span>
                  <span>{changelog.files.length} files</span>
                </div>
              )}
            </Button>

            {/* Expanded Content */}
            {isExpanded && changelog && (
              <div className="border-t border-border p-4 space-y-4">
                {/* AI Summary */}
                {changelog.summary && (
                  <div className="rounded-md bg-secondary/50 border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">AI Analysis</span>
                      {changelog.summary.toLowerCase().includes("risk") && <RiskBadge text={changelog.summary} />}
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h3 className="text-sm font-semibold text-foreground mt-0 mb-2">{children}</h3>
                          ),
                          h2: ({ children }) => (
                            <h4 className="text-xs font-semibold text-foreground mt-3 mb-1">{children}</h4>
                          ),
                          p: ({ children }) => <p className="text-xs text-muted-foreground mb-2">{children}</p>,
                          ul: ({ children }) => (
                            <ul className="text-xs text-muted-foreground list-disc pl-4 mb-2 space-y-1">{children}</ul>
                          ),
                          li: ({ children }) => <li className="text-xs">{children}</li>,
                          strong: ({ children }) => <strong className="text-primary font-medium">{children}</strong>,
                          code: ({ children }) => (
                            <code className="text-xs bg-background px-1 py-0.5 rounded font-mono text-primary">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {changelog.summary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Component Honeycomb Queries */}
                <ComponentHoneycombQueries
                  componentName={component.componentName}
                  deploymentDate={date}
                />

                {/* Files Changed */}
                {changelog.files.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Files Changed</span>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {changelog.files.map((file) => (
                        <div
                          key={file.filename}
                          className="flex items-center justify-between gap-2 py-1 px-2 rounded text-xs font-mono hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                file.status === "added"
                                  ? "bg-green-500"
                                  : file.status === "removed"
                                    ? "bg-red-500"
                                    : file.status === "renamed"
                                      ? "bg-yellow-500"
                                      : "bg-blue-500"
                              }`}
                            />
                            <span className="truncate text-muted-foreground" title={file.filename}>
                              {file.filename.replace(component.componentPath + "/", "")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {file.additions > 0 && <span className="text-green-500">+{file.additions}</span>}
                            {file.deletions > 0 && <span className="text-red-500">-{file.deletions}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tickets */}
                {changelog.allTickets.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Related Tickets</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {changelog.allTickets.map((ticket) => (
                        <TicketBadge key={ticket} ticket={ticket} size="sm" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Commits */}
                {changelog.commits.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GitCommit className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Commits</span>
                      <a
                        href={changelog.compareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View diff
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {changelog.commits.slice(0, 10).map((commit) => (
                        <div
                          key={commit.sha}
                          className="flex items-start gap-2 p-2 rounded bg-secondary/30 border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-foreground truncate" title={commit.message}>
                                {commit.message}
                              </p>
                              <a
                                href={commit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs font-mono flex-shrink-0"
                              >
                                {commit.shortSha}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <AuthorHover username={commit.author}>{commit.author}</AuthorHover>
                              <span>·</span>
                              <span>{formatDistanceToNow(new Date(commit.date), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {changelog.commits.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          + {changelog.commits.length - 10} more commits
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
