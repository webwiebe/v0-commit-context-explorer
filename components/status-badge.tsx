import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"

type Status = "success" | "failure" | "in_progress" | "queued" | "pending"

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<
  Status,
  {
    icon: typeof CheckCircle2
    label: string
    className: string
  }
> = {
  success: {
    icon: CheckCircle2,
    label: "Deployed",
    className: "text-success bg-success/10 border-success/30",
  },
  failure: {
    icon: XCircle,
    label: "Failed",
    className: "text-error bg-error/10 border-error/30",
  },
  in_progress: {
    icon: Loader2,
    label: "In Progress",
    className: "text-warning bg-warning/10 border-warning/30",
  },
  queued: {
    icon: Clock,
    label: "Queued",
    className: "text-muted-foreground bg-muted border-muted-foreground/30",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "text-muted-foreground bg-muted border-muted-foreground/30",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
        config.className,
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "in_progress" && "animate-spin")} />
      {config.label}
    </span>
  )
}
