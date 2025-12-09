import { type NextRequest, NextResponse } from "next/server"
import { fetchCommitContext } from "@/lib/github"

export async function GET(request: NextRequest, { params }: { params: Promise<{ sha: string }> }) {
  const { sha } = await params
  const searchParams = request.nextUrl.searchParams
  const repoParam = searchParams.get("repo")

  if (!repoParam) {
    return NextResponse.json({ error: "Missing repo parameter (format: owner/repo)" }, { status: 400 })
  }

  const [owner, repo] = repoParam.split("/")

  if (!owner || !repo) {
    return NextResponse.json({ error: "Invalid repo format. Use: owner/repo" }, { status: 400 })
  }

  try {
    const context = await fetchCommitContext(owner, repo, sha)
    return NextResponse.json(context)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch commit"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
