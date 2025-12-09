import { NextResponse } from "next/server"
import type { IntegrationConfig } from "@/lib/types"

// Check which integrations are configured via environment variables
function getIntegrationStatus(): IntegrationConfig[] {
  const integrations: IntegrationConfig[] = [
    {
      id: "github",
      name: "GitHub",
      description: "Access commit details, PRs, and deployment status from GitHub Actions",
      status: process.env.GITHUB_TOKEN ? "connected" : "not_configured",
      configuredVia: process.env.GITHUB_TOKEN ? "env" : null,
      details: process.env.GITHUB_TOKEN ? "Token configured via GITHUB_TOKEN" : undefined,
    },
    {
      id: "sentry",
      name: "Sentry",
      description: "Correlate deployments with error rates and issue tracking",
      status: process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG ? "connected" : "not_configured",
      configuredVia: process.env.SENTRY_AUTH_TOKEN ? "env" : null,
      details:
        process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG
          ? `Organization: ${process.env.SENTRY_ORG}`
          : undefined,
    },
    {
      id: "jira",
      name: "Jira",
      description: "Enrich PX-XXX ticket references with status, assignee, and details",
      status:
        process.env.JIRA_API_TOKEN && process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL
          ? "connected"
          : "not_configured",
      configuredVia: process.env.JIRA_API_TOKEN ? "env" : null,
      details:
        process.env.JIRA_API_TOKEN && process.env.JIRA_BASE_URL
          ? `Instance: ${process.env.JIRA_BASE_URL}`
          : undefined,
    },
    {
      id: "honeycomb",
      name: "Honeycomb",
      description: "Link deployments to observability metrics and performance data",
      status: process.env.HONEYCOMB_API_KEY ? "connected" : "not_configured",
      configuredVia: process.env.HONEYCOMB_API_KEY ? "env" : null,
      details: process.env.HONEYCOMB_API_KEY ? "API key configured" : undefined,
    },
  ]

  return integrations
}

export async function GET() {
  const integrations = getIntegrationStatus()
  return NextResponse.json({ integrations })
}
