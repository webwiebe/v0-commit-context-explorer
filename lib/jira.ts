// JIRA API client with caching
import { getCached, setCache, CACHE_TTL } from "./cache"
import { AbortSignal } from "abort-controller"

// Default to sportsdirect.atlassian.net, can be overridden with JIRA_BASE_URL env var
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || "https://sportsdirect.atlassian.net"

let jiraConnectionFailed = false
let jiraFailureReason: string | null = null
let lastConnectionAttempt = 0
const CONNECTION_RETRY_INTERVAL = 5 * 60 * 1000 // 5 minutes

export interface JiraTicket {
  key: string
  summary: string
  status: string
  type: string
  priority: string | null
  assignee: string | null
  reporter: string | null
  description: string | null
  labels: string[]
  url: string
  error?: string
}

export interface JiraError {
  type: "not_configured" | "connection_failed" | "auth_failed" | "not_found"
  message: string
}

function getHeaders() {
  const email = process.env.JIRA_EMAIL
  const token = process.env.JIRA_API_TOKEN

  if (!email || !token) {
    return null
  }

  const auth = Buffer.from(`${email}:${token}`).toString("base64")
  return {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

export function isJiraConfigured(): boolean {
  return !!(process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN)
}

export function shouldAttemptJiraConnection(): boolean {
  if (!isJiraConfigured()) return false

  // If connection failed, only retry after interval
  if (jiraConnectionFailed) {
    const now = Date.now()
    if (now - lastConnectionAttempt < CONNECTION_RETRY_INTERVAL) {
      return false
    }
    // Reset for retry
    jiraConnectionFailed = false
  }
  return true
}

export function getJiraStatus(): {
  configured: boolean
  connectionFailed: boolean
  failureReason?: string
  retryIn?: number
} {
  const configured = isJiraConfigured()
  if (!configured) {
    return { configured: false, connectionFailed: false }
  }

  if (jiraConnectionFailed) {
    const retryIn = Math.max(0, CONNECTION_RETRY_INTERVAL - (Date.now() - lastConnectionAttempt))
    return { configured: true, connectionFailed: true, failureReason: jiraFailureReason || undefined, retryIn }
  }

  return { configured: true, connectionFailed: false }
}

export function resetJiraConnection(): void {
  jiraConnectionFailed = false
  jiraFailureReason = null
  lastConnectionAttempt = 0
}

export async function fetchJiraTicket(ticketKey: string): Promise<JiraTicket> {
  const baseUrl = JIRA_BASE_URL.startsWith("http") ? JIRA_BASE_URL : `https://${JIRA_BASE_URL}`
  const headers = getHeaders()

  if (!headers) {
    return {
      key: ticketKey,
      summary: "",
      status: "",
      type: "",
      priority: null,
      assignee: null,
      reporter: null,
      description: null,
      labels: [],
      url: `${baseUrl}/browse/${ticketKey}`,
      error: "JIRA not configured",
    }
  }

  if (!shouldAttemptJiraConnection()) {
    return {
      key: ticketKey,
      summary: "",
      status: "",
      type: "",
      priority: null,
      assignee: null,
      reporter: null,
      description: null,
      labels: [],
      url: `${baseUrl}/browse/${ticketKey}`,
      error: jiraFailureReason || "Connection unavailable",
    }
  }

  const cacheKey = `jira:${ticketKey}`
  const cached = getCached<JiraTicket>(cacheKey)
  if (cached) return cached

  try {
    lastConnectionAttempt = Date.now()

    const response = await fetch(
      `${baseUrl}/rest/api/3/issue/${ticketKey}?fields=summary,status,issuetype,priority,assignee,reporter,description,labels`,
      {
        headers,
        signal: (AbortSignal as any).timeout(10000),
      },
    )

    const responseText = await response.text()
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("text/html")) {
      jiraConnectionFailed = true
      jiraFailureReason = "SSO/Enterprise authentication required - API token auth not supported from external servers"
      return {
        key: ticketKey,
        summary: "",
        status: "",
        type: "",
        priority: null,
        assignee: null,
        reporter: null,
        description: null,
        labels: [],
        url: `${baseUrl}/browse/${ticketKey}`,
        error: "SSO required",
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        return {
          key: ticketKey,
          summary: "",
          status: "",
          type: "",
          priority: null,
          assignee: null,
          reporter: null,
          description: null,
          labels: [],
          url: `${baseUrl}/browse/${ticketKey}`,
          error: "Not found",
        }
      } else if (response.status === 401 || response.status === 403) {
        jiraConnectionFailed = true
        jiraFailureReason = "Authentication failed - check JIRA_EMAIL and JIRA_API_TOKEN"
        return {
          key: ticketKey,
          summary: "",
          status: "",
          type: "",
          priority: null,
          assignee: null,
          reporter: null,
          description: null,
          labels: [],
          url: `${baseUrl}/browse/${ticketKey}`,
          error: "Auth failed",
        }
      }
      return {
        key: ticketKey,
        summary: "",
        status: "",
        type: "",
        priority: null,
        assignee: null,
        reporter: null,
        description: null,
        labels: [],
        url: `${baseUrl}/browse/${ticketKey}`,
        error: `Error ${response.status}`,
      }
    }

    if (!contentType.includes("application/json")) {
      jiraConnectionFailed = true
      jiraFailureReason = "Unexpected response format from JIRA"
      return {
        key: ticketKey,
        summary: "",
        status: "",
        type: "",
        priority: null,
        assignee: null,
        reporter: null,
        description: null,
        labels: [],
        url: `${baseUrl}/browse/${ticketKey}`,
        error: "Invalid response",
      }
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      jiraConnectionFailed = true
      jiraFailureReason = "Invalid JSON response from JIRA"
      return {
        key: ticketKey,
        summary: "",
        status: "",
        type: "",
        priority: null,
        assignee: null,
        reporter: null,
        description: null,
        labels: [],
        url: `${baseUrl}/browse/${ticketKey}`,
        error: "Parse error",
      }
    }

    const ticket: JiraTicket = {
      key: data.key,
      summary: data.fields.summary,
      status: data.fields.status?.name || "Unknown",
      type: data.fields.issuetype?.name || "Unknown",
      priority: data.fields.priority?.name || null,
      assignee: data.fields.assignee?.displayName || null,
      reporter: data.fields.reporter?.displayName || null,
      description: data.fields.description ? extractTextFromADF(data.fields.description) : null,
      labels: data.fields.labels || [],
      url: `${baseUrl}/browse/${data.key}`,
    }

    setCache(cacheKey, ticket, CACHE_TTL.COMMIT)
    return ticket
  } catch (error) {
    jiraConnectionFailed = true
    jiraFailureReason = "Network error connecting to JIRA"
    return {
      key: ticketKey,
      summary: "",
      status: "",
      type: "",
      priority: null,
      assignee: null,
      reporter: null,
      description: null,
      labels: [],
      url: `${baseUrl}/browse/${ticketKey}`,
      error: "Network error",
    }
  }
}

export async function fetchJiraTickets(ticketKeys: string[]): Promise<JiraTicket[]> {
  return Promise.all(ticketKeys.map(fetchJiraTicket))
}

// Extract plain text from Atlassian Document Format (ADF)
function extractTextFromADF(adf: any): string {
  if (!adf || typeof adf !== "object") return ""

  let text = ""

  if (adf.type === "text" && adf.text) {
    text += adf.text
  }

  if (adf.content && Array.isArray(adf.content)) {
    for (const node of adf.content) {
      text += extractTextFromADF(node)
      if (node.type === "paragraph" || node.type === "heading") {
        text += "\n"
      }
    }
  }

  return text.trim()
}

// Format tickets for AI context
export function formatTicketsForAI(tickets: JiraTicket[]): string {
  if (tickets.length === 0) return ""

  return `
JIRA Tickets referenced in these changes:
${tickets
  .map(
    (t) => `
- ${t.key}: ${t.summary}
  Type: ${t.type} | Status: ${t.status}${t.priority ? ` | Priority: ${t.priority}` : ""}
  ${t.description ? `Description: ${t.description.substring(0, 200)}${t.description.length > 200 ? "..." : ""}` : ""}`,
  )
  .join("\n")}
`
}
