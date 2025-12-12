"use client"

import type { ReleaseHealthMetrics } from "@/lib/types"
import { ContextCard } from "./context-card"
import { SparklineChart } from "./sparkline-chart"
import {
  Activity,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ReleaseHealthDisplayProps {
  health: ReleaseHealthMetrics
}

function getHealthColor(rate: number): string {
  if (rate >= 99) return "oklch(0.7 0.18 145)" // green
  if (rate >= 95) return "oklch(0.75 0.16 70)" // yellow
  return "oklch(0.55 0.22 25)" // red
}

function getHealthStatus(rate: number): { label: string; icon: typeof CheckCircle; className: string } {
  if (rate >= 99) {
    return {
      label: "Excellent",
      icon: CheckCircle,
      className: "text-green-400 bg-green-500/20 border-green-500/30",
    }
  }
  if (rate >= 95) {
    return {
      label: "Degraded",
      icon: AlertTriangle,
      className: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
    }
  }
  return {
    label: "Critical",
    icon: XCircle,
    className: "text-red-400 bg-red-500/20 border-red-500/30",
  }
}

function CircularProgress({ value, size = 160, strokeWidth = 12 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = getHealthColor(value)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {value.toFixed(1)}%
        </span>
        <span className="text-xs text-muted-foreground mt-1">Crash-Free</span>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  className,
}: {
  label: string
  value: string | number
  subValue?: string
  icon: typeof Activity
  trend?: "up" | "down" | "neutral"
  className?: string
}) {
  return (
    <div className={cn("p-4 rounded-lg bg-secondary/50 border border-border", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        {trend && (
          <div
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              trend === "up" && "text-green-400 bg-green-500/20",
              trend === "down" && "text-red-400 bg-red-500/20",
              trend === "neutral" && "text-muted-foreground bg-secondary"
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"}
          </div>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
        {subValue && (
          <span className="text-sm text-muted-foreground ml-1">{subValue}</span>
        )}
      </div>
    </div>
  )
}

export function ReleaseHealthDisplay({ health }: ReleaseHealthDisplayProps) {
  const {
    release,
    environment,
    crashFreeSessionRate,
    crashFreeUserRate,
    adoptionRate,
    totalSessions,
    totalUsers,
    crashedSessions,
    unhandledErrors,
    timeSeries,
  } = health

  const status = getHealthStatus(crashFreeSessionRate)
  const StatusIcon = status.icon

  // Format large numbers
  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
  }

  // Format interval labels for chart tooltip (last few hours)
  const chartLabels = timeSeries.intervals.map((interval) => {
    try {
      return format(new Date(interval), "HH:mm")
    } catch {
      return interval
    }
  })

  return (
    <div className="space-y-4">
      {/* Release Header Card */}
      <ContextCard title="Release Health" icon={<Shield className="h-4 w-4" />}>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress value={crashFreeSessionRate} />
          </div>

          {/* Release Info & Status */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-sm text-primary truncate max-w-[200px]" title={release}>
                  {release.length > 20 ? `${release.substring(0, 20)}...` : release}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                  {environment}
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-medium",
                    status.className
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Users:</span>
                <span className="font-medium text-foreground">{formatNumber(totalUsers)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sessions:</span>
                <span className="font-medium text-foreground">{formatNumber(totalSessions)}</span>
              </div>
            </div>
          </div>
        </div>
      </ContextCard>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Adoption"
          value={`${adoptionRate.toFixed(1)}%`}
          subValue="of users"
          icon={TrendingUp}
        />
        <MetricCard
          label="User Health"
          value={`${crashFreeUserRate.toFixed(1)}%`}
          subValue="crash-free"
          icon={Users}
        />
        <MetricCard
          label="Crashes"
          value={formatNumber(crashedSessions)}
          subValue="sessions"
          icon={Zap}
          className={crashedSessions > 0 ? "border-red-500/30" : ""}
        />
        <MetricCard
          label="Unhandled"
          value={unhandledErrors}
          subValue="errors"
          icon={AlertTriangle}
          className={unhandledErrors > 0 ? "border-yellow-500/30" : ""}
        />
      </div>

      {/* Time Series Chart */}
      {timeSeries.sessions.length > 0 && (
        <ContextCard title="24h Health Trend" icon={<BarChart3 className="h-4 w-4" />}>
          <div className="space-y-4">
            {/* Crash-Free Rate Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Crash-Free Rate</span>
                <span className="text-xs font-mono text-primary">
                  {timeSeries.crashFreeSessions.length > 0
                    ? `${timeSeries.crashFreeSessions[timeSeries.crashFreeSessions.length - 1].toFixed(1)}%`
                    : "–"}
                </span>
              </div>
              <SparklineChart
                data={timeSeries.crashFreeSessions}
                labels={chartLabels}
                width={500}
                height={80}
                color={getHealthColor(crashFreeSessionRate)}
                gradientFrom={`${getHealthColor(crashFreeSessionRate).replace(")", " / 0.3)")}`}
                gradientTo={`${getHealthColor(crashFreeSessionRate).replace(")", " / 0)")}`}
                showLastDot
                minY={90}
                maxY={100}
                className="w-full"
              />
            </div>

            {/* Sessions Volume Chart */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Session Volume</span>
                <span className="text-xs font-mono text-primary">
                  {timeSeries.sessions.length > 0
                    ? formatNumber(timeSeries.sessions[timeSeries.sessions.length - 1])
                    : "–"}
                </span>
              </div>
              <SparklineChart
                data={timeSeries.sessions}
                labels={chartLabels}
                width={500}
                height={50}
                color="oklch(0.6 0.12 280)"
                gradientFrom="oklch(0.6 0.12 280 / 0.2)"
                gradientTo="oklch(0.6 0.12 280 / 0)"
                showLastDot
                className="w-full"
              />
            </div>

            {/* Time axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>{chartLabels[0] || "24h ago"}</span>
              <span>{chartLabels[Math.floor(chartLabels.length / 2)] || ""}</span>
              <span>{chartLabels[chartLabels.length - 1] || "Now"}</span>
            </div>
          </div>
        </ContextCard>
      )}
    </div>
  )
}
