import type { CommitContext } from "@/lib/types"
import { ContextCard } from "./context-card"
import { StatusBadge } from "./status-badge"
import { TicketBadge } from "./ticket-badge"
import { AuthorHover } from "./author-hover"
import { GitCommit, GitPullRequest, Rocket, User, Clock, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CommitContextDisplayProps {
  context: CommitContext
}

export function CommitContextDisplay({ context }: CommitContextDisplayProps) {
  const { commit, pr, deployment } = context

  return (
    <div className="space-y-4">
      {/* Commit Card */}
      <ContextCard title="Commit" icon={<GitCommit className="h-4 w-4" />}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="font-mono text-lg text-primary">{commit.sha}</p>
            <p className="text-foreground font-medium truncate" title={commit.message}>
              "{commit.message}"
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <AuthorHover username={commit.author}>{commit.author}</AuthorHover>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {commit.ticketRefs.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Refs:</span>
            <div className="flex flex-wrap gap-1.5">
              {commit.ticketRefs.map((ticket) => (
                <TicketBadge key={ticket} ticket={ticket} />
              ))}
            </div>
          </div>
        )}
      </ContextCard>

      {/* PR Card */}
      {pr && (
        <ContextCard title="Pull Request" icon={<GitPullRequest className="h-4 w-4" />}>
          <div className="space-y-1">
            <p className="font-mono text-primary">#{pr.number}</p>
            <p className="text-foreground font-medium">"{pr.title}"</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Merged by {pr.mergedBy}</span>
              <a
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                View PR
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </ContextCard>
      )}

      {/* Deployment Card */}
      {deployment && (
        <ContextCard title="Deployment" icon={<Rocket className="h-4 w-4" />}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={deployment.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {deployment.environment} • {formatDistanceToNow(new Date(deployment.completedAt), { addSuffix: true })}
              </p>
              <p className="text-sm font-mono text-muted-foreground">{deployment.workflowName}</p>
            </div>
            <a
              href={deployment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </ContextCard>
      )}

      {/* No PR/Deployment Info */}
      {!pr && !deployment && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No associated PR or deployment found for this commit.
        </div>
      )}
    </div>
  )
}
