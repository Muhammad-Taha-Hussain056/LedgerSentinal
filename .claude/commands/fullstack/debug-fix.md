---
description: Find and fix a bug — from any source (error message, user report, or observed behavior)
argument-hint: "[issue number, error message, or description of the problem]"
---

Debug and fix: $ARGUMENTS

## Step 1: Understand the Bug

- Parse the argument to extract the error, expected vs actual behavior
- If an issue number is provided, fetch context with `gh issue view`
- Identify: which layer (frontend/backend/both), which feature, which route/endpoint

## Step 2: Reproduce

- Search the codebase for the error message or related code
- Read the relevant files to understand the current behavior
- Trace the data flow from input to output to find the failure point
- State clearly: "The bug is in [file:line] because [reason]"

## Step 3: Identify Root Cause

- Distinguish symptoms from root cause
- Check if similar patterns exist elsewhere (grep for the same anti-pattern)
- If the root cause is unclear, list hypotheses ranked by likelihood

## Step 4: Fix

- Apply the smallest change that fixes the root cause
- If similar bugs exist elsewhere, fix them all (don't leave landmines)
- Add or update a test that would have caught this bug (regression test)

## Step 5: Verify

- Run `npm run build && npm run lint && npm run test` (backend)
- Run `pnpm turbo run typecheck lint test --filter=...[HEAD]` (frontend)
- Report actual results

## Rules

- Fix the root cause, not the symptom
- Write a regression test before claiming fixed
- If the fix touches auth, permissions, or data access, request `security-reviewer`
- If the fix is unclear or risky, explain the tradeoffs before applying
