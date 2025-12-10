# Commit Context Explorer

A Next.js application that provides comprehensive context about Git commits, deployments, and changelogs with AI-powered summaries.

## Quick Start

```bash
pnpm install      # Install dependencies
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Styling**: Tailwind CSS 4.1 with shadcn/ui components (New York style)
- **Data Fetching**: SWR for client-side caching
- **AI**: Vercel AI SDK with Claude Sonnet 4
- **Deployment**: Vercel

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
    ├── sentry/
    │   └── release-health/route.ts  # Sentry release health metrics
    └── easteregg/monkey/route.ts # Monkey engineer image generation

components/
├── commit-input.tsx            # Input form with repo selector
├── commit-context-display.tsx  # Single commit view
├── changelog-display.tsx       # Changelog comparison view
├── deployment-display.tsx      # Mach-config deployment view
├── release-health-display.tsx  # Sentry release health dashboard
├── sparkline-chart.tsx         # SVG sparkline chart component
├── status-badge.tsx            # Deployment status indicators
├── ticket-badge.tsx            # Jira ticket references (PX-XXX)
├── author-hover.tsx            # Easter egg: monkey image on author hover
└── ui/                         # shadcn/ui primitives

lib/
├── github.ts                   # GitHub API integration
├── sentry.ts                   # Sentry API integration
├── types.ts                    # TypeScript interfaces
└── utils.ts                    # Utility functions (cn)
```

## Environment Variables

```bash
GITHUB_TOKEN=        # Optional but recommended for higher rate limits
SENTRY_AUTH_TOKEN=   # Required for Sentry release health integration
SENTRY_ORG=          # Sentry organization slug (default: frasers-group)
```

The Vercel AI integration uses the Vercel AI Gateway (configured automatically on Vercel) for both text generation (Claude) and image generation (Gemini Flash).

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

### GET `/api/sentry/release-health`

Fetches Sentry release health metrics including crash-free rates, sessions, and 24h time series.

**Query params**: `release` or `sha`, `project` (optional), `environment` (default: production)

### GET `/api/easteregg/monkey`

Generates AI-powered humorous monkey engineer images using Google Gemini Flash via Vercel AI Gateway.

**Query params**: `username`

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
