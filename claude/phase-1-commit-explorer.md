# Phase 1: Commit Context Explorer (MVP)

**Goal**: Input commit SHA → fetch real data via MCP → display context

**Principle**: Real data from day one. No mocks.

## v0 Prompt

Build a minimal **Commit Context Explorer** using Next.js, Vercel AI SDK with MCP, and Vercel AI Gateway.

### Stack

- Next.js (App Router)
- TypeScript
- Vercel AI SDK with MCP client (`@ai-sdk/mcp`)
- Vercel AI Gateway for AI features
- Tailwind + dark mode

### What It Does

```
User pastes commit SHA
       ↓
GitHub MCP fetches commit details
       ↓
GitHub MCP finds associated PR
       ↓
GitHub MCP checks deployment status
       ↓
Display real data
```

### Single Page

```
┌────────────────────────────────────┐
│  COMMIT EXPLORER                   │
│                                    │
│  [_________________] [Explore]     │
│                                    │
│  ──────────────────────────────    │
│                                    │
│  COMMIT abc123f                    │
│  "Fix checkout validation"         │
│  john.doe • 2 hours ago            │
│  Refs: PX-456                      │
│                                    │
│  PR #1234                          │
│  "Checkout improvements"           │
│  Merged by jane.smith              │
│                                    │
│  DEPLOYED ✓                        │
│  prod • 45 mins ago                │
│  azure-mach-composer-deploy        │
│                                    │
└────────────────────────────────────┘
```

### MCP Setup

Connect to GitHub MCP server. The AI SDK MCP client handles the protocol.

```typescript
// lib/mcp/github.ts
import { createMCPClient } from '@ai-sdk/mcp';

const github = createMCPClient({
  // GitHub MCP server connection
});

// Use MCP tools:
// - get commit details
// - search for PR containing commit
// - list workflow runs
```

### API Route

```typescript
// app/api/commit/[sha]/route.ts
import { github } from '@/lib/mcp/github';

export async function GET(req, { params }) {
  const { sha } = params;
  const repo = req.nextUrl.searchParams.get('repo');

  // 1. Fetch commit from GitHub MCP
  const commit = await github.tool('get_commit', { owner, repo, sha });

  // 2. Find PR containing this commit
  const prs = await github.tool('list_pulls', { owner, repo, state: 'closed' });
  const pr = prs.find(p => /* contains commit */);

  // 3. Check deployment status
  const runs = await github.tool('list_workflow_runs', {
    owner, repo,
    workflow_id: 'azure-mach-composer-deploy.yml'
  });

  return Response.json({ commit, pr, deployment });
}
```

### Vercel AI Gateway

Use for any AI-powered features (added iteratively):
- Summarizing commit context
- Explaining changes in plain english
- Generating release notes snippet

```typescript
// Later: AI summary of commit
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const { text } = await generateText({
  model: gateway('anthropic/claude-sonnet'),
  prompt: `Summarize this commit: ${commit.message}`
});
```

### Environment Variables

```
GITHUB_TOKEN=           # For GitHub MCP auth
VERCEL_AI_GATEWAY_KEY=  # For AI Gateway (if using AI features)
```

### Data Types

```typescript
interface CommitContext {
  commit: {
    sha: string
    message: string
    author: string
    date: string
    ticketRefs: string[]  // extracted PX-XXX
  }
  pr: {
    number: number
    title: string
    mergedBy: string
    url: string
  } | null
  deployment: {
    status: 'success' | 'failure' | 'in_progress' | 'queued'
    environment: string
    url: string
    completedAt: string
  } | null
}
```

### Ticket Extraction

```typescript
function extractTickets(text: string): string[] {
  const matches = text.match(/PX-\d+/gi) || [];
  return [...new Set(matches)]
    .map(t => t.toUpperCase())
    .filter(t => t !== 'PX-0' && t !== 'PX-123');
}
```

### UI Components

Keep it minimal:
1. `CommitInput` - text input + button
2. `ContextCard` - generic card for displaying data
3. `StatusBadge` - deployment status indicator
4. `TicketBadge` - PX-XXX reference (will link to Jira later)

### Styling

Dark mode, minimal cyberpunk touches:
- Dark background (#0a0a0f)
- Cyan accents (#00fff5)
- Cards with subtle borders
- Monospace for SHAs

### Iteration Path

**Phase 1** (this): GitHub data only
**Phase 2**: Add Sentry error context
**Phase 3**: Add Jira ticket details
**Phase 4**: Add Honeycomb metrics

### Success Criteria

- [ ] Paste real commit SHA → see real data
- [ ] See associated PR if exists
- [ ] See deployment status if deployed
- [ ] Ticket refs extracted
- [ ] Deployed on Vercel
