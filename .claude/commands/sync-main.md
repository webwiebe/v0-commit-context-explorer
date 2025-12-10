---
description: Fetch and merge origin/main into current branch, resolving any conflicts
---

# Sync with Main Branch

Integrate the latest changes from `origin/main` into the current branch and resolve any merge conflicts that arise.

## STEP 1: ASSESS CURRENT STATE

\`\`\`bash
git status
git branch --show-current
\`\`\`

- Ensure working directory is clean (no uncommitted changes)
- If there are uncommitted changes, stash them first with `git stash`
- Note the current branch name

## STEP 2: FETCH AND MERGE

\`\`\`bash
git fetch origin main
git merge origin/main
\`\`\`

If the merge succeeds without conflicts, skip to STEP 4.

## STEP 3: RESOLVE CONFLICTS

If there are merge conflicts:

1. **Identify conflicting files**:
   \`\`\`bash
   git diff --name-only --diff-filter=U
   \`\`\`

2. **For each conflicting file**:
   - Read the file to understand both versions
   - Analyze what changes were made in each branch
   - Determine the correct resolution that preserves both sets of functionality
   - Edit the file to resolve conflicts (remove conflict markers `<<<<<<<`, `=======`, `>>>>>>>`)
   - Ensure the resolved code is syntactically correct and logically sound

3. **Stage resolved files**:
   \`\`\`bash
   git add <resolved-file>
   \`\`\`

4. **After all conflicts are resolved**:
   \`\`\`bash
   git commit -m "Merge origin/main into $(git branch --show-current)"
   \`\`\`

## STEP 4: VERIFY

1. **Check merge completed**:
   \`\`\`bash
   git status
   git log --oneline -5
   \`\`\`

2. **Run project checks** (if applicable):
   \`\`\`bash
   pnpm install  # in case dependencies changed
   pnpm build
   pnpm lint
   \`\`\`

3. **If stashed changes exist**:
   \`\`\`bash
   git stash pop
   \`\`\`
   Resolve any stash conflicts the same way as merge conflicts.

## STEP 5: REPORT

Summarize what happened:
- Number of commits merged
- Any conflicts that were resolved and how
- Any build/lint issues found and fixed
- Current state of the branch

---

**Begin**: Check git status and start STEP 1
