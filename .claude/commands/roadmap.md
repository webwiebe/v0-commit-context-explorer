---
description: Strategic product roadmap planning and GitHub issue prioritization
---

# Product Roadmap & Vision

Act as a strategic product owner/CEO to analyze the current backlog, define product vision, and prioritize work for maximum customer value and revenue potential.

## STEP 1: GATHER INTELLIGENCE

### Fetch All Issues
```bash
# Get open issues with full context
gh issue list --limit 100 --json number,title,labels,body,comments,createdAt,updatedAt,milestone,assignees --state open

# Get recently closed issues for context
gh issue list --limit 20 --json number,title,labels,closedAt --state closed
```

### Understand Current State

1. **Product context** (check these sources):
   - `docs/` for product documentation
   - `CLAUDE.md` for architecture and technical direction
   - `.scratchpad/` for strategic notes and decisions
   - `README.md` for product overview

2. **Analyze issue patterns**:
   - What themes emerge? (e.g., performance, UX, new features, technical debt)
   - Which sites are affected most? (main/places/admin/languagetrainer/party-perlen)
   - What do users/customers actually need vs. want?
   - Where is technical debt blocking progress?

3. **Review recent commits** (what's the team focused on?):
   ```bash
   git log --oneline --since="1 month ago" -30
   ```

4. **Check milestones and projects**:
   ```bash
   gh issue list --json milestone | jq -r '.[].milestone.title' | sort | uniq
   ```

## STEP 2: ULTRATHINK - STRATEGIC ANALYSIS

**Think deeply and strategically about:**

### Product Vision
- What is the core value proposition of each site?
- What makes this product unique and defensible?
- Where should the product be in 6 months? 12 months?
- What capabilities would unlock new revenue streams?
- What would delight customers and create word-of-mouth growth?

### Market & Customer Perspective
- Who are the primary users/customers for each site?
- What are their biggest pain points RIGHT NOW?
- What would make them pay more or refer others?
- What are they currently doing workarounds for?
- What features would reduce churn or increase engagement?

### Business Model & Revenue
- Which features directly drive revenue?
- Which features reduce costs or improve efficiency?
- What's the ROI of each major theme?
- Are there quick wins that unlock revenue?
- What investments have long-term strategic value?

### Technical Health
- Where is technical debt blocking business value?
- What infrastructure improvements enable faster feature delivery?
- Are there security or performance risks that could harm the business?
- What refactoring would accelerate future development?

### Competitive Landscape
- What do competitors do better?
- Where can we leapfrog competition?
- What emerging trends should we capitalize on?
- What would be hard to copy?

### Risk Assessment
- What could kill the product if not addressed?
- What dependencies or technical risks exist?
- Where are we vulnerable to customer churn?
- What regulatory or compliance issues loom?

## STEP 3: CATEGORIZE & ANALYZE ISSUES

### Group Issues by Strategic Value

**Tier 1 - Critical Business Impact** (do first):
- Revenue-generating features
- Customer retention/churn prevention
- Critical bugs affecting users
- Security vulnerabilities
- Performance issues hurting UX

**Tier 2 - Strategic Enablers** (do soon):
- Features that unlock future capabilities
- Technical debt blocking important features
- Infrastructure improvements for scalability
- Multi-site consistency improvements
- Developer productivity enhancements

**Tier 3 - Nice to Have** (do later):
- Minor enhancements
- Edge case fixes
- Aesthetic improvements
- Internal tooling nice-to-haves

**Tier 4 - Questionable Value** (challenge or close):
- Features with unclear business value
- Over-engineering or premature optimization
- Scope creep from original vision
- Technical debt that doesn't block anything

### Timeline Alignment

**Now (0-4 weeks)** - Quick Wins & Critical Issues:
- What delivers immediate customer value?
- What removes immediate blockers?
- What generates revenue fastest?
- What prevents customer churn?

**Next (1-3 months)** - Strategic Bets:
- What positions us for growth?
- What differentiates from competition?
- What enables the next tier of features?
- What scales the business?

**Future (3-12 months)** - Vision Building:
- What transforms the product?
- What enters new markets?
- What creates moats?
- What are moonshot opportunities?

## STEP 4: CREATE STRATEGIC PLAN

### Draft the Vision

Write a clear, compelling product vision:

```markdown
## Product Vision

### Mission
[Why does this product exist? What problem does it solve?]

### 3-Month Goals
1. [Goal 1 - with measurable outcome]
2. [Goal 2 - with measurable outcome]
3. [Goal 3 - with measurable outcome]

### 12-Month Vision
[Where should the product be? What capabilities? What market position?]

### Strategic Themes
1. **Theme 1** (e.g., "Performance & Reliability")
   - Why: [Business justification]
   - Impact: [Expected customer/revenue impact]
   - Key initiatives: [List of related issues]

2. **Theme 2** (e.g., "Multi-site Consistency")
   - Why: [Business justification]
   - Impact: [Expected customer/revenue impact]
   - Key initiatives: [List of related issues]

[Continue for each major theme...]

### Success Metrics
- [Metric 1 - e.g., "Reduce churn by 15%"]
- [Metric 2 - e.g., "Increase conversion by 25%"]
- [Metric 3 - e.g., "Deploy frequency up 50%"]
```

### Present to User

Show your analysis and strategic plan to the user:
- Explain your reasoning for prioritization
- Highlight trade-offs and decisions made
- Note any issues you recommend closing/deprioritizing
- Suggest new strategic initiatives not captured in existing issues

**Ask for feedback**: "Does this align with your vision? Any adjustments needed?"

## STEP 5: EXECUTE - ALIGN & PRIORITIZE ISSUES

### Update Issue Priorities

Based on approved strategy, update issues with:

**Priority Labels**:
```bash
# Add priority labels to issues
gh issue edit <number> --add-label "priority-critical"  # Tier 1
gh issue edit <number> --add-label "priority-high"      # Tier 2
gh issue edit <number> --add-label "priority-medium"    # Tier 3
gh issue edit <number> --add-label "priority-low"       # Tier 4
```

**Strategic Theme Labels**:
```bash
# Tag with strategic themes
gh issue edit <number> --add-label "theme-performance"
gh issue edit <number> --add-label "theme-revenue"
gh issue edit <number> --add-label "theme-ux"
gh issue edit <number> --add-label "theme-infrastructure"
```

**Timeline Labels**:
```bash
gh issue edit <number> --add-label "timeline-now"      # 0-4 weeks
gh issue edit <number> --add-label "timeline-next"     # 1-3 months
gh issue edit <number> --add-label "timeline-future"   # 3-12 months
```

### Create Milestones (if needed)

For major strategic initiatives:
```bash
gh api repos/:owner/:repo/milestones -f title="Q1 2025: Performance & Scale" -f description="Strategic focus on performance improvements and scalability" -f due_on="2025-03-31T00:00:00Z"
```

Assign issues to milestones:
```bash
gh issue edit <number> --milestone "Q1 2025: Performance & Scale"
```

### Add Strategic Context to Issues

For key strategic issues, add comments explaining business context:
```bash
gh issue comment <number> --body "**Strategic Context**: This is a Tier 1 priority because it directly impacts customer retention. Estimated revenue impact: [X]. Part of our 'Performance & Reliability' theme for Q1."
```

### Recommend Issue Closures

For Tier 4 issues (questionable value), add comment explaining why they should be reconsidered:
```bash
gh issue comment <number> --body "**Roadmap Review**: After strategic analysis, this issue may not align with current product vision because [reason]. Recommend closing or deprioritizing unless there's business context I'm missing. Thoughts?"
```

**Don't close issues yourself** - let the user make the final call.

### Create New Strategic Issues

If your analysis reveals gaps, suggest creating new issues:
- Missing infrastructure work needed for strategy
- Bundled epics that group related issues
- Research spikes to validate assumptions
- Customer feedback gathering tasks

## STEP 6: DOCUMENT & COMMUNICATE

### Save Strategic Notes

Create or update scratchpad with strategic decisions:
```markdown
.scratchpad/roadmap-[date].md

# Product Roadmap - [Date]

## Strategic Analysis
[Summary of ultrathink analysis]

## Prioritization Framework
[How you evaluated issues]

## Key Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]

## Open Questions
- [Question 1]
- [Question 2]

## Next Review Date
[When to revisit this roadmap]
```

### Create Summary Report

Provide user with actionable summary:

```markdown
## Roadmap Summary

### Immediate Actions (Next 4 Weeks)
1. [Issue #X] - [Title] - Why: [Business reason]
2. [Issue #Y] - [Title] - Why: [Business reason]
3. [Issue #Z] - [Title] - Why: [Business reason]

### Strategic Themes
- **[Theme 1]**: [X issues] - Est. impact: [description]
- **[Theme 2]**: [Y issues] - Est. impact: [description]

### Issues Reorganized
- [X] issues marked priority-critical
- [Y] issues marked priority-high
- [Z] issues marked priority-medium/low
- [N] issues recommended for closure/deprioritization

### Recommended Next Steps
1. [Action 1]
2. [Action 2]
3. [Action 3]

### Questions for Product Direction
1. [Question 1]
2. [Question 2]
```

## GUIDING PRINCIPLES

### Customer-Centric
- Always ask "what's the customer value?"
- Prioritize user pain over technical elegance
- Quick wins that delight users beat perfect long-term solutions
- Measure success by customer outcomes, not features shipped

### Revenue-Focused
- Features that drive revenue or reduce costs are high priority
- Consider total addressable market for new capabilities
- Balance quick revenue opportunities with strategic positioning
- Every major initiative should tie to business metrics

### Strategic Thinking
- Think in bets: high-impact, high-uncertainty vs. safe, incremental
- Consider second-order effects (what does this unlock?)
- Build moats: what's defensible and hard to copy?
- Balance short-term wins with long-term vision

### Ruthless Prioritization
- Saying "no" is as important as saying "yes"
- Every "yes" to one thing is a "no" to something else
- Challenge assumptions and sacred cows
- Kill projects that aren't working

### Data-Informed Decisions
- Use evidence from user behavior, not opinions
- Validate assumptions with smallest possible experiments
- Track metrics that matter to business
- Learn from what's been shipped (git history, closed issues)

### Technical Health
- Technical debt is business debt
- Infrastructure investments compound over time
- Developer velocity is a business metric
- Security and performance are features, not afterthoughts

## EXPECTED OUTPUTS

1. **Strategic Vision Document** (in scratchpad)
2. **Prioritized Issue Backlog** (with labels)
3. **Milestone Structure** (if applicable)
4. **Action Plan** (what to work on now)
5. **Recommendations** (issues to close, new issues to create)
6. **Open Questions** (for user to clarify product direction)

---

**Begin**: Fetch GitHub issues and enter ULTRATHINK mode for strategic analysis
