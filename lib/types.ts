export interface CommitContext {
  commit: {
    sha: string
    message: string
    author: string
    date: string
    ticketRefs: string[]
  }
  pr: {
    number: number
    title: string
    mergedBy: string
    url: string
  } | null
  deployment: {
    status: "success" | "failure" | "in_progress" | "queued" | "pending"
    environment: string
    url: string
    completedAt: string
    workflowName: string
  } | null
}

export interface ChangelogCommit {
  sha: string
  shortSha: string
  message: string
  author: string
  date: string
  ticketRefs: string[]
  url: string
}

export interface ChangelogContext {
  fromSha: string
  toSha: string
  commits: ChangelogCommit[]
  totalCommits: number
  allTickets: string[]
  authors: string[]
  compareUrl: string
  files: ChangedFile[]
  summary?: string
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  author: {
    login: string
  } | null
}

export interface GitHubPR {
  number: number
  title: string
  html_url: string
  merged_by: {
    login: string
  } | null
  merge_commit_sha: string | null
}

export interface GitHubWorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string | null
  html_url: string
  head_sha: string
  updated_at: string
  display_title: string
}

export interface ChangedFile {
  filename: string
  status: "added" | "removed" | "modified" | "renamed"
  additions: number
  deletions: number
  patch?: string
}

export interface ComponentVersionChange {
  componentName: string
  componentPath: string
  fromVersion: string
  toVersion: string
  environment: string
  changelog?: ChangelogContext
}

export interface MachConfigDeployment {
  commitSha: string
  commitMessage: string
  author: string
  date: string
  components: ComponentVersionChange[]
}

// Honeycomb types
export type HoneycombQueryType = "errors" | "latency" | "throughput" | "traces"

export interface HoneycombQueryConfig {
  type: HoneycombQueryType
  label: string
  description: string
  icon: string
}

export interface HoneycombQueryParams {
  dataset: string
  team: string
  environment?: string
  startTime: string // ISO timestamp
  endTime: string // ISO timestamp
  filters?: HoneycombFilter[]
  breakdowns?: string[]
  calculations?: HoneycombCalculation[]
}

export interface HoneycombFilter {
  column: string
  op: "=" | "!=" | ">" | "<" | "contains" | "starts-with" | "exists"
  value: string | number | boolean
}

export interface HoneycombCalculation {
  op: "COUNT" | "AVG" | "P50" | "P95" | "P99" | "MAX" | "MIN" | "SUM" | "HEATMAP"
  column?: string
}

export interface HoneycombQueryUrl {
  type: HoneycombQueryType
  label: string
  description: string
  url: string
}

export interface HoneycombConfig {
  team: string
  dataset: string
  environment?: string
  apiEndpoint?: string // defaults to US, set to https://api.eu1.honeycomb.io for EU
}

// Settings & Integration types
export type IntegrationStatus = "connected" | "not_configured" | "error"

export interface IntegrationConfig {
  id: string
  name: string
  description: string
  status: IntegrationStatus
  configuredVia: "env" | "local" | null
  details?: string
  error?: string
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

export interface IntegrationCredentials {
  github?: {
    token: string
  }
  sentry?: {
    authToken: string
    org: string
  }
  jira?: {
    apiToken: string
    baseUrl: string
    email: string
  }
  honeycomb?: {
    apiKey: string
  }
}
