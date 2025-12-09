import { type NextRequest, NextResponse } from "next/server"
import { fetchReleaseHealth, resolveReleaseVersion } from "@/lib/sentry"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const release = searchParams.get("release")
  const sha = searchParams.get("sha")
  const project = searchParams.get("project") || undefined
  const environment = searchParams.get("environment") || "production"

  // Either release version or SHA must be provided
  if (!release && !sha) {
    return NextResponse.json({ error: "Missing required parameter: release or sha" }, { status: 400 })
  }

  // Check for Sentry auth token
  if (!process.env.SENTRY_AUTH_TOKEN) {
    return NextResponse.json(
      { error: "Sentry integration not configured. Set SENTRY_AUTH_TOKEN environment variable." },
      { status: 503 },
    )
  }

  try {
    // Resolve SHA to release version if needed
    let releaseVersion = release
    if (!releaseVersion && sha) {
      releaseVersion = await resolveReleaseVersion(sha, project)
      if (!releaseVersion) {
        return NextResponse.json(
          { error: `Could not find Sentry release for SHA: ${sha}` },
          { status: 404 },
        )
      }
    }

    const health = await fetchReleaseHealth(releaseVersion!, project, environment)

    return NextResponse.json(health)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch release health"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
