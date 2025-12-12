import type { ReleaseHealthMetrics, ReleaseHealthTimeSeries } from "./types"

const SENTRY_API = "https://sentry.io/api/0"

function getHeaders() {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (process.env.SENTRY_AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.SENTRY_AUTH_TOKEN}`
  }

  return headers
}

function getOrg(): string {
  return process.env.SENTRY_ORG || "frasers-group"
}

interface SessionStatsGroup {
  by: Record<string, string>
  totals: Record<string, number>
  series: Record<string, number[]>
}

interface SessionStatsResponse {
  groups: SessionStatsGroup[]
  start: string
  end: string
  intervals: string[]
}

/**
 * Fetches release health session statistics from Sentry
 */
export async function fetchReleaseHealth(
  release: string,
  project?: string,
  environment: string = "production",
): Promise<ReleaseHealthMetrics> {
  const org = getOrg()
  const params = new URLSearchParams({
    field: "sum(session)",
    field2: "count_unique(user)",
    statsPeriod: "24h",
    interval: "1h",
    groupBy: "session.status",
  })

  // Add release filter
  params.append("query", `release:${release}`)

  if (project) {
    params.append("project", project)
  }

  if (environment) {
    params.append("environment", environment)
  }

  // Fetch session stats grouped by status
  const sessionUrl = `${SENTRY_API}/organizations/${org}/sessions/?${params.toString()}`
  const sessionResponse = await fetch(sessionUrl, { headers: getHeaders() })

  if (!sessionResponse.ok) {
    const error = await sessionResponse.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to fetch Sentry session stats: ${sessionResponse.status}`)
  }

  const sessionData: SessionStatsResponse = await sessionResponse.json()

  // Parse the grouped results by session status
  let healthySessions = 0
  let crashedSessions = 0
  let erroredSessions = 0
  let abnormalSessions = 0
  let totalUsers = 0

  const crashedTimeSeries: number[] = []
  const _sessionsTimeSeries: number[] = [] // Reserved for future use

  for (const group of sessionData.groups) {
    const status = group.by["session.status"]
    const sessionCount = group.totals["sum(session)"] || 0
    const userCount = group.totals["count_unique(user)"] || 0

    totalUsers += userCount

    switch (status) {
      case "healthy":
        healthySessions = sessionCount
        break
      case "crashed":
        crashedSessions = sessionCount
        // Build crashed time series
        if (group.series["sum(session)"]) {
          crashedTimeSeries.push(...group.series["sum(session)"])
        }
        break
      case "errored":
        erroredSessions = sessionCount
        break
      case "abnormal":
        abnormalSessions = sessionCount
        break
    }
  }

  const totalSessions = healthySessions + crashedSessions + erroredSessions + abnormalSessions

  // Calculate crash-free rate
  const crashFreeSessionRate = totalSessions > 0 ? ((totalSessions - crashedSessions) / totalSessions) * 100 : 100

  // Fetch adoption rate (users on this release vs total users)
  const adoptionParams = new URLSearchParams({
    field: "count_unique(user)",
    statsPeriod: "24h",
  })

  if (project) {
    adoptionParams.append("project", project)
  }
  if (environment) {
    adoptionParams.append("environment", environment)
  }

  const totalUsersUrl = `${SENTRY_API}/organizations/${org}/sessions/?${adoptionParams.toString()}`
  const totalUsersResponse = await fetch(totalUsersUrl, { headers: getHeaders() })

  let adoptionRate = 0
  if (totalUsersResponse.ok) {
    const totalUsersData: SessionStatsResponse = await totalUsersResponse.json()
    const allUsers = totalUsersData.groups.reduce((sum, g) => sum + (g.totals["count_unique(user)"] || 0), 0)
    if (allUsers > 0) {
      adoptionRate = (totalUsers / allUsers) * 100
    }
  }

  // Fetch unhandled errors for this release
  const issuesParams = new URLSearchParams({
    query: `release:${release} is:unresolved error.unhandled:true`,
    statsPeriod: "24h",
  })

  if (project) {
    issuesParams.append("project", project)
  }
  if (environment) {
    issuesParams.append("environment", environment)
  }

  const issuesUrl = `${SENTRY_API}/organizations/${org}/issues/?${issuesParams.toString()}`
  const issuesResponse = await fetch(issuesUrl, { headers: getHeaders() })

  let unhandledErrors = 0
  if (issuesResponse.ok) {
    const issues = await issuesResponse.json()
    unhandledErrors = Array.isArray(issues) ? issues.length : 0
  }

  // Build time series data
  // Aggregate sessions per interval across all statuses
  const intervals = sessionData.intervals || []
  const sessionsPerInterval: number[] = new Array(intervals.length).fill(0)
  const crashedPerInterval: number[] = new Array(intervals.length).fill(0)

  for (const group of sessionData.groups) {
    const series = group.series["sum(session)"] || []
    const status = group.by["session.status"]

    series.forEach((value, i) => {
      sessionsPerInterval[i] = (sessionsPerInterval[i] || 0) + value
      if (status === "crashed") {
        crashedPerInterval[i] = value
      }
    })
  }

  // Calculate crash-free rate per interval
  const crashFreePerInterval = sessionsPerInterval.map((total, i) => {
    if (total === 0) return 100
    return ((total - crashedPerInterval[i]) / total) * 100
  })

  const timeSeries: ReleaseHealthTimeSeries = {
    intervals,
    crashFreeSessions: crashFreePerInterval,
    sessions: sessionsPerInterval,
    crashedSessions: crashedPerInterval,
  }

  // Calculate crash-free user rate
  const crashedUsers = sessionData.groups.find((g) => g.by["session.status"] === "crashed")?.totals[
    "count_unique(user)"
  ] || 0
  const crashFreeUserRate = totalUsers > 0 ? ((totalUsers - crashedUsers) / totalUsers) * 100 : 100

  return {
    release,
    environment,
    crashFreeSessionRate,
    crashFreeUserRate,
    adoptionRate,
    totalSessions,
    totalUsers,
    crashedSessions,
    erroredSessions,
    healthySessions,
    abnormalSessions,
    unhandledErrors,
    timeSeries,
  }
}

/**
 * Resolves a GitHub SHA to a Sentry release version
 * Sentry releases are typically formatted as: project@version or just version
 * For FrasersGroup, releases might be tagged as the commit SHA or a version string
 */
export async function resolveReleaseVersion(sha: string, project?: string): Promise<string | null> {
  const org = getOrg()

  // Try to find a release matching this SHA (partial match)
  const params = new URLSearchParams({
    query: sha.substring(0, 7),
  })

  if (project) {
    params.append("project", project)
  }

  const url = `${SENTRY_API}/organizations/${org}/releases/?${params.toString()}`
  const response = await fetch(url, { headers: getHeaders() })

  if (!response.ok) {
    return null
  }

  const releases = await response.json()

  if (Array.isArray(releases) && releases.length > 0) {
    // Find the release that contains our SHA
    const match = releases.find(
      (r: { version: string }) => r.version.includes(sha) || r.version.includes(sha.substring(0, 7)),
    )
    return match?.version || releases[0]?.version || null
  }

  // If no release found, return the SHA itself (Sentry might use raw SHAs as release versions)
  return sha
}
