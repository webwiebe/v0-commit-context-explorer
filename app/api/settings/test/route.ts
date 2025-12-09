import { type NextRequest, NextResponse } from "next/server"
import type { ConnectionTestResult } from "@/lib/types"

const GITHUB_API = "https://api.github.com"
const SENTRY_API = "https://sentry.io/api/0"

async function testGitHub(): Promise<ConnectionTestResult> {
  if (!process.env.GITHUB_TOKEN) {
    return {
      success: false,
      message: "GITHUB_TOKEN environment variable not set",
    }
  }

  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return {
        success: false,
        message: error.message || `GitHub API returned ${response.status}`,
      }
    }

    const user = await response.json()
    return {
      success: true,
      message: `Connected as ${user.login}`,
      details: {
        login: user.login,
        name: user.name,
        rateLimit: response.headers.get("x-ratelimit-remaining"),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to GitHub",
    }
  }
}

async function testSentry(): Promise<ConnectionTestResult> {
  if (!process.env.SENTRY_AUTH_TOKEN) {
    return {
      success: false,
      message: "SENTRY_AUTH_TOKEN environment variable not set",
    }
  }

  if (!process.env.SENTRY_ORG) {
    return {
      success: false,
      message: "SENTRY_ORG environment variable not set",
    }
  }

  try {
    const response = await fetch(`${SENTRY_API}/organizations/${process.env.SENTRY_ORG}/`, {
      headers: {
        Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return {
        success: false,
        message: error.detail || `Sentry API returned ${response.status}`,
      }
    }

    const org = await response.json()
    return {
      success: true,
      message: `Connected to organization: ${org.name}`,
      details: {
        slug: org.slug,
        name: org.name,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Sentry",
    }
  }
}

async function testJira(): Promise<ConnectionTestResult> {
  if (!process.env.JIRA_API_TOKEN || !process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL) {
    const missing = []
    if (!process.env.JIRA_API_TOKEN) missing.push("JIRA_API_TOKEN")
    if (!process.env.JIRA_BASE_URL) missing.push("JIRA_BASE_URL")
    if (!process.env.JIRA_EMAIL) missing.push("JIRA_EMAIL")
    return {
      success: false,
      message: `Missing environment variables: ${missing.join(", ")}`,
    }
  }

  try {
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString("base64")
    const response = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return {
        success: false,
        message: error.message || `Jira API returned ${response.status}`,
      }
    }

    const user = await response.json()
    return {
      success: true,
      message: `Connected as ${user.displayName}`,
      details: {
        accountId: user.accountId,
        displayName: user.displayName,
        emailAddress: user.emailAddress,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Jira",
    }
  }
}

async function testHoneycomb(): Promise<ConnectionTestResult> {
  if (!process.env.HONEYCOMB_API_KEY) {
    return {
      success: false,
      message: "HONEYCOMB_API_KEY environment variable not set",
    }
  }

  try {
    const response = await fetch("https://api.honeycomb.io/1/auth", {
      headers: {
        "X-Honeycomb-Team": process.env.HONEYCOMB_API_KEY,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Honeycomb API returned ${response.status}`,
      }
    }

    const auth = await response.json()
    return {
      success: true,
      message: `Connected to team: ${auth.team?.name || "Unknown"}`,
      details: {
        team: auth.team?.name,
        environment: auth.environment?.name,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Honeycomb",
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { integration } = body

  if (!integration) {
    return NextResponse.json({ error: "Missing integration parameter" }, { status: 400 })
  }

  let result: ConnectionTestResult

  switch (integration) {
    case "github":
      result = await testGitHub()
      break
    case "sentry":
      result = await testSentry()
      break
    case "jira":
      result = await testJira()
      break
    case "honeycomb":
      result = await testHoneycomb()
      break
    default:
      return NextResponse.json({ error: `Unknown integration: ${integration}` }, { status: 400 })
  }

  return NextResponse.json(result)
}
