# Commit Context Explorer

A Next.js application that provides comprehensive context about Git commits, deployments, and changelogs with AI-powered summaries.

## Quick Start

### Local Development

```bash
pnpm install      # Install dependencies
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # Run ESLint
```

### Docker Deployment (Recommended)

```bash
# Copy environment file and configure
cp .env.example .env

# Edit .env with your API keys
# ANTHROPIC_API_KEY is required for AI features

# Start the application with Redis caching
docker-compose up --build

# Access at http://localhost:3000
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Styling**: Tailwind CSS 4.1 with shadcn/ui components (New York style)
- **Data Fetching**: SWR for client-side caching
- **AI**: Anthropic SDK with Claude Sonnet 4
- **Caching**: Redis (persistent) with in-memory fallback
- **Deployment**: Docker Compose (self-hosted) or Vercel

## Project Structure

```
app/
├── page.tsx                    # Main client component
├── layout.tsx                  # Root layout with Analytics
├── globals.css                 # Theme variables (cyberpunk dark)
└── api/
    ├── commit/[sha]/route.ts   # Single commit context
    ├── changelog/route.ts      # Compare commits, AI summaries
    ├── mach-config/route.ts    # Deployment analysis
    ├── summarize/route.ts      # Multi-audience release notes
    ├── sentry/
    │   └── release-health/route.ts  # Sentry release health metrics
    └── easteregg/monkey/route.ts # Fun avatar generation (Gravatar)

components/
├── commit-input.tsx            # Input form with repo selector
├── commit-context-display.tsx  # Single commit view
├── changelog-display.tsx       # Changelog comparison view
├── deployment-display.tsx      # Mach-config deployment view
├── release-health-display.tsx  # Sentry release health dashboard
├── sparkline-chart.tsx         # SVG sparkline chart component
├── status-badge.tsx            # Deployment status indicators
├── ticket-badge.tsx            # Jira ticket references (PX-XXX)
├── author-hover.tsx            # Easter egg: avatar on author hover
└── ui/                         # shadcn/ui primitives

lib/
├── anthropic.ts                # Anthropic SDK client + helpers
├── cache.ts                    # Redis/in-memory caching layer
├── github.ts                   # GitHub API integration
├── github-api.ts               # Lightweight GitHub API client
├── loading-messages.ts         # Snarky loading messages
├── sentry.ts                   # Sentry API integration
├── types.ts                    # TypeScript interfaces
└── utils.ts                    # Utility functions (cn)
```

## Environment Variables

```bash
# Required for AI features
ANTHROPIC_API_KEY=sk-ant-...    # Get from console.anthropic.com

# Recommended
GITHUB_TOKEN=ghp_...            # Higher rate limits (60/hr without)
REDIS_URL=redis://localhost:6379 # Persistent caching (auto-set in Docker)

# Optional: Sentry
SENTRY_AUTH_TOKEN=              # Error monitoring
SENTRY_ORG=frasers-group
SENTRY_PROJECT=

# Optional: Jira
JIRA_BASE_URL=sportsdirect.atlassian.net
JIRA_API_TOKEN=
JIRA_EMAIL=
```

See `.env.example` for full configuration options.

## API Routes

### GET `/api/commit/[sha]`

Fetches single commit context including PR info and deployment status.

**Query params**: `repo` (default: `FrasersGroup/website`)

### GET `/api/changelog`

Compares two commits and generates AI-powered changelog summary.

**Query params**: `from`, `to`, `repo`

### GET `/api/mach-config`

Analyzes deployment commits to `mach-config/` directory, parses version changes, and generates risk assessments.

**Query params**: `sha`, `repo`

### POST `/api/summarize`

Generates multi-audience release notes (business, developer, DevOps).

**Body**: `{ sha, baseRef?, repo, componentPath?, environment? }`

### GET `/api/sentry/release-health`

Fetches Sentry release health metrics including crash-free rates, sessions, and 24h time series.

**Query params**: `release` or `sha`, `project` (optional), `environment` (default: production)

### GET `/api/easteregg/monkey`

Returns a fun Gravatar-based avatar for usernames.

**Query params**: `username`

## Caching Strategy

AI responses and GitHub API calls are cached to reduce costs and improve performance:

| Data Type | Cache Key Pattern | TTL |
|-----------|-------------------|-----|
| AI Summary | `ai:summary:{sha}:{baseRef}` | 1 hour |
| AI Changelog | `ai:changelog:{repo}:{from}:{to}` | 1 hour |
| AI Mach-config | `ai:machconfig:{repo}:{sha}:{component}` | 1 hour |
| GitHub Commit | `commit:{repo}:{sha}` | 10 min |
| GitHub Compare | `compare:{repo}:{base}...{head}` | 30 min |

When `REDIS_URL` is set, caching is persistent across container restarts. Otherwise, falls back to in-memory cache.

## GitHub Integration

All GitHub API calls are in [lib/github.ts](lib/github.ts). Key functions:

- `getCommit()` - Fetch commit details
- `findPRForCommit()` - Find merged PR containing commit
- `getWorkflowRuns()` - Get GitHub Actions deployment status
- `compareCommits()` / `compareCommitsScoped()` - Compare SHAs
- `extractTickets()` - Parse `PX-XXX` ticket references
- `parseMachConfigVersionChanges()` - Parse version diffs in YAML

## Sentry Integration

All Sentry API calls are in [lib/sentry.ts](lib/sentry.ts). Key functions:

- `fetchReleaseHealth()` - Get release health metrics (crash-free rates, sessions, adoption)
- `resolveReleaseVersion()` - Map GitHub SHA to Sentry release version

The Release Health dashboard displays:
- **Crash-free session rate** with circular progress indicator
- **Adoption rate** (percentage of users on this release)
- **Total sessions and users**
- **Unhandled errors count**
- **24h time series** with sparkline charts for crash-free rate and session volume

## Key Types

```typescript
interface CommitContext {
  commit: { sha, message, author, date, ticketRefs[] }
  pr: { number, title, mergedBy, url } | null
  deployment: { status, environment, url, completedAt, workflowName } | null
}

interface ChangelogContext {
  fromSha, toSha, commits[], totalCommits, allTickets[], authors[]
  compareUrl, files[], summary?
}

interface MachConfigDeployment {
  commitSha, commitMessage, author, date
  components: ComponentDeployment[]
}

interface ReleaseHealthMetrics {
  release, environment
  crashFreeSessionRate, crashFreeUserRate, adoptionRate
  totalSessions, totalUsers, crashedSessions, unhandledErrors
  timeSeries: { intervals[], crashFreeSessions[], sessions[] }
}
```

## Development Notes

- All interactive features use `"use client"` - no SSR
- AI summaries fail gracefully (don't block main functionality)
- Repository list persisted in localStorage
- Ticket pattern: `PX-XXX` (extracted from commit messages and PR titles)
- Theme: Forced dark mode with cyberpunk color scheme (OKLCH)
- Snarky loading messages rotate while waiting for AI responses

## Roadmap

### Phase 1 (Complete)

GitHub integration with commit context, changelogs, and deployment analysis

### Phase 2 (Complete)

Sentry integration - release health dashboard with crash-free rates, adoption, and 24h time series

### Phase 3 (Planned)

Jira integration - enrich ticket references with status, assignee, description

### Phase 4 (Planned)

Honeycomb integration - link deployments to observability metrics

## Conventions

- Use SWR for all data fetching with proper error handling
- Components follow shadcn/ui patterns with Radix primitives
- API routes return structured JSON with error messages
- AI prompts request structured output (bullet points, risk levels)
- TypeScript strict mode enabled
- Cache expensive operations (AI, GitHub API) with appropriate TTLs
