# Phase 2: Sentry Error Health

**Goal**: Add error impact visibility - see if a deployment introduced problems

**Prerequisite**: Phase 1 complete

## v0 Prompt (Additive)

Extend the Release Timeline Dashboard to show **error health** from Sentry for each deployment.

### Integration: Sentry MCP

Connect to Sentry to show:
- New issues introduced after a deployment
- Error rate change (before vs after)
- Top errors associated with a release
- Seer AI analysis for critical issues

### Sentry MCP Tools

```typescript
// From Sentry MCP documentation:
// - get_issues - Retrieve issues by project/release
// - search_errors - Find errors in specific files
// - get_release_data - Release trends and error rates
// - seer_analysis - AI root cause identification
```

### Extended Data Model

```typescript
interface DeploymentHealth {
  status: 'healthy' | 'degraded' | 'critical'
  errorsBefore: number      // Count in 1hr before deploy
  errorsAfter: number       // Count in 1hr after deploy
  errorDelta: number        // Percentage change
  newIssues: SentryIssue[]  // Issues first seen after this deploy
}

interface SentryIssue {
  id: string
  shortId: string           // e.g., "PROJECT-ABC"
  title: string
  culprit: string           // File/function
  count: number
  userCount: number
  firstSeen: Date
  lastSeen: Date
  level: 'error' | 'warning' | 'info'
  url: string               // Link to Sentry
  seerAnalysis?: string     // AI root cause if available
}
```

### UI Additions

**On DeploymentCard (timeline)**:
- Health indicator dot (green/amber/red) in corner
- Error count badge if > 0 new issues
- Subtle red glow on card border if critical

**On Deployment Detail page - new "Health" section**:
- Error rate comparison (before/after with visual bar)
- New issues list with:
  - Issue title
  - Error count
  - First seen timestamp
  - Link to Sentry
  - "Analyze with Seer" button for AI insights
- Overall health status banner

**New Dashboard Widget**:
- "Needs Attention" section showing deployments with degraded/critical health
- Sorted by severity

### New Components

1. `HealthIndicator` - Glowing dot (green/amber/red) with pulse on critical
2. `ErrorDeltaBar` - Visual before/after comparison
3. `IssueCard` - Sentry issue with count, culprit, link
4. `SeerAnalysis` - AI analysis display (collapsible)
5. `NeedsAttention` - Dashboard widget for unhealthy deploys

### MCP Stub Addition

Create `/lib/mcp/sentry.ts`:

```typescript
// Sentry MCP client stub
// Actual MCP tools:
// - get_issues
// - search_errors
// - get_release_data
// - seer_analysis

export interface SentryMCPClient {
  getIssuesByRelease(project: string, release: string): Promise<SentryIssue[]>
  getErrorRate(project: string, timeRange: TimeRange): Promise<ErrorStats>
  searchErrors(project: string, query: string): Promise<SentryIssue[]>
  getSeerAnalysis(issueId: string): Promise<SeerResult>
}
```

### API Routes (new)

```
GET /api/deployments/[id]/health   - Error health for deployment
GET /api/issues/[id]/analyze       - Trigger Seer analysis
GET /api/health/attention          - Deployments needing attention
```

### Color Coding

- **Healthy** (green #00ff00): Error rate decreased or < 5% increase, no new critical issues
- **Degraded** (amber #ff9500): 5-20% error increase OR 1-2 new issues
- **Critical** (red #ff0040): > 20% error increase OR 3+ new issues OR P0 issue

### Success Criteria

- [ ] Can see health status on every deployment at a glance
- [ ] Can drill into error details for any deployment
- [ ] Can use Seer AI to understand root causes
- [ ] Unhealthy deployments are surfaced prominently
- [ ] Ready to add Jira context in Phase 3
