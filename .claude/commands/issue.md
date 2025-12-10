---
description: Autonomously work on a GitHub issue from planning through deployment
---

# Work on Issue #{{args}}

Work independently on this issue following a senior developer workflow: thorough analysis, careful implementation, comprehensive testing, and professional PR submission.

## PHASE 1: PLAN

### Research & Context

1. **Fetch issue**: `gh issue view {{args}} --json title,body,labels,comments,assignees,milestone`
   - Read all comments for context and discussion history
   - Check for linked issues/PRs

2. **Check prior art in scratchpads**:
   - Search `.scratchpad/` directory for relevant notes about this code area
   - Check documentation in `docs/` and `CLAUDE.md` for architectural decisions
   - If you find relevant notes, reference them in your planning
   - Keep your own scratchpad notes as you discover insights

3. **Investigate codebase**:
   - Find existing similar implementations
   - Identify established patterns and conventions
   - Locate files needing modification
   - Review `git log` for recent changes in related areas
   - Check existing tests that might be affected

4. **Think harder about requirements**:
   - What's the ACTUAL problem (not just what's written)?
   - Who's affected? What's their workflow?
   - What are acceptance criteria (explicit and implicit)?
   - What edge cases exist?
   - What could go wrong?
   - Security/performance/scalability implications?
   - What should explicitly NOT be included (scope boundaries)?

5. **Risk assessment**:
   - Breaking changes, database migrations, auth/authz
   - Multi-site compatibility (main/places/admin/languagetrainer/party-perlen)
   - API contract changes, performance impact, race conditions

### Break Down Work

**Use TodoWrite** to create granular tasks (<30min each), ordered by dependencies:

- Database schema updates → client generation
- API endpoints → client generation
- Frontend components
- Unit tests + E2E tests (alongside implementation, not after)
- Linting/build/manual verification

### Design Decisions (keep in scratchpad)

- Architectural pattern (follow existing, don't invent)
- Error handling strategy (all layers: frontend/API/database)
- Validation approach (each layer)
- Multi-tenancy/site-scoping integration
- API contract (request/response shapes)
- Backward compatibility approach
- Database indices needed

### Testing Strategy

- Unit tests: which logic, which edge cases
- E2E tests: which user workflows
- Manual testing: what scenarios
- Existing tests needing updates
- Error path testing

## PHASE 2: CREATE

### Development Principles

- **Follow existing patterns** (don't invent)
- **Minimal scope** (resist scope creep)
- **Type safety** (strict TypeScript, no `any`)
- **Error handling** (try/catch all async, meaningful errors)
- **Multi-tenancy** (respect site-scoped access)
- **Security** (validate inputs, check authz, prevent injection)
- **Performance** (avoid N+1, pagination, proper indices)

### Implementation Order (Backend → Frontend)

**Use Makefile commands, not one-offs:**

- If a command isn't in the Makefile but should be reusable, add it
- Check `make help` for available commands
- Don't write manual commands that require special permissions

1. **Database** (if needed):
   - Update entities: `backend/packages/database/prisma/entities/`
   - `make db-migrate` (creates migration)
   - `make db-client` (regenerates types)
   - `make seed` (test data)

2. **API Layer**:
   - Update/create endpoints in `backend/services/api/`
   - Define JSON schemas (fastify validation)
   - Implement business logic with error handling
   - Add logging, update Swagger docs
   - Test: `make healthcheck`

3. **API Client**:
   - `make client` (regenerates frontend client)
   - Verify types in `frontend/packages/client/src/generated/`

4. **Frontend**:
   - Follow atomic design (atoms/molecules/templates)
   - Use existing theme/styling approach
   - Handle loading/error states
   - Frontend validation (in addition to backend)
   - Responsive design, accessibility (semantic HTML, ARIA)

5. **Tests** (write alongside code):
   - Unit tests for business logic and edge cases
   - E2E tests for critical user workflows
   - Test happy paths AND error conditions

### Quality Checks (frequent, not batch)

- `pnpm lint` (fix immediately)
- `pnpm build` (ensure TS compiles)
- Review your own code critically
- Atomic commits (one concern per commit)

## PHASE 3: TEST

### Automated Tests (ALL MUST PASS)

1. **Lint**: `pnpm lint` (fix all errors, don't disable rules)
2. **Build**: `pnpm build` (no TypeScript errors)
3. **Unit Tests**: `pnpm test` (existing + new tests pass)
4. **E2E Tests**: `make test-places-e2e` or relevant site command
   - Test authenticated/unauthenticated flows
   - Verify multi-tenant isolation

### Manual Verification (test like a user)

- `pnpm dev` to start services
- Test happy path with realistic data
- Test edge cases: empty states, validation errors, permissions
- Test different user roles
- Test across sites if changes are shared
- Verify user-friendly error messages
- Check browser console (no warnings/errors)
- Verify database state, API responses, logging

### If ANY Test Fails

- **STOP** - do not proceed
- Investigate root cause
- Fix completely
- Re-run ALL tests
- Never compromise on quality

## PHASE 4: DEPLOY (PR ONLY)

### Pre-Deployment Checklist

- [ ] All tests passing (lint, build, unit, E2E)
- [ ] Manual verification complete
- [ ] No console errors or warnings
- [ ] Self-reviewed critically
- [ ] Changes are minimal and focused
- [ ] No commented code or debug statements

### Create Branch & Commits

```bash
git checkout -b issue-{{args}}/short-description
```

**Commit format**: `feat: description` or `fix: description`

- Atomic commits (one logical change each)
- Clear, descriptive messages
- Reference issue in body if helpful

### Push & Create PR

```bash
git push -u origin issue-{{args}}/short-description

gh pr create --title "Closes #{{args}}: <descriptive title>" --body "$(cat <<'EOF'
## Summary
<What was implemented and why>

## Changes
- <Key change 1>
- <Key change 2>

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] Linting passed
- [ ] All builds successful

Closes #{{args}}
EOF
)"
```

### Monitor CI/CD

```bash
gh pr checks --watch
```

- All CI checks must pass
- If checks fail, fix immediately and push updates
- Don't merge until all green

### CRITICAL: DEPLOYMENT PROCESS

**DO NOT MERGE THE PR OR PUSH TO MAIN**

The deployment pipeline works as follows:

1. **PR created** → Automatically deploys to **test environment** (Docker)
2. **PR merged to main** → Automatically deploys to **production**

**Your job ends at PR creation.** The user will:

- Review the PR
- Merge when ready (triggering prod deployment)

**NEVER:**

- Merge the PR yourself
- Push directly to main
- Use `git push origin main` or similar commands

### Post-PR Actions

- Comment on issue #{{args}} summarizing what was done
- If breaking changes, document clearly in PR
- If follow-up needed, create new issues
- Update scratchpad with any insights for future work

## NON-NEGOTIABLE STANDARDS

**Code**: TypeScript strict, no `any`, error handling on all async, security best practices (validation, no injection), performance (no N+1, proper indices)

**Testing**: All tests pass, E2E covers critical journeys, edge cases tested, existing functionality intact

**Process**: Logical chunks, minimal changes, no scope creep, clean git history, scratchpad notes

## WHEN TO ASK USER

Don't assume - ask if:

- Requirements ambiguous/contradictory
- Multiple approaches with tradeoffs
- Breaking changes unavoidable
- Scope significantly larger than expected
- Testing infrastructure missing
- External dependency blockers

**Clarity > Speed**

## FINAL CHECKLIST

- [ ] All TodoWrite tasks completed
- [ ] All tests passing (lint, build, unit, E2E)
- [ ] Manual verification done
- [ ] Self-reviewed
- [ ] PR created with clear description
- [ ] CI checks passing
- [ ] Issue commented/updated
- [ ] Scratchpad notes saved
- [ ] **PR NOT merged** (user will merge)

---

**Begin**: Fetch issue #{{args}} and start PHASE 1: PLAN
