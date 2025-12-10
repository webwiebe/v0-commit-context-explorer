# Phase 1: Core Release Timeline

**Goal**: Cyberpunk dashboard that answers "what was released, when, and where?"

## v0 Prompt

Build a **Release Timeline Dashboard** with a cyberpunk/neon aesthetic. This is the foundation for a release intelligence platform.

### Tech Requirements

- Next.js with App Router
- TypeScript
- Dark mode only - cyberpunk aesthetic (neon accents, dark backgrounds, glowing elements)

### Single Integration: GitHub MCP

Connect to GitHub to show:

- Recent deployments from the `azure-mach-composer-deploy` workflow
- Commits and PRs included in each deployment
- Deployment status (queued/in_progress/success/failure)
- Target environment (extracted from workflow inputs)

### Data Model

```typescript
interface Deployment {
  id: string
  workflowRunId: number
  workflowRunUrl: string
  repository: string
  status: "queued" | "in_progress" | "success" | "failure" | "cancelled"
  environment: string
  triggeredBy: string
  startedAt: Date
  completedAt: Date | null
  commits: Commit[]
  pullRequests: PullRequest[]
}

interface Commit {
  sha: string
  shortSha: string
  message: string
  author: string
  timestamp: Date
  ticketRefs: string[] // Extracted PX-XXX patterns (ignore PX-0, PX-123)
}

interface PullRequest {
  number: number
  title: string
  author: string
  mergedAt: Date
  url: string
}
```

### Pages

```
/                    → Dashboard with deployment timeline
/deployments/[id]    → Deployment detail (commits, PRs, status)
```

### Dashboard View

**Header**:

- App title with neon glow effect
- Environment filter pills (all/dev/staging/prod)
- Time range selector (24h/7d/30d)

**Main Content - Deployment Timeline**:

- Vertical timeline, newest at top
- Each deployment card shows:
  - Repository name
  - Environment badge (color-coded)
  - Status indicator (animated for in_progress)
  - Triggered by + timestamp
  - Commit count + PR count as small badges
  - Click to expand or navigate to detail

**Sidebar (optional)**:

- Currently deploying (live, with pulse animation)
- Quick stats: deployments today, success rate

### Deployment Detail View

- Full commit list with messages
- PR list with titles and authors
- Workflow run link (external)
- Extracted Jira ticket refs (just display, no linking yet)
- Timeline of workflow steps if available

### UI Components Needed

1. `DeploymentCard` - Timeline card with status, env, timestamps
2. `StatusBadge` - Animated status indicator (pulse for in_progress)
3. `EnvironmentBadge` - Color-coded env label
4. `CommitList` - Expandable commit history
5. `PRList` - Pull requests with authors
6. `Timeline` - Vertical timeline container with neon line

### Cyberpunk UI Guidelines

- Background: Near-black (#0a0a0f) with subtle grid pattern
- Primary accent: Electric cyan (#00fff5)
- Secondary accent: Hot pink/magenta (#ff00ff)
- Success: Neon green (#00ff00)
- Warning: Electric orange (#ff9500)
- Error: Red (#ff0040)
- Cards: Dark with subtle border glow on hover
- Text: White primary, gray-400 secondary
- Fonts: Monospace for technical data (commits, shas)
- Subtle scanline or noise overlay for texture
- Glow effects on interactive elements

### MCP Stub

Create `/lib/mcp/github.ts`:

```typescript
// GitHub MCP client stub
// Actual MCP tools to call:
// - list_workflow_runs
// - get_workflow_run
// - list_commits
// - list_pull_requests

export interface GitHubMCPClient {
  listWorkflowRuns(repo: string, workflow: string): Promise<WorkflowRun[]>
  getWorkflowRun(repo: string, runId: number): Promise<WorkflowRunDetail>
  listCommits(repo: string, sha: string, count: number): Promise<Commit[]>
  getPullRequest(repo: string, number: number): Promise<PullRequest>
}

// Export mock implementation for now
```

### API Routes

```
GET /api/deployments          - List recent deployments
GET /api/deployments/[id]     - Deployment detail with commits/PRs
GET /api/deployments/active   - Currently running deployments
```

### Success Criteria

- [ ] Can see all recent deployments at a glance
- [ ] Can filter by environment
- [ ] Can click into a deployment and see what code was included
- [ ] Looks cyberpunk as hell
- [ ] Ready to add Sentry integration in Phase 2
