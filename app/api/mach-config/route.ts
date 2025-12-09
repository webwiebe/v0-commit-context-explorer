import { type NextRequest, NextResponse } from "next/server"
import { getCommitDiff, parseMachConfigVersionChanges, compareCommitsScoped } from "@/lib/github"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import type { ComponentVersionChange, MachConfigDeployment } from "@/lib/types"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const repo = searchParams.get("repo")
  const sha = searchParams.get("sha")

  if (!repo || !sha) {
    return NextResponse.json({ error: "Missing required parameters: repo, sha" }, { status: 400 })
  }

  const [owner, repoName] = repo.split("/")

  if (!owner || !repoName) {
    return NextResponse.json({ error: "Invalid repo format. Use owner/repo" }, { status: 400 })
  }

  try {
    // Get the commit diff
    const { commit, files } = await getCommitDiff(owner, repoName, sha)

    // Find mach-config version files
    const versionFiles = files.filter(
      (f) => f.filename.startsWith("mach-config/") && f.filename.endsWith("-versions.yaml") && f.patch,
    )

    if (versionFiles.length === 0) {
      return NextResponse.json({ error: "No mach-config version changes found in this commit" }, { status: 400 })
    }

    // Parse all version changes from the diffs
    const allVersionChanges: ComponentVersionChange[] = []

    for (const file of versionFiles) {
      const changes = parseMachConfigVersionChanges(file.patch!, file.filename)
      allVersionChanges.push(
        ...changes.map((c) => ({
          ...c,
          changelog: undefined,
        })),
      )
    }

    if (allVersionChanges.length === 0) {
      return NextResponse.json(
        { error: "No component version changes detected in the mach-config files" },
        { status: 400 },
      )
    }

    // For each component change, fetch the scoped changelog
    const componentsWithChangelogs = await Promise.all(
      allVersionChanges.map(async (change) => {
        try {
          const changelog = await compareCommitsScoped(
            owner,
            repoName,
            change.fromVersion,
            change.toVersion,
            change.componentPath,
          )

          // Generate AI summary for this component
          let summary: string | undefined

          if (changelog.files.length > 0) {
            const filesContext = changelog.files
              .slice(0, 20)
              .map((file) => {
                const patchPreview = file.patch ? file.patch.slice(0, 1000) : "No diff available"
                return `File: ${file.filename} (${file.status})
+${file.additions} -${file.deletions}
${patchPreview}${file.patch && file.patch.length > 1000 ? "\n... (truncated)" : ""}`
              })
              .join("\n\n---\n\n")

            const commitsContext = changelog.commits
              .slice(0, 15)
              .map((c) => `- ${c.message} (${c.author})`)
              .join("\n")

            try {
              const result = await generateText({
                model: anthropic("claude-sonnet-4-20250514"),
                maxOutputTokens: 800,
                prompt: `You are a senior software engineer reviewing code changes for the "${change.componentName}" component being deployed to ${change.environment}.

COMMITS:
${commitsContext}

FILE CHANGES (scoped to ${change.componentPath}):
${filesContext}

Provide a concise deployment summary with:
1. **What Changed**: 2-3 bullet points of key changes
2. **Risk Assessment**: Low/Medium/High with brief justification
3. **Testing Notes**: What should be verified post-deployment

Keep it brief and actionable for the deployment team.`,
              })

              summary = result.text
            } catch (aiError) {
              const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
              console.error(`[v0] AI summary generation failed for component: ${change.componentName}`, errorMessage)
              // Continue without summary - don't fail the entire request
            }
          }

          return {
            ...change,
            changelog: { ...changelog, summary },
          }
        } catch (err) {
          console.error("Failed to fetch changelog for component:", change.componentName, err)
          return change
        }
      }),
    )

    const deployment: MachConfigDeployment = {
      commitSha: sha.substring(0, 7),
      commitMessage: commit.commit.message.split("\n")[0],
      author: commit.author?.login || commit.commit.author.name,
      date: commit.commit.author.date,
      components: componentsWithChangelogs,
    }

    return NextResponse.json(deployment)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze mach-config deployment"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
