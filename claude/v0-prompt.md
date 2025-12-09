# Release Intelligence Dashboard - v0 Prompt

Build a **Release Intelligence Dashboard** - an AI-powered platform that unifies release tracking, automated release notes generation, and post-deployment impact analysis by integrating with multiple MCP (Model Context Protocol) servers.

## The Problem

Teams lack unified visibility into:
- What code was released and when
- What work items (Jira tickets) were included in each release
- How releases are progressing through deployment pipelines
- What impact releases have on production (errors, latency, SLO breaches)

---

## Core Integrations (MCP Servers)

The app connects to these MCP servers - create typed client stubs for each:

### 1. GitHub MCP
- Fetch repositories, commits, pull requests, and authors
- **GitHub Actions**: Monitor the `azure-mach-composer-deploy.yml` workflow runs
- Track release tags and deployment status per environment
- Extract Jira ticket references from commit messages and PR titles

### 2. Jira MCP
- Pull tickets using the `PX-123` format found in commits/PRs
- **Important**: Ignore `PX-0` and `PX-123` as these are dummy/template values
- Extract: ticket key, title, description, type (bug/feature/task)
- Provide context for release notes generation

### 3. Sentry MCP
Available tools:
- `get_issues` - Retrieve issues by project/release
- `search_errors` - Find errors in specific files or across projects
- `get_release_data` - Examine release trends and error rates
- `seer_analysis` - AI-powered root cause identification and fix suggestions
- Compare error rates before/after a release

### 4. Honeycomb MCP
Primary datasets:
- `apollo-gateway` (fx-production environment)
- `ecommerce-bff` (fx-production environment)

Available tools:
- `run_query` - Execute analytics queries (filters, aggregations, P50/P95/P99 percentiles)
- `list_slos` / `get_slo` - Fetch SLO status and budget remaining
- `list_datasets` / `get_columns` - Discover available telemetry
- `analyze_columns` - Statistical analysis on metrics
- `get_trace_link` - Deep link to traces for debugging
- `list_triggers` / `get_trigger` - Alert configurations

### 5. Azure MCP (stretch goal)
- `Azure Monitor` - Additional observability if needed

---

## Features

### Release Timeline
- Chronological feed of releases across repositories
- Filter by: repository, environment (dev/staging/prod), date range, status
- Visual status: queued → deploying → deployed → healthy/degraded/failed
- Click through to release detail

### Release Detail Page

**Source Info:**
- Commits included (from GitHub)
- PRs merged with authors
- `azure-mach-composer-deploy` workflow run status

**Context:**
- Associated Jira tickets (extracted via `PX-XXX` pattern)
- Ticket titles and descriptions for context
- AI-generated release notes summary

**Impact Analysis:**
- Sentry: New issues introduced, error rate delta, top errors
- Honeycomb: P50/P95 latency changes from apollo-gateway and ecommerce-bff
- SLO status and budget remaining
- Visual health indicator (green/amber/red)
- Link to traces for anomalies

### Dashboard Home
- Releases today / this week
- Active `azure-mach-composer-deploy` runs
- Releases with degraded health (SLO breach, error spike)
- Quick search

### AI Release Notes Generator
- Parse commits/PRs for `PX-XXX` references (exclude PX-0, PX-123)
- Fetch Jira ticket details for context
- Generate concise, stakeholder-friendly release notes
- Highlight: breaking changes, new features, bug fixes
- Use Sentry's Seer for error context if applicable

---

## Data Models

```typescript
interface Release {
  id: string
  repository: string
  version: string
  environment: 'development' | 'staging' | 'production'
  status: 'queued' | 'deploying' | 'deployed' | 'failed' | 'rolled_back'
  deployedAt: Date | null
  workflowRunId: string  // GitHub Actions run ID
  workflowRunUrl: string
  commits: Commit[]
  pullRequests: PullRequest[]
  tickets: JiraTicket[]
  health: ReleaseHealth
}

interface Commit {
  sha: string
  message: string
  author: string
  timestamp: Date
  ticketRefs: string[]  // Extracted PX-XXX references
}

interface PullRequest {
  number: number
  title: string
  author: string
  mergedAt: Date
  ticketRefs: string[]  // Extracted PX-XXX references
}

interface JiraTicket {
  key: string          // e.g., "PX-456"
  title: string
  description: string
  type: 'bug' | 'feature' | 'task' | 'story'
  url: string
}

interface ReleaseHealth {
  status: 'healthy' | 'degraded' | 'critical'
  spikeDetected: boolean
  datasets: DatasetHealth[]
  slos: SLOStatus[]
  sentry: SentryHealth
}

interface DatasetHealth {
  name: 'apollo-gateway' | 'ecommerce-bff'
  latencyP50: number
  latencyP50Delta: number  // vs pre-release
  latencyP95: number
  latencyP95Delta: number
  errorRate: number
  errorRateDelta: number
}

interface SLOStatus {
  id: string
  name: string
  dataset: string
  targetPercentage: number
  currentPercentage: number
  budgetRemaining: number
  status: 'met' | 'at_risk' | 'breached'
}

interface SentryHealth {
  newIssues: number
  errorCountDelta: number  // % change
  topIssues: SentryIssue[]
}

interface SentryIssue {
  id: string
  title: string
  count: number
  firstSeen: Date
  url: string
}
```

---

## MCP Client Stubs

Create `/lib/mcp/` with typed stubs:

```
/lib/mcp/
  github.ts      - repos, commits, prs, workflow runs (azure-mach-composer-deploy)
  jira.ts        - search tickets by key, get ticket details
  sentry.ts      - issues, releases, error search, seer analysis
  honeycomb.ts   - queries, slos, datasets (apollo-gateway, ecommerce-bff)
  types.ts       - shared interfaces
```

Each stub should:
- Define TypeScript interfaces for request/response
- Export async functions returning mock data
- Include comments with actual MCP tool names

---

## API Routes

```
GET  /api/releases                     - List releases with filters
GET  /api/releases/[id]                - Release detail
GET  /api/releases/[id]/health         - Aggregated Sentry + Honeycomb health
POST /api/releases/[id]/generate-notes - AI release notes generation
GET  /api/workflows                    - Active GitHub Actions runs
GET  /api/slos                         - All SLOs from Honeycomb
```

---

## Page Structure

```
/                          → Dashboard overview
/releases                  → Release timeline with filters
/releases/[id]             → Release detail + impact + notes
/workflows                 → Active azure-mach-composer-deploy runs
/settings                  → MCP connection configuration
```

---

## UI Guidelines

- Dark mode default (operations dashboard aesthetic)
- Desktop-first, responsive
- Cards for releases with status badges
- Collapsible sections for commits, tickets, impact
- Semantic colors: green (healthy), amber (at_risk), red (breached/critical)
- Real-time updates for active workflows (polling)
- Toast notifications for deployment completions
- Copy-to-clipboard for release notes

---

## 2-Day Hackathon Priorities

### Day 1
1. App scaffold with routing and navigation
2. Mock data using real naming (apollo-gateway, ecommerce-bff, PX-XXX tickets)
3. Release timeline and detail pages
4. Dashboard overview

### Day 2
1. Wire up real MCP server connections
2. AI release notes generation
3. Health/impact panel with Sentry + Honeycomb data
4. Polish and demo prep

---

## Key Differentiator

This isn't just a dashboard - it's an **AI-powered release communication tool** that:
1. Automatically generates release notes from commits + Jira context
2. Proactively surfaces releases that need attention
3. Connects code changes to production impact via Honeycomb SLOs
4. Uses Sentry's Seer AI for intelligent error analysis
5. Monitors the mach-composer deployment pipeline in real-time
