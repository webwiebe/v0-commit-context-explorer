import { cn } from "@/lib/utils"
import { Ticket, ExternalLink } from "lucide-react"

interface TicketBadgeProps {
  ticket: string
  className?: string
  size?: "default" | "sm"
}

const JIRA_BASE_URL = "https://sportsdirect.atlassian.net/browse"

export function TicketBadge({ ticket, className, size = "default" }: TicketBadgeProps) {
  const jiraUrl = `${JIRA_BASE_URL}/${ticket}`

  return (
    <a
      href={jiraUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded font-mono transition-colors",
        "bg-primary/10 text-primary border border-primary/30",
        "hover:bg-primary/20 hover:border-primary/50",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <Ticket className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {ticket}
      <ExternalLink className={size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"} />
    </a>
  )
}
