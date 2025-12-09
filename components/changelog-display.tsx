import type { ChangelogContext } from "@/lib/types"
import { ContextCard } from "./context-card"
import { TicketBadge } from "./ticket-badge"
import { AuthorHover } from "./author-hover"
import { GitCompare, GitCommit, User, Clock, ExternalLink, Tag, Users, Sparkles, FileCode } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"

interface ChangelogDisplayProps {
  changelog: ChangelogContext
}

export function ChangelogDisplay({ changelog }: ChangelogDisplayProps) {
  const { fromSha, toSha, commits, totalCommits, allTickets, authors, compareUrl, files, summary } = changelog

  return (
    <div className="space-y-4">
      {summary && (
        <ContextCard title="AI Summary" icon={<Sparkles className="h-4 w-4" />}>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-0 mb-2">{children}</h3>,
                h2: ({ children }) => <h4 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h4>,
                p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                ul: ({ children }) => (
                  <ul className="text-sm text-muted-foreground list-disc pl-4 mb-2 space-y-1">{children}</ul>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="text-primary font-medium">{children}</strong>,
                code: ({ children }) => (
                  <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-primary">{children}</code>
                ),
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        </ContextCard>
      )}

      {/* Summary Card */}
      <ContextCard title="Changelog Summary" icon={<GitCompare className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-muted-foreground">{fromSha}</span>
            <span className="text-primary">→</span>
            <span className="text-primary">{toSha}</span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GitCommit className="h-4 w-4" />
              <span>
                {totalCommits} commit{totalCommits !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {authors.length} contributor{authors.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileCode className="h-4 w-4" />
              <span>
                {files.length} file{files.length !== 1 ? "s" : ""} changed
              </span>
            </div>
            <a
              href={compareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              View on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {allTickets.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Related Tickets</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTickets.map((ticket) => (
                  <TicketBadge key={ticket} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {authors.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Contributors</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {authors.map((author) => (
                  <AuthorHover key={author} username={author}>
                    <span className="text-xs px-2 py-1 rounded-md bg-secondary border border-border font-mono">
                      {author}
                    </span>
                  </AuthorHover>
                ))}
              </div>
            </div>
          )}
        </div>
      </ContextCard>

      {files.length > 0 && (
        <ContextCard title="Files Changed" icon={<FileCode className="h-4 w-4" />}>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
            {files.map((file) => (
              <div
                key={file.filename}
                className="flex items-center justify-between gap-2 py-1.5 px-2 rounded text-xs font-mono hover:bg-secondary/50 transition-colors"
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
                    {file.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.additions > 0 && <span className="text-green-500">+{file.additions}</span>}
                  {file.deletions > 0 && <span className="text-red-500">-{file.deletions}</span>}
                </div>
              </div>
            ))}
          </div>
        </ContextCard>
      )}

      {/* Commits List */}
      <ContextCard title="Commits" icon={<GitCommit className="h-4 w-4" />}>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {commits.map((commit, index) => (
            <div
              key={commit.sha}
              className="flex items-start gap-3 p-3 rounded-md bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {index < commits.length - 1 && <div className="w-px h-full bg-border mt-1" />}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-foreground text-sm font-medium truncate" title={commit.message}>
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

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <AuthorHover username={commit.author}>{commit.author}</AuthorHover>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                  </span>
                </div>

                {commit.ticketRefs.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {commit.ticketRefs.map((ticket) => (
                      <TicketBadge key={ticket} ticket={ticket} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ContextCard>
    </div>
  )
}
