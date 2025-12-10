# Phase 3: Jira Context & Release Notes

**Goal**: Enrich deployments with ticket context, generate AI release notes

**Prerequisite**: Phase 2 complete

## v0 Prompt (Additive)

Extend the dashboard to pull **Jira ticket context** and generate **AI-powered release notes**.

### Integration: Jira MCP

Connect to Jira to:

- Fetch ticket details for PX-XXX references found in commits/PRs
- Get title, description, type for each ticket
- Provide context for release notes generation

### Ticket Extraction Logic

\`\`\`typescript
// Extract from commit messages and PR titles
// Pattern: PX-\d+ (case insensitive)
// Ignore: PX-0, PX-123 (dummy values)

function extractTicketRefs(text: string): string[] {
  const pattern = /PX-(\d+)/gi
  const matches = text.matchAll(pattern)
  return [...matches].map((m) => m[0].toUpperCase()).filter((ref) => ref !== "PX-0" && ref !== "PX-123")
}
\`\`\`

### Extended Data Model

\`\`\`typescript
interface JiraTicket {
  key: string // "PX-456"
  title: string
  description: string // Plain text, truncated
  type: "bug" | "feature" | "task" | "story" | "epic"
  status: string
  priority: string
  url: string
  labels: string[]
}

interface ReleaseNotes {
  summary: string // AI-generated summary
  features: string[] // New features
  fixes: string[] // Bug fixes
  other: string[] // Other changes
  generatedAt: Date
}
\`\`\`

### UI Additions

**On Deployment Detail - new "Context" section**:

- List of linked Jira tickets with:
  - Type icon (bug/feature/task)
  - Ticket key (link to Jira)
  - Title
  - Status badge
- Expandable description preview

**On Deployment Detail - new "Release Notes" section**:

- "Generate Release Notes" button
- AI-generated summary
- Categorized changes (Features / Fixes / Other)
- Copy to clipboard button (formatted for Slack)
- Regenerate button

**New page: `/releases/[id]/notes`** (optional):

- Full-page release notes view
- Print/export friendly
- Shareable link

### New Components

1. `TicketCard` - Jira ticket with type icon, key, title, status
2. `TicketTypeIcon` - Bug/feature/task/story icons
3. `ReleaseNotesPanel` - Generated notes with copy button
4. `GenerateButton` - AI generation trigger with loading state
5. `CopyButton` - Copy formatted notes to clipboard

### MCP Stub Addition

Create `/lib/mcp/jira.ts`:

\`\`\`typescript
// Jira MCP client stub
// Actual MCP tools:
// - get_issue
// - search_issues

export interface JiraMCPClient {
  getIssue(key: string): Promise<JiraTicket>
  searchIssues(jql: string): Promise<JiraTicket[]>
  batchGetIssues(keys: string[]): Promise<JiraTicket[]>
}
\`\`\`

### API Routes (new)

\`\`\`
GET  /api/tickets/[key]                  - Single ticket details
POST /api/tickets/batch                  - Batch fetch tickets
POST /api/deployments/[id]/generate-notes - Generate release notes
\`\`\`

### Release Notes Generation

Prompt structure for AI:

\`\`\`
Generate concise release notes for a deployment.

Commits:
{commit messages}

Pull Requests:
{PR titles}

Jira Tickets:
{ticket titles and descriptions}

Errors Introduced (if any):
{sentry issues}

Format as:
- Summary (2-3 sentences, stakeholder friendly)
- Features (new functionality)
- Fixes (bug fixes)
- Other (refactoring, dependencies, etc.)
\`\`\`

### Success Criteria

- [ ] Jira tickets automatically linked from commit/PR text
- [ ] Can see ticket context for any deployment
- [ ] Can generate AI release notes with one click
- [ ] Can copy notes for Slack/email
- [ ] Ready to add Honeycomb metrics in Phase 4
