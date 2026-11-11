---
description: Review code changes or a PR — delegates to specialist agents for quality, security, and performance
argument-hint: "[PR number | staged | file path — or omit to auto-detect]"
---

Review code changes: $ARGUMENTS

## Step 1: Determine Scope

Parse the argument:
- **PR number** (e.g., `123`): fetch with `gh pr view $ARGUMENTS` and `gh pr diff $ARGUMENTS`
- **No argument**: try `gh pr view` for current branch. If no PR, fall back to `git diff --cached` then `git diff`
- **`staged`**: review `git diff --cached`
- **File path**: review that file's current state

If no changes found, say so and stop.

## Step 2: PR Quality Check (PR path only)

Skip for staged/file reviews.
- Title: descriptive and under 72 chars?
- Description: explains the *why*? Includes a test plan?
- Size: flag if >500 lines changed (suggest splitting)
- CI: `gh pr checks` — passing or failing?
- Unresolved comments: list open threads

## Step 3: Code Review (delegate to agents)

1. **Always**: delegate diff to `standards-reviewer` (frontend) or `backend-reviewer` (backend)
2. **If security-sensitive code** (auth, tokens, input handling, guards): delegate to `security-reviewer`
3. **If performance-sensitive code** (queries, loops, caching, re-renders): delegate to `performance-reviewer`
4. **If API contract changed** (DTOs, controllers, routes): delegate to `contract-reviewer`

## Step 4: Synthesize Report

```
## Review: [scope]

### Critical / High
- [Agent] File:Line — issue

### Medium
- [Agent] File:Line — issue

### Low / Notes
- [Agent] File:Line — issue

### Verdict
[Ready to merge / Needs changes — summarize blockers]
```

Deduplicate findings. Attribute each to the agent that found it.
