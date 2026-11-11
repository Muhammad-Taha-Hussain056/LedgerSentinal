---
description: Emergency production fix — minimal change, critical tests only, ship fast
argument-hint: "[issue number, error message, or description of production problem]"
---

Hotfix for: $ARGUMENTS

## Step 1: Assess Severity

- What is broken? Who is affected? Is there a workaround?
- Is this a security issue, data loss, or user-blocking bug?
- State the urgency and blast radius

## Step 2: Create Hotfix Branch

```bash
git checkout main && git pull
git checkout -b hotfix/<short-description>
```

## Step 3: Minimal Fix

- Apply the **smallest possible change** that resolves the issue
- Do NOT refactor, clean up, or improve nearby code
- Do NOT add features or change unrelated behavior
- Comment the fix with a reference to the issue

## Step 4: Critical Tests Only

- Run only the test suites relevant to the fix
- If no test exists for this case, write one minimal regression test
- Skip unrelated test suites to ship faster

## Step 5: Ship

- Use `/ship` to commit, push, and create PR
- PR title: `hotfix: <short description>`
- PR body: include the issue reference, root cause, and what was changed
- Request immediate review

## Rules

- Hotfix scope: ONE bug, ONE fix, ONE PR
- No refactoring. No cleanup. No "while we're here" changes.
- If the fix is complex or risky, escalate — don't hotfix
