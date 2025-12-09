# Commit Context Explorer - Hackathon Plan

Input a commit SHA → fetch real context via MCP → display it.

**Real data from day one. No mocks. Iterate on features.**

## Stack

- Next.js + Vercel
- Vercel AI SDK with MCP (`@ai-sdk/mcp`)
- Vercel AI Gateway (for AI features)
- GitHub, Sentry, Jira, Honeycomb MCP servers

## Phased Approach

| Phase | Focus | Adds |
|-------|-------|------|
| **1** | Commit Context | GitHub MCP |
| **2** | Error Impact | + Sentry MCP |
| **3** | Ticket Details | + Jira MCP |
| **4** | Performance | + Honeycomb MCP |

## Start Here

- [phase-1-commit-explorer.md](phase-1-commit-explorer.md) - **MVP** - GitHub commit context
- [phase-2-sentry-context.md](phase-2-sentry-context.md) - Add error impact

## Expansion (later)

- [phase-3-jira-context.md](phase-3-jira-context.md) - Ticket context, AI release notes
- [phase-4-honeycomb-observability.md](phase-4-honeycomb-observability.md) - Latency, SLOs, traces

## Archive

- [phase-1-core-timeline.md](phase-1-core-timeline.md) - Original timeline dashboard idea
- [phase-2-sentry-health.md](phase-2-sentry-health.md) - Original Sentry integration

## Key Details

**Jira Pattern**: `PX-XXX` (ignore `PX-0`, `PX-123`)

**GitHub Workflow**: `azure-mach-composer-deploy.yml`

**Honeycomb Datasets**:
- `apollo-gateway` (fx-production)
- `ecommerce-bff` (fx-production)

## Cyberpunk Theme

```
Background:  #0a0a0f
Cyan:        #00fff5
Magenta:     #ff00ff
Green:       #00ff00
Orange:      #ff9500
Red:         #ff0040
```
