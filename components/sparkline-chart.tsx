"use client"

import { cn } from "@/lib/utils"

interface SparklineChartProps {
  data: number[]
  labels?: string[]
  height?: number
  width?: number
  color?: string
  gradientFrom?: string
  gradientTo?: string
  showArea?: boolean
  showDots?: boolean
  showLastDot?: boolean
  className?: string
  minY?: number
  maxY?: number
}

export function SparklineChart({
  data,
  labels,
  height = 60,
  width = 200,
  color = "oklch(0.85 0.18 190)",
  gradientFrom = "oklch(0.85 0.18 190 / 0.3)",
  gradientTo = "oklch(0.85 0.18 190 / 0)",
  showArea = true,
  showDots = false,
  showLastDot = true,
  className,
  minY,
  maxY,
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-muted-foreground text-xs", className)}
        style={{ width, height }}
      >
        No data
      </div>
    )
  }

  const padding = 4
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const dataMin = minY ?? Math.min(...data)
  const dataMax = maxY ?? Math.max(...data)
  const range = dataMax - dataMin || 1

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - dataMin) / range) * chartHeight
    return { x, y, value }
  })

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

  const gradientId = `sparkline-gradient-${Math.random().toString(36).substring(7)}`

  const lastPoint = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradientFrom} />
          <stop offset="100%" stopColor={gradientTo} />
        </linearGradient>
      </defs>

      {showArea && (
        <path d={areaPath} fill={`url(#${gradientId})`} />
      )}

      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {showDots &&
        points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="var(--background)" strokeWidth={1} />
        ))}

      {showLastDot && lastPoint && (
        <>
          <circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} />
          <circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill="none" stroke={color} strokeWidth={1} opacity={0.5}>
            <animate attributeName="r" from="4" to="10" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  )
}
