import type React from "react"
import { cn } from "@/lib/utils"

interface ContextCardProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ContextCard({ title, icon, children, className }: ContextCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        {icon}
        <h3 className="text-xs font-medium uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
