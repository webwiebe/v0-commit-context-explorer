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
    ├── honeycomb/route.ts      # Honeycomb query URL generation
    └── easteregg/monkey/route.ts # Monkey engineer image generation

components/
├── commit-input.tsx            # Input form with repo selector
├── commit-context-display.tsx  # Single commit view
├── changelog-display.tsx       # Changelog comparison view
├── deployment-display.tsx      # Mach-config deployment view
├── honeycomb-queries.tsx       # Honeycomb observability quick actions
├── status-badge.tsx            # Deployment status indicators
├── ticket-badge.tsx            # Jira ticket references (PX-XXX)
├── author-hover.tsx            # Easter egg: monkey image on author hover
└── ui/                         # shadcn/ui primitives

lib/
├── github.ts                   # GitHub API integration
├── honeycomb.ts                # Honeycomb query URL generation
├── types.ts                    # TypeScript interfaces
└── utils.ts                    # Utility functions (cn)
```

## Environment Variables

```bash
GITHUB_TOKEN=           # Optional but recommended for higher rate limits

# Honeycomb Integration (Phase 4)
HONEYCOMB_API_KEY=      # Honeycomb API key (required for Honeycomb integration)
HONEYCOMB_TEAM=         # Honeycomb team slug
HONEYCOMB_DATASET=      # Default dataset to query
HONEYCOMB_ENVIRONMENT=  # Optional: Honeycomb environment name
HONEYCOMB_API_ENDPOINT= # Optional: Set to https://api.eu1.honeycomb.io for EU
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

### GET `/api/honeycomb`
Generates Honeycomb query URLs for deployment observability (errors, latency, throughput, traces).

**Query params**: `deploymentDate` (required), `componentName` (optional), `windowHours` (optional, default: 1)

**Response**: Returns query URLs pre-filtered to post-deployment time window

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

## Honeycomb Integration

All Honeycomb query URL generation is in [lib/honeycomb.ts](lib/honeycomb.ts). Key functions:

- `generateDeploymentQueries()` - Generate query URLs for a deployment time window
- `generateComponentQueries()` - Generate queries scoped to a specific component/service
- `buildHoneycombQueryUrl()` - Build a Honeycomb query URL with encoded parameters
- `buildTraceUrl()` - Generate direct trace link URL
- `mapComponentToService()` - Map component names to Honeycomb service names

Query templates support:
- **Errors**: Error rate and failed requests (filtered by `error=true`)
- **Latency**: P50/P95/P99 latency heatmap and percentiles
- **Throughput**: Request volume by endpoint and method
- **Traces**: Sample traces for investigation

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

interface HoneycombQueryUrl {
  type: "errors" | "latency" | "throughput" | "traces"
  label: string
  description: string
  url: string
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

### Phase 2 (Planned)
Sentry integration - correlate commits with error impact

### Phase 3 (Planned)
Jira integration - enrich ticket references with status, assignee, description

### Phase 4 (Current)
Honeycomb integration - link deployments to observability metrics
- Query URL generation for errors, latency, throughput, traces
- Pre-filtered to deployment time window
- Component-scoped queries for detailed investigation

## Conventions

- Use SWR for all data fetching with proper error handling
- Components follow shadcn/ui patterns with Radix primitives
- API routes return structured JSON with error messages
- AI prompts request structured output (bullet points, risk levels)
- TypeScript strict mode enabled
