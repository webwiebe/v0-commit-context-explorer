import { type NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import type { RecentDeployment } from "@/lib/types"

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const repo = searchParams.get("repo")

  if (!repo) {
    return NextResponse.json({ error: "Missing required parameter: repo" }, { status: 400 })
  }

  const [owner, repoName] = repo.split("/")

  if (!owner || !repoName) {
    return NextResponse.json({ error: "Invalid repo format. Use owner/repo" }, { status: 400 })
  }

  try {
    // Fetch recent commits that modified mach-config/ directory
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/commits?path=mach-config&per_page=100`,
      { headers: getHeaders() }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Failed to fetch commits: ${response.status}`)
    }

    const commits = await response.json()

    // Filter to only commits that touch *-versions.yaml files and dedupe
    const deploymentsMap = new Map<string, RecentDeployment>()

    for (const commit of commits) {
      if (deploymentsMap.size >= 20) break

      // Fetch the commit details to get files
      const detailResponse = await fetch(
        `${GITHUB_API}/repos/${owner}/${repoName}/commits/${commit.sha}`,
        { headers: getHeaders() }
      )

      if (!detailResponse.ok) continue

      const detail = await detailResponse.json()
      const versionFiles = (detail.files || []).filter(
        (f: { filename: string }) =>
          f.filename.startsWith("mach-config/") && f.filename.endsWith("-versions.yaml")
      )

      if (versionFiles.length === 0) continue

      // Extract environment names from version file names
      const environments = versionFiles.map((f: { filename: string }) => {
        const match = f.filename.match(/mach-config\/([^/]+)-versions\.yaml$/)
        return match ? match[1] : "unknown"
      })

      deploymentsMap.set(commit.sha, {
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        message: commit.commit.message.split("\n")[0],
        author: commit.author?.login || commit.commit.author.name,
        date: commit.commit.author.date,
        environments: [...new Set<string>(environments)],
      })
    }

    const deployments = Array.from(deploymentsMap.values())

    return NextResponse.json({ deployments })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "mach-config-recent", repo },
      extra: { owner, repoName },
    })
    const message = error instanceof Error ? error.message : "Failed to fetch recent deployments"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
