// Lightweight GitHub API client with caching
import { getCached, setCache, CACHE_TTL } from "./cache"

const GITHUB_API = "https://api.github.com"

function getHeaders() {
  const token = process.env.GITHUB_TOKEN
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export interface CommitDetails {
  sha: string
  message: string
  author: {
    name: string
    login: string | null
    avatarUrl: string | null
    date: string
  }
  url: string
  stats: {
    additions: number
    deletions: number
    total: number
  }
  files: {
    filename: string
    status: string
    additions: number
    deletions: number
    patch?: string
  }[]
  parents: { sha: string }[]
}

export interface CommitCompareResult {
  baseCommit: string
  headCommit: string
  commits: {
    sha: string
    message: string
    author: string
    date: string
  }[]
  files: {
    filename: string
    status: string
    additions: number
    deletions: number
  }[]
  stats: {
    additions: number
    deletions: number
    total: number
  }
  tickets: string[]
}

export interface PathCommit {
  sha: string
  message: string
  author: {
    name: string
    login: string | null
    avatarUrl: string | null
    date: string
  }
  url: string
  filesChanged: string[]
}

export async function fetchCommit(owner: string, repo: string, sha: string): Promise<CommitDetails> {
  const cacheKey = `commit:${owner}/${repo}:${sha}`
  const cached = await getCached<CommitDetails>(cacheKey)
  if (cached) return cached

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  const commit: CommitDetails = {
    sha: data.sha,
    message: data.commit.message,
    author: {
      name: data.commit.author.name,
      login: data.author?.login || null,
      avatarUrl: data.author?.avatar_url || null,
      date: data.commit.author.date,
    },
    url: data.html_url,
    stats: data.stats || { additions: 0, deletions: 0, total: 0 },
    files: (data.files || []).map((f: any) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    })),
    parents: data.parents || [],
  }

  await setCache(cacheKey, commit, CACHE_TTL.COMMIT)
  return commit
}

// Helper function to extract JIRA tickets from commit messages
export function extractJiraTickets(commits: { message: string }[]): string[] {
  const ticketPattern = /PX-(\d+)/gi
  const tickets = new Set<string>()

  for (const commit of commits) {
    const matches = commit.message.matchAll(ticketPattern)
    for (const match of matches) {
      const ticketNum = Number.parseInt(match[1], 10)
      // Filter out dummy values and any ticket number < 10000
      if (ticketNum >= 10000) {
        tickets.add(`PX-${match[1]}`)
      }
    }
  }

  return Array.from(tickets).sort((a, b) => {
    const numA = Number.parseInt(a.split("-")[1], 10)
    const numB = Number.parseInt(b.split("-")[1], 10)
    return numA - numB
  })
}

export async function fetchCommitRange(
  owner: string,
  repo: string,
  base: string,
  head: string,
  filterPath?: string,
): Promise<CommitCompareResult> {
  const cacheKey = `compare:${owner}/${repo}:${base}...${head}${filterPath ? `:${filterPath}` : ""}`
  const cached = await getCached<CommitCompareResult>(cacheKey)
  if (cached) return cached

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/compare/${base}...${head}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  let files = (data.files || []).map((f: any) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
  }))

  let filteredCommits: any[] = data.commits || []

  if (filterPath) {
    // Filter files by path
    files = files.filter((f: { filename: string }) => f.filename.startsWith(filterPath))

    // We need to fetch each commit to see which ones actually modified files in the filterPath
    // This is more accurate than matching by component name in commit message
    const commitsWithFilteredFiles: any[] = []

    for (const commit of data.commits || []) {
      // Fetch the individual commit to get its files
      const commitResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${commit.sha}`, {
        headers: getHeaders(),
      })

      if (commitResponse.ok) {
        const commitData = await commitResponse.json()
        const commitFiles = commitData.files || []
        const hasFilteredFiles = commitFiles.some((f: any) => f.filename.startsWith(filterPath))

        if (hasFilteredFiles) {
          commitsWithFilteredFiles.push(commit)
        }
      }
    }

    filteredCommits = commitsWithFilteredFiles
  }

  const commits = filteredCommits.map((c: any) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    fullMessage: c.commit.message, // Include full message for ticket extraction
    author: c.author?.login || c.commit.author.name,
    date: c.commit.author.date,
  }))

  const tickets = extractJiraTickets(commits.map((c) => ({ message: c.fullMessage })))

  const result: CommitCompareResult = {
    baseCommit: base,
    headCommit: head,
    commits,
    files,
    stats: {
      additions: files.reduce((sum: number, f: { additions: number }) => sum + f.additions, 0),
      deletions: files.reduce((sum: number, f: { deletions: number }) => sum + f.deletions, 0),
      total: files.length,
    },
    tickets,
  }

  await setCache(cacheKey, result, CACHE_TTL.DIFF)
  return result
}

export async function fetchCommitsByPath(
  owner: string,
  repo: string,
  path: string,
  since: string,
): Promise<PathCommit[]> {
  const cacheKey = `commits-by-path:${owner}/${repo}:${path}:${since}`
  const cached = await getCached<PathCommit[]>(cacheKey)
  if (cached) return cached

  // Fetch commits that touched the specified path since the given date
  const params = new URLSearchParams({
    path,
    since,
    per_page: "100",
  })

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?${params}`, { headers: getHeaders() })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  const commits: PathCommit[] = data.map((c: any) => ({
    sha: c.sha,
    message: c.commit.message,
    author: {
      name: c.commit.author.name,
      login: c.author?.login || null,
      avatarUrl: c.author?.avatar_url || null,
      date: c.commit.author.date,
    },
    url: c.html_url,
    filesChanged: [], // Will be populated if we fetch individual commit details
  }))

  await setCache(cacheKey, commits, CACHE_TTL.COMMIT)
  return commits
}
