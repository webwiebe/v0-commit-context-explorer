import { type NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { compareCommits } from "@/lib/github"
import { generateText } from "@/lib/anthropic"
import { getCached, setCache, CACHE_TTL } from "@/lib/cache"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const repo = searchParams.get("repo")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!repo || !from || !to) {
    return NextResponse.json({ error: "Missing required parameters: repo, from, to" }, { status: 400 })
  }

  const [owner, repoName] = repo.split("/")

  if (!owner || !repoName) {
    return NextResponse.json({ error: "Invalid repo format. Use owner/repo" }, { status: 400 })
  }

  try {
    const changelog = await compareCommits(owner, repoName, from, to)

    let summary: string | undefined

    if (changelog.files.length > 0) {
      // Check cache first for AI summary
      const cacheKey = `ai:changelog:${repo}:${from}:${to}`
      const cachedSummary = await getCached<string>(cacheKey)

      if (cachedSummary) {
        summary = cachedSummary
      } else {
        // Build context from files - limit patch size to avoid token limits
        const filesContext = changelog.files
          .slice(0, 30) // Limit to 30 files
          .map((file) => {
            const patchPreview = file.patch ? file.patch.slice(0, 1500) : "No diff available"
            return `File: ${file.filename} (${file.status})
+${file.additions} -${file.deletions}
${patchPreview}${file.patch && file.patch.length > 1500 ? "\n... (truncated)" : ""}`
          })
          .join("\n\n---\n\n")

        const commitsContext = changelog.commits
          .slice(0, 20)
          .map((c) => `- ${c.message} (${c.author})`)
          .join("\n")

        try {
          summary = await generateText({
            prompt: `You are a senior software engineer reviewing code changes. Analyze the following git diff and commit messages, then provide a concise summary.

COMMITS:
${commitsContext}

FILE CHANGES:
${filesContext}

Provide a structured summary with:
1. **Overview**: A 1-2 sentence high-level summary of what changed
2. **Key Changes**: Bullet points of the most important changes (max 5)
3. **Impact**: Brief note on what areas of the codebase are affected

Keep it concise and technical. Focus on what matters to developers reviewing this changelog.`,
          })

          // Cache the AI summary
          await setCache(cacheKey, summary, CACHE_TTL.AI_CHANGELOG)
        } catch (aiError) {
          console.error("AI summary generation failed:", aiError)
          // Continue without summary if AI fails
        }
      }
    }

    return NextResponse.json({ ...changelog, summary })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "changelog", repo },
      extra: { from, to, owner, repoName },
    })
    const message = error instanceof Error ? error.message : "Failed to generate changelog"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
