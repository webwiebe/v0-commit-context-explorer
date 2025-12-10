# Phase 2: Add Sentry Context

**Goal**: After fetching commit context, also show any Sentry errors related to this change

**Prerequisite**: Phase 1 complete

## v0 Prompt (Additive)

Extend the Commit Context Explorer to show **Sentry error context** for the commit.

### Additional Section in UI

\`\`\`
┌─────────────────────────────────────────────────┐
│  ...existing commit/PR/deployment sections...   │
│                                                 │
│  ERROR IMPACT (Sentry)                          │
│  ┌─────────────────────────────────────────┐   │
│  │ ⚠ 2 new issues after deployment         │   │
│  │                                         │   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ TypeError: Cannot read 'length'     │ │   │
│  │ │ checkout/validation.ts:42           │ │   │
│  │ │ 156 events  •  First seen: 1hr ago  │ │   │
│  │ │ [View in Sentry] [Analyze with Seer]│ │   │
│  │ └─────────────────────────────────────┘ │   │
│  │                                         │   │
│  │ ┌─────────────────────────────────────┐ │   │
│  │ │ ReferenceError: form is undefined   │ │   │
│  │ │ components/Form.tsx:89              │ │   │
│  │ │ 23 events  •  First seen: 45m ago   │ │   │
│  │ └─────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  FILES CHANGED → ERRORS                         │
│  ┌─────────────────────────────────────────┐   │
│  │ checkout/validation.ts                  │   │
│  │   └─ 1 error linked to this file        │   │
│  │ components/Form.tsx                     │   │
│  │   └─ 1 error linked to this file        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
\`\`\`

### What to Fetch (Sentry MCP)

Given commit context:

1. **Errors in changed files**
   - Use `search_errors` with file paths from commit
   - Filter to errors after deployment time

2. **New issues since deployment**
   - Use `get_issues` filtered by first_seen > deploy time
   - Link to release if Sentry release matches

3. **AI Analysis (optional)**
   - Use `seer_analysis` for top issues
   - Show root cause suggestion

### Extended Data Model

\`\`\`typescript
interface CommitContext {
  // ...existing fields...
  errorImpact: ErrorImpact | null
}

interface ErrorImpact {
  status: "clean" | "issues_found" | "unknown"
  newIssues: SentryIssue[]
  fileErrors: FileErrorLink[]
}

interface SentryIssue {
  id: string
  shortId: string
  title: string
  culprit: string // file:line
  count: number
  userCount: number
  firstSeen: Date
  level: "error" | "warning"
  url: string
}

interface FileErrorLink {
  filePath: string
  errors: SentryIssue[]
}
\`\`\`

### MCP Integration

Add `/lib/mcp/sentry.ts`:

\`\`\`typescript
// Sentry MCP tools to use:
// - search_errors: Find errors in specific files
// - get_issues: Get issues by project/time range
// - seer_analysis: AI root cause analysis

export async function getErrorContext(project: string, files: string[], since: Date): Promise<ErrorImpact> {
  // 1. Search for errors in changed files
  // 2. Get new issues since deployment
  // 3. Link errors to files
  // Return error impact
}
\`\`\`

### New UI Components

1. `ErrorImpactSection` - Container for error context
2. `IssueCard` - Single Sentry issue with count, link
3. `FileErrorList` - Files with linked errors
4. `SeerButton` - Trigger AI analysis
5. `SeerAnalysis` - Display AI root cause

### Status Indicators

- **Clean** (green): No new issues in changed files
- **Issues Found** (red): New errors linked to this commit
- **Unknown** (gray): Not deployed yet / can't determine

### Success Criteria

- [ ] See errors in files changed by this commit
- [ ] See new issues introduced after deployment
- [ ] Link between file changes and errors
- [ ] Can trigger Seer AI analysis
- [ ] Clear indication when commit is "clean"
