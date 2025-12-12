import type {
  CommitContext,
  GitHubCommit,
  GitHubPR,
  GitHubWorkflowRun,
  ChangelogContext,
  ChangelogCommit,
  ChangedFile,
} from "./types"

const GITHUB_API = "https://api.github.com"

function getHeaders() {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

export function extractTickets(text: string): string[] {
  const matches = text.match(/PX-\d+/gi) || []
  return [...new Set(matches)].map((t) => t.toUpperCase()).filter((t) => t !== "PX-0" && t !== "PX-123")
}

export async function getCommit(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, { headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const hasToken = !!process.env.GITHUB_TOKEN

    if (response.status === 404) {
      const tokenInfo = hasToken
        ? "Token is set but may not have access"
        : "No token set - private repos require authentication"
      throw new Error(`Repository or commit not found: ${owner}/${repo}@${sha}. ${tokenInfo}`)
    }
    if (response.status === 401) {
      throw new Error("GitHub authentication failed. Check GITHUB_TOKEN is valid.")
    }
    if (response.status === 403) {
      const rateLimit = response.headers.get("x-ratelimit-remaining")
      if (rateLimit === "0") {
        throw new Error("GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.")
      }
      throw new Error("GitHub access forbidden. Check GITHUB_TOKEN has 'repo' scope.")
    }
    throw new Error(error.message || `Failed to fetch commit: ${response.status}`)
  }

  return response.json()
}

export async function findPRForCommit(owner: string, repo: string, sha: string): Promise<GitHubPR | null> {
  // Search for PRs that contain this commit
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}/pulls`, { headers: getHeaders() })

  if (!response.ok) {
    return null
  }

  const prs: GitHubPR[] = await response.json()
  return prs.length > 0 ? prs[0] : null
}

export async function getWorkflowRuns(
  owner: string,
  repo: string,
  sha: string,
  workflowFileName?: string,
): Promise<GitHubWorkflowRun | null> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?head_sha=${sha}&per_page=10`

  const response = await fetch(url, { headers: getHeaders() })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const runs: GitHubWorkflowRun[] = data.workflow_runs || []

  // If a specific workflow is requested, filter for it
  if (workflowFileName && runs.length > 0) {
    const deployRun = runs.find(
      (run) =>
        run.name.toLowerCase().includes("deploy") ||
        run.name.toLowerCase().includes(workflowFileName.replace(".yml", "")),
    )
    return deployRun || runs[0]
  }

  return runs.length > 0 ? runs[0] : null
}

export async function fetchCommitContext(owner: string, repo: string, sha: string): Promise<CommitContext> {
  // Fetch commit details
  const commitData = await getCommit(owner, repo, sha)

  // Fetch PR and deployment in parallel
  const [prData, workflowRun] = await Promise.all([
    findPRForCommit(owner, repo, sha),
    getWorkflowRuns(owner, repo, sha),
  ])

  const commit = {
    sha: commitData.sha.substring(0, 7),
    message: commitData.commit.message.split("\n")[0], // First line only
    author: commitData.author?.login || commitData.commit.author.name,
    date: commitData.commit.author.date,
    ticketRefs: extractTickets(commitData.commit.message),
  }

  const pr = prData
    ? {
        number: prData.number,
        title: prData.title,
        mergedBy: prData.merged_by?.login || "unknown",
        url: prData.html_url,
      }
    : null

  const deployment = workflowRun
    ? {
        status: mapWorkflowStatus(workflowRun.status, workflowRun.conclusion),
        environment: "production",
        url: workflowRun.html_url,
        completedAt: workflowRun.updated_at,
        workflowName: workflowRun.name,
      }
    : null

  return { commit, pr, deployment }
}

function mapWorkflowStatus(
  status: string,
  conclusion: string | null,
): "success" | "failure" | "in_progress" | "queued" | "pending" {
  if (status === "completed") {
    return conclusion === "success" ? "success" : "failure"
  }
  if (status === "in_progress") return "in_progress"
  if (status === "queued") return "queued"
  return "pending"
}

export async function compareCommits(
  owner: string,
  repo: string,
  baseSha: string,
  headSha: string,
): Promise<ChangelogContext> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const hasToken = !!process.env.GITHUB_TOKEN

    if (response.status === 404) {
      const tokenInfo = hasToken
        ? "Token is set but may not have access"
        : "No token set - private repos require authentication"
      throw new Error(`Repository or commits not found: ${owner}/${repo}. ${tokenInfo}`)
    }
    if (response.status === 401) {
      throw new Error("GitHub authentication failed. Check GITHUB_TOKEN is valid.")
    }
    if (response.status === 403) {
      const rateLimit = response.headers.get("x-ratelimit-remaining")
      if (rateLimit === "0") {
        throw new Error("GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.")
      }
      throw new Error("GitHub access forbidden. Check GITHUB_TOKEN has 'repo' scope.")
    }
    throw new Error(error.message || `Failed to compare commits: ${response.status}`)
  }

  const data = await response.json()

  const commits: ChangelogCommit[] = data.commits.map((commit: any) => ({
    sha: commit.sha,
    shortSha: commit.sha.substring(0, 7),
    message: commit.commit.message.split("\n")[0],
    author: commit.author?.login || commit.commit.author.name,
    date: commit.commit.author.date,
    ticketRefs: extractTickets(commit.commit.message),
    url: commit.html_url,
  }))

  // Collect all unique tickets
  const allTickets = [...new Set(commits.flatMap((c) => c.ticketRefs))]

  // Collect all unique authors
  const authors = [...new Set(commits.map((c) => c.author))]

  const files: ChangedFile[] = (data.files || []).map((file: any) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch, // The actual diff content
  }))

  return {
    fromSha: baseSha.substring(0, 7),
    toSha: headSha.substring(0, 7),
    commits,
    totalCommits: data.total_commits,
    allTickets,
    authors,
    compareUrl: data.html_url,
    files,
  }
}

export async function getCommitDiff(
  owner: string,
  repo: string,
  sha: string,
): Promise<{ commit: GitHubCommit; files: ChangedFile[] }> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const hasToken = !!process.env.GITHUB_TOKEN

    if (response.status === 404) {
      const tokenInfo = hasToken
        ? "Token is set but may not have access"
        : "No token set - private repos require authentication"
      throw new Error(`Repository or commit not found: ${owner}/${repo}@${sha}. ${tokenInfo}`)
    }
    if (response.status === 401) {
      throw new Error("GitHub authentication failed. Check GITHUB_TOKEN is valid.")
    }
    if (response.status === 403) {
      const rateLimit = response.headers.get("x-ratelimit-remaining")
      if (rateLimit === "0") {
        throw new Error("GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.")
      }
      throw new Error("GitHub access forbidden. Check GITHUB_TOKEN has 'repo' scope.")
    }
    throw new Error(error.message || `Failed to fetch commit: ${response.status}`)
  }

  const data = await response.json()

  const files: ChangedFile[] = (data.files || []).map((file: any) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch,
  }))

  return { commit: data, files }
}

export async function compareCommitsScoped(
  owner: string,
  repo: string,
  baseSha: string,
  headSha: string,
  path: string,
): Promise<ChangelogContext> {
  // First get the full comparison
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const hasToken = !!process.env.GITHUB_TOKEN

    if (response.status === 404) {
      const tokenInfo = hasToken
        ? "Token is set but may not have access"
        : "No token set - private repos require authentication"
      throw new Error(`Repository or commits not found: ${owner}/${repo}. ${tokenInfo}`)
    }
    if (response.status === 401) {
      throw new Error("GitHub authentication failed. Check GITHUB_TOKEN is valid.")
    }
    if (response.status === 403) {
      const rateLimit = response.headers.get("x-ratelimit-remaining")
      if (rateLimit === "0") {
        throw new Error("GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.")
      }
      throw new Error("GitHub access forbidden. Check GITHUB_TOKEN has 'repo' scope.")
    }
    throw new Error(error.message || `Failed to compare commits: ${response.status}`)
  }

  const data = await response.json()

  // Filter files to only those matching the path
  const filteredFiles: ChangedFile[] = (data.files || [])
    .filter((file: any) => file.filename.startsWith(path))
    .map((file: any) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    }))

  const commitsWithFiles = await Promise.all(
    data.commits.map(async (commit: any) => {
      try {
        const commitResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${commit.sha}`, {
          headers: getHeaders(),
        })
        if (!commitResponse.ok) return null
        const commitData = await commitResponse.json()
        const touchesPath = (commitData.files || []).some((file: any) => file.filename.startsWith(path))
        if (!touchesPath) return null
        return {
          sha: commit.sha,
          shortSha: commit.sha.substring(0, 7),
          message: commit.commit.message.split("\n")[0],
          author: commit.author?.login || commit.commit.author.name,
          date: commit.commit.author.date,
          ticketRefs: extractTickets(commit.commit.message),
          url: commit.html_url,
        }
      } catch {
        return null
      }
    }),
  )

  // Filter out null results (commits that don't touch the path)
  const commits: ChangelogCommit[] = commitsWithFiles.filter((c): c is ChangelogCommit => c !== null)

  const allTickets = [...new Set(commits.flatMap((c) => c.ticketRefs))]
  const authors = [...new Set(commits.map((c) => c.author))]

  return {
    fromSha: baseSha.substring(0, 7),
    toSha: headSha.substring(0, 7),
    commits,
    totalCommits: commits.length, // Use filtered count
    allTickets,
    authors,
    compareUrl: `${data.html_url}?diff=split&w=1`,
    files: filteredFiles,
  }
}

export function parseMachConfigVersionChanges(
  patch: string,
  filename: string,
): Array<{
  componentName: string
  componentPath: string
  fromVersion: string
  toVersion: string
  environment: string
}> {
  const changes: Array<{
    componentName: string
    componentPath: string
    fromVersion: string
    toVersion: string
    environment: string
  }> = []

  // Extract environment from filename (e.g., prd-prem-versions.yaml -> prd-prem)
  const envMatch = filename.match(/mach-config\/([^/]+)-versions\.yaml$/)
  const environment = envMatch ? envMatch[1] : "unknown"

  // Parse the diff to find version changes
  // Pattern: version: '@fx-component/{name}-{hash}'
  const lines = patch.split("\n")

  let currentComponent = ""
  let fromVersion = ""
  let toVersion = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for component name line
    const nameMatch = line.match(/^\s*- name:\s*(\S+)/)
    if (nameMatch) {
      currentComponent = nameMatch[1]
      continue
    }

    // Check for removed version line
    const removedMatch = line.match(/^-\s*version:\s*['"]?@fx-component\/(\S+?)-([a-f0-9]{7,})['"]?/)
    if (removedMatch) {
      fromVersion = removedMatch[2]
      // Try to get component name from version if not set
      if (!currentComponent) {
        currentComponent = removedMatch[1]
      }
      continue
    }

    // Check for added version line
    const addedMatch = line.match(/^\+\s*version:\s*['"]?@fx-component\/(\S+?)-([a-f0-9]{7,})['"]?/)
    if (addedMatch) {
      toVersion = addedMatch[2]
      if (!currentComponent) {
        currentComponent = addedMatch[1]
      }

      // If we have both from and to, record the change
      if (fromVersion && toVersion && currentComponent) {
        changes.push({
          componentName: currentComponent,
          componentPath: `components/${currentComponent}`,
          fromVersion,
          toVersion,
          environment,
        })
        // Reset for next component
        fromVersion = ""
        toVersion = ""
      }
      continue
    }
  }

  return changes
}
