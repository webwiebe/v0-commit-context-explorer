import { NextResponse } from "next/server"

export async function GET() {
  const status = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: {
      github: !!process.env.GITHUB_TOKEN,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      redis: !!process.env.REDIS_URL,
      sentry: !!process.env.SENTRY_AUTH_TOKEN,
    },
  }

  return NextResponse.json(status)
}
