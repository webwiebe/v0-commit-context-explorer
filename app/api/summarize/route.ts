import { type NextRequest, NextResponse } from "next/server"
import { generateText, type GenerateTextResult, type ToolSet } from "ai"
//import { z } from "zod"
import { fetchCommit, fetchCommitRange, extractJiraTickets, type CommitCompareResult } from "@/lib/github-api"
import { getCached, setCache, CACHE_TTL } from "@/lib/cache"
import { fetchJiraTickets, formatTicketsForAI, shouldAttemptJiraConnection, getJiraStatus } from "@/lib/jira"

interface ReleaseSummaries {
  business: string
  developer: string
  devops: string
}

/* const summarySchema = z.object({
  overview: z.string().describe("2-3 sentence plain-English explanation of what these commits do overall"),
  riskLevel: z.enum(["low", "medium", "high"]).describe("Overall risk level of the changes themselves"),
  riskReason: z
    .string()
    .describe("Brief explanation of why this risk level was assigned based on the nature of the changes"),
  endUsersImpact: z
    .string()
    .describe(
      "How end users are impacted. MUST reference specific features, UI elements, or behaviors. If no impact, say 'No direct impact from these changes.'",
    ),
  operationsTeamImpact: z
    .string()
    .describe(
      "How the operations team is impacted. MUST reference specific monitoring, deployment, or infrastructure concerns. If no impact, say 'No direct impact from these changes.'",
    ),
  businessImpact: z
    .string()
    .describe(
      "How the business is impacted. MUST reference specific revenue, customer experience, or business process changes. If no impact, say 'No direct impact from these changes.'",
    ),
  thingsToWatch: z
    .array(z.string())
    .describe(
      "MUST name specific features, buttons, pages, or user flows from the code. Each item must reference something a tester could actually find and click on. Never generic.",
    ),
}) */

//type Summary = z.infer<typeof summarySchema>

async function generateDevOpsSummary(compareData: CommitCompareResult): Promise</*Summary*/GenerateTextResult<ToolSet, never>> {
  const commitMessages = compareData.commits.map((c) => c.message.split("\n")[0]).join("\n- ")

  const filesChanged = compareData.files?.map((f) => ({
    name: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
  }))

  const totalAdditions = compareData.files?.reduce((sum, f) => sum + f.additions, 0) || 0
  const totalDeletions = compareData.files?.reduce((sum, f) => sum + f.deletions, 0) || 0

  const prompt = `Analyze this set of Git commits and assess their combined IMPACT and RISK to an ecommerce operations and/or devops team.

**Number of Commits:** ${compareData.commits.length}

**Commit Messages:**
- ${commitMessages}

**Overall Statistics:**
- Files changed: ${compareData.files?.length || 0}
- Total lines added: ${totalAdditions}
- Total lines removed: ${totalDeletions}

**All Code Changes (with diffs):**
${JSON.stringify(filesChanged, null, 2)}

=== CRITICAL INSTRUCTIONS - READ CAREFULLY ===

Your output will be REJECTED if it contains generic statements. Every single thing you write must be traceable to a specific file, function, component, or code change in the diffs above.

**COMPLETENESS - VERY IMPORTANT**
You MUST capture ALL significant changes in your overview. Scan through EVERY file change and ensure nothing important is omitted. Pay special attention to:
- Changes to calculations, formulas, or business logic (e.g., pricing, totals, discounts, gift cards)
- Changes to data flows or what data is included/excluded
- New features or removed features
- Changes to validation or error handling

If a change affects how values are calculated (e.g., including gift card values in price calculations), this MUST be mentioned in the overview.

**AUDIENCE: This summary is for live operations teams who respond to incidents on the website, not developers.**

**SECURITY AND SENSITIVITY RULES - MANDATORY**
NEVER include any of the following in your output:
- API keys, secrets, tokens, or credentials of any kind
- App IDs, client IDs, or any identifiers from the code
- Environment variable values (you can mention the variable name exists, but never its value)
- URLs, domains, or endpoints that could be internal/sensitive
- Database connection strings or configuration values
- Any alphanumeric strings that look like keys or identifiers (e.g., "ABC123XYZ")

Write in plain business English. Describe WHAT changes, not HOW it's configured. For example:
- GOOD: "Search functionality has been updated to use a new provider"
- BAD: "Algolia App ID ABC123 and Search Key XYZ789 have been added"

**RISK ASSESSMENT**
Assess risk of THE CHANGES, not the systems they touch.
- LOW: Bug fixes, UI tweaks, docs, new features that don't modify existing behavior
- MEDIUM: Changes to existing user-facing behavior, database schema changes, auth logic changes
- HIGH: Only for genuinely dangerous changes - security control removal, payment logic changes, bulk migrations

**WHO'S IMPACTED - THREE FIXED CATEGORIES**

You MUST provide impact assessments for exactly three groups: Operations Team, End Users, and Business.

Before writing ANY impact, ask yourself: "Can I point to a specific line of code that causes this impact?"

If there is genuinely no impact for a category, write "No direct impact from these changes." - but think carefully first.

BANNED PHRASES (if you use these, your output is wrong):
- "may experience changes"  
- "should be aware"
- "requires monitoring" (unless you specify WHAT to monitor)
- "may notice updates"
- "new environment" or "production environment"
- "site functionality" (too vague)
- Any phrase that would be true for ANY deployment

REQUIRED FORMAT: Every impact MUST name a specific feature, page, button, or behavior - in plain English suitable for non-technical readers.

Examples of GOOD impacts (notice they name specific things in plain language):
- End Users: "Will see a new 'Save for Later' button on product pages"
- Operations Team: "Will need to update the search index configuration before deployment"
- Business: "Checkout conversion may improve due to faster page load times on product pages"

Examples of BAD impacts (these would be rejected):
- "May experience improved performance" (which performance? where?)
- "Will need to monitor the deployment" (always true, useless)
- "Site functionality may be affected" (what functionality?)

**THINGS TO WATCH - STRICT RULES**

Each item MUST be a testable instruction that references something specific from the code changes, written in plain English.

BANNED PHRASES:
- "Test site functionality"
- "Monitor for errors"
- "Verify the deployment"  
- "Check availability"
- "Test affected pages" (which pages?)
- Any mention of "production" or "infrastructure" generically
- "Test the [system name]" without specifying what to test

REQUIRED FORMAT: Describe what a user would actually do and see. A non-technical QA tester should understand exactly what to check.

Examples of GOOD items:
- "Try adding more than 99 items to the shopping cart and verify it shows an error message"
- "Request a password reset email and check the link still works after 24 hours"
- "Search for a product and verify images appear correctly in the results"

Examples of BAD items (these would be rejected):
- "Test checkout functionality" (what specifically about checkout?)
- "Verify site works after deployment" (always true, useless)
- "Monitor error rates" (not a testable action)

REMEMBER: A non-technical person should be able to read each item and know EXACTLY what to do. Write for humans, not developers.`

  /* const { object } = await generateObject({
    model: "anthropic/claude-sonnet-4-20250514",
    schema: summarySchema,
    prompt,
    temperature: 0, // Set temperature to 0 for deterministic, consistent outputs
  }) */

  //return object

  const result = await generateText({
    model: "anthropic/claude-sonnet-4-20250514",
    prompt,
    temperature: 0, // Set temperature to 0 for deterministic, consistent outputs
  })

  return result
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

      generateDevOpsSummary(commitData),
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
