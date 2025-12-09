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

// Sentry Release Health Types
export interface ReleaseHealthMetrics {
  release: string
  environment: string
  crashFreeSessionRate: number
  crashFreeUserRate: number
  adoptionRate: number
  totalSessions: number
  totalUsers: number
  crashedSessions: number
  erroredSessions: number
  healthySessions: number
  abnormalSessions: number
  unhandledErrors: number
  timeSeries: ReleaseHealthTimeSeries
}

export interface ReleaseHealthTimeSeries {
  intervals: string[]
  crashFreeSessions: number[]
  sessions: number[]
  crashedSessions: number[]
}

export interface SentryRelease {
  version: string
  dateCreated: string
  dateReleased: string | null
  firstEvent: string | null
  lastEvent: string | null
}
