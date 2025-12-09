---
description: Create a well-structured GitHub issue from a user request
---

# Create GitHub Issue: {{args}}

Transform your request into a clear, actionable GitHub issue with proper structure and context.

## STEP 1: UNDERSTAND THE REQUEST

### Initial Analysis
Analyze the request: "{{args}}"

**Key questions to answer:**
- What problem is being solved or what feature is being added?
- Who is the user/stakeholder affected?
- What's the desired outcome?
- Is this a bug, feature, enhancement, refactor, or something else?

### Check for Existing Issues
```bash
gh issue list --search "{{args}}" --limit 10
```
- Review existing issues to avoid duplicates
- Check if this is related to or depends on other issues
- Note any similar past issues (open or closed)

### Investigate Context

1. **Check scratchpads and docs**:
   - Search `.scratchpad/` for relevant notes
   - Check `docs/`, `CLAUDE.md`, and `QUICKSTART.md`
   - Look for architectural decisions or patterns

2. **Search codebase** (if relevant):
   - Find related code areas using Glob/Grep
   - Identify which parts of the system are affected
   - Check for existing similar implementations

3. **Review recent activity**:
   ```bash
   git log --oneline --grep="{{args}}" -10
   ```
   - See if similar work was done recently
   - Check for related PRs or commits

## STEP 2: CLARIFY IF NEEDED

**Ask the user for clarification if:**
- The request is too vague or ambiguous
- Multiple interpretations are possible
- Missing critical information:
  - Which site(s) affected? (main/places/admin/languagetrainer/party-perlen)
  - Who is the user? (admin, regular user, guest)
  - What's the priority/urgency?
  - Are there specific constraints or requirements?
  - What's the expected behavior vs. current behavior (for bugs)?
  - Are there any edge cases to consider upfront?

**Present your understanding** and ask:
- "I understand you want to [your interpretation]. Is that correct?"
- "Should this also handle [edge case]?"
- "Which site(s) should this affect?"
- "Is this blocking other work?"

**Wait for user confirmation** before proceeding to create the issue.

## STEP 3: STRUCTURE THE ISSUE

### Determine Issue Type
- **Bug**: Something is broken or not working as expected
- **Feature**: New functionality to be added
- **Enhancement**: Improvement to existing functionality
- **Refactor**: Code improvement without behavior change
- **Docs**: Documentation updates
- **Chore**: Maintenance tasks (dependencies, config, etc.)

### Draft Issue Content

**Title Format**:
- Bug: `[BUG] Clear description of what's broken`
- Feature: `[FEATURE] What should be added`
- Enhancement: `[ENHANCEMENT] What should be improved`
- Other: `[TYPE] Clear, concise description`

**Body Structure**:

```markdown
## Description
[Clear explanation of what needs to be done and why]

## Context
[Why is this needed? What problem does it solve? Who benefits?]

## Acceptance Criteria
- [ ] Specific, testable criteria 1
- [ ] Specific, testable criteria 2
- [ ] Specific, testable criteria 3

## Technical Considerations
[Optional: technical details, affected areas, potential approaches]

## Related
[Links to related issues, PRs, documentation]
```

**For Bugs, also include**:
```markdown
## Current Behavior
[What happens now]

## Expected Behavior
[What should happen]

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Environment
- Site: [main/places/admin/etc.]
- User role: [if relevant]
```

### Suggest Labels
Based on issue type, suggest appropriate labels:
- Type: `bug`, `feature`, `enhancement`, `refactor`, `docs`, `chore`
- Priority: `priority-high`, `priority-medium`, `priority-low`
- Scope: `frontend`, `backend`, `database`, `api`, `e2e`
- Site: `main`, `places`, `admin`, `languagetrainer`, `party-perlen`

## STEP 4: CREATE THE ISSUE

### Review with User
Present the drafted issue content and suggested labels to the user:

"I've drafted this issue. Does this capture what you need?"

[Show the title, body, and suggested labels]

**Wait for user approval** before creating.

### Create Issue
Once approved:
```bash
gh issue create \
  --title "[TYPE] Title here" \
  --body "$(cat <<'EOF'
[Full issue body here]
EOF
)" \
  --label "label1,label2,label3"
```

### Confirm Creation
After creation:
- Show the issue number and URL
- Suggest next steps:
  - "Use `/issue <number>` to start working on this immediately"
  - "Or I can add it to a milestone/project if needed"

## BEST PRACTICES

**Issue Quality**:
- Be specific and actionable
- Include "why" not just "what"
- Define clear acceptance criteria
- Reference relevant code locations with [file:line](path) format
- Link related issues/PRs
- Consider multi-site implications

**Scope Management**:
- One issue = one concern
- If request is too large, suggest breaking into multiple issues
- Note dependencies between issues

**Searchability**:
- Use clear, searchable titles
- Include relevant keywords in description
- Add appropriate labels

**User-Centric**:
- Focus on user value and outcomes
- Include user perspective in description
- Consider different user roles if applicable

---

**Begin**: Analyze the request "{{args}}" and start STEP 1
