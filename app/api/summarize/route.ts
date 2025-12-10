import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { fetchCommit, fetchCommitRange, extractJiraTickets } from "@/lib/github-api"
import { getCached, setCache, CACHE_TTL } from "@/lib/cache"
import { fetchJiraTickets, formatTicketsForAI, shouldAttemptJiraConnection, getJiraStatus } from "@/lib/jira"

interface ReleaseSummaries {
  business: string
  developer: string
  devops: string
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { sha, baseRef, repo: repoParam, componentPath, environment } = body

  if (!sha) {
    return NextResponse.json({ error: "Commit SHA is required" }, { status: 400 })
  }

  if (!repoParam) {
    return NextResponse.json({ error: "Repository is required (format: owner/repo)" }, { status: 400 })
  }

  const parts = repoParam.split("/")
  if (parts.length !== 2) {
    return NextResponse.json({ error: "Invalid repo format. Use owner/repo" }, { status: 400 })
  }
  const [owner, repo] = parts

  const cacheKey = `summary:${owner}/${repo}:${sha}:${baseRef || "single"}:${componentPath || "all"}`
  const cached = getCached<{ summaries: ReleaseSummaries; commit: any; ticketDetails: any[]; jiraStatus: any }>(
    cacheKey,
  )
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  try {
    let contextForAI: string
    let commitData: any
    const pathContext = componentPath ? `\nFiltered to path: ${componentPath}` : ""
    const releaseDate = new Date().toLocaleString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })
    const envLabel = environment || "Unknown"

    if (baseRef) {
      const comparison = await fetchCommitRange(owner, repo, baseRef, sha, componentPath)

      commitData = {
        ...comparison,
      }

      contextForAI = `
Repository: ${owner}/${repo}
Comparing: ${baseRef} → ${sha}${pathContext}
Total commits: ${comparison.commits.length}
Files changed: ${comparison.stats.total}
Additions: +${comparison.stats.additions}
Deletions: -${comparison.stats.deletions}

Commits in this range:
${comparison.commits.map((c) => `- ${c.sha.substring(0, 7)}: ${c.message} (by ${c.author})`).join("\n")}

Files changed:
${comparison.files
  .slice(0, 30)
  .map((f) => `- ${f.status}: ${f.filename} (+${f.additions}/-${f.deletions})`)
  .join("\n")}
${comparison.files.length > 30 ? `\n... and ${comparison.files.length - 30} more files` : ""}
`
    } else {
      const commit = await fetchCommit(owner, repo, sha)

      let filteredFiles = commit.files
      if (componentPath) {
        filteredFiles = commit.files.filter((f) => f.filename.startsWith(componentPath))
      }

      const tickets = extractJiraTickets([{ message: commit.message }])

      commitData = {
        ...commit,
        files: filteredFiles,
        stats: componentPath
          ? {
              additions: filteredFiles.reduce((sum, f) => sum + f.additions, 0),
              deletions: filteredFiles.reduce((sum, f) => sum + f.deletions, 0),
              total: filteredFiles.length,
            }
          : commit.stats,
        tickets,
      }

      contextForAI = `
Repository: ${owner}/${repo}
Commit: ${commit.sha}${pathContext}
Author: ${commit.author.name} (${commit.author.login || "unknown"})
Date: ${commit.author.date}

Commit message:
${commit.message}

Stats: +${commitData.stats.additions} additions, -${commitData.stats.deletions} deletions across ${filteredFiles.length} files

Files changed:
${filteredFiles
  .slice(0, 30)
  .map((f) => `- ${f.status}: ${f.filename} (+${f.additions}/-${f.deletions})`)
  .join("\n")}
${filteredFiles.length > 30 ? `\n... and ${filteredFiles.length - 30} more files` : ""}
`
    }

    let ticketDetails: any[] = []
    let jiraContext = ""
    const jiraStatus = getJiraStatus()

    if (commitData.tickets && commitData.tickets.length > 0) {
      if (shouldAttemptJiraConnection()) {
        ticketDetails = await fetchJiraTickets(commitData.tickets)
      } else {
        // Create placeholder ticket details with just the key and URL
        ticketDetails = commitData.tickets.map((ticket: string) => ({
          key: ticket,
          url: `https://${process.env.JIRA_BASE_URL || "sportsdirect.atlassian.net"}/browse/${ticket}`,
          error: jiraStatus.connectionFailed ? "JIRA unavailable" : "Not configured",
        }))
      }
      jiraContext = formatTicketsForAI(ticketDetails)
      contextForAI += jiraContext
    }

    let developerCommitContext = ""
    if (baseRef && commitData.commits) {
      developerCommitContext = `
DETAILED COMMIT BREAKDOWN:
${commitData.commits
  .map((c: any) => {
    const commitFiles = commitData.files
      .filter((f: any) => f.sha === c.sha || !f.sha) // files may not have sha, include all as fallback
      .slice(0, 10)
    return `
### Commit: ${c.sha.substring(0, 7)}
Author: ${c.author}
Message: ${c.message}
Files in this commit:
${commitFiles.map((f: any) => `  - ${f.filename} (+${f.additions}/-${f.deletions})`).join("\n") || "  (file details not available per-commit)"}
`
  })
  .join("\n")}

ALL FILES CHANGED:
${commitData.files.map((f: any) => `- ${f.status}: ${f.filename} (+${f.additions}/-${f.deletions})`).join("\n")}
`
    } else {
      developerCommitContext = `
COMMIT: ${commitData.sha?.substring(0, 7) || sha.substring(0, 7)}
Author: ${commitData.author?.name || "Unknown"}
Message: ${commitData.message || "No message"}

FILES CHANGED:
${commitData.files?.map((f: any) => `- ${f.status}: ${f.filename} (+${f.additions}/-${f.deletions})`).join("\n") || "No files"}
`
    }

    const [businessResult, developerResult, devopsResult] = await Promise.all([
      generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        system: `You are a product communications specialist writing release notes for Product Owners and business stakeholders.

Your output MUST follow this exact structure:

1. Start with a header block:
---
**Environment:** ${envLabel}
**Release Date:** ${releaseDate}
---

2. Then provide an Executive Summary (2-3 sentences summarizing the overall release and its business impact).

3. Then list each feature/improvement group in this format:

---
### [Feature Group Title]
**Feature:** [Main feature name] ([PX-XXXXX])
**Stories:** [Related story 1] ([PX-XXXXX]), [Related story 2] ([PX-XXXXX])

[2-3 sentence description of customer impact and business value. Focus on what customers will notice and how it benefits them.]

---

Rules:
- Group related tickets together under a meaningful feature title
- Always include ticket numbers in format PX-XXXXX in parentheses
- Write in clear, non-technical language
- Focus on customer impact and business value
- If a ticket doesn't have JIRA details, still reference it by number
- End with a brief "What's Next" or "Coming Soon" section if appropriate`,
        prompt: `Generate business-focused release notes for Product Owners:\n${contextForAI}`,
        // maxTokens: 1200,
      }),

      generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        system: `You are a senior developer writing technical release notes for the engineering team.

Your output MUST follow this exact structure:

1. Start with a brief Technical Overview (2-3 sentences summarizing the technical scope of this release).

2. Then list each commit with this format:

---
### \`<commit_sha>\` - <brief_title>

**Summary:** <1-2 sentence technical summary of what this commit does>

**Files Changed:**
- \`path/to/file1.ts\` - <brief description of change>
- \`path/to/file2.ts\` - <brief description of change>

---

Rules:
- List commits in chronological order (oldest to newest)
- For each commit, provide a 1-2 sentence technical summary
- List the key files changed with a brief note on what changed in each
- Use technical language appropriate for developers
- If a commit references a ticket (PX-XXXXX), include it in the title
- Group related commits under a feature heading if they clearly belong together
- Highlight any breaking changes, API modifications, or dependency updates`,
        prompt: `Generate developer-focused technical release notes with per-commit breakdown:\n${contextForAI}\n${developerCommitContext}`,
        // maxTokens: 1500,
      }),

      generateText({
        model: "anthropic/claude-sonnet-4-20250514",
        system: `You are a DevOps engineer writing deployment notes and risk assessment.
Focus on:
- Risk profile (Low/Medium/High) with justification
- Infrastructure changes (new services, config changes, env vars)
- Database migrations or schema changes
- Performance implications
- Monitoring recommendations (what to watch post-deployment)
- Rollback considerations
- Dependencies on external services
- Deployment order if multiple services affected

Be specific about what needs attention during and after deployment.
Start with an overall risk assessment, then detail specific concerns.`,
        prompt: `Generate DevOps-focused deployment notes and risk assessment:\n${contextForAI}`,
        // maxTokens: 800,
      }),
    ])

    const summaries: ReleaseSummaries = {
      business: businessResult.text,
      developer: developerResult.text,
      devops: devopsResult.text,
    }

    const result = {
      summaries,
      commit: commitData,
      ticketDetails,
      jiraStatus,
      cached: false,
    }
    setCache(cacheKey, { summaries, commit: commitData, ticketDetails, jiraStatus }, CACHE_TTL.SUMMARY)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate summary"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
