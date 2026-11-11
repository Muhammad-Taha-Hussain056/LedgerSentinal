---
description: Scan changes, commit, push, and create a PR — with confirmation at each step
argument-hint: "[optional commit message or PR title]"
---

Ship the current changes: $ARGUMENTS

## Step 1: Scan

- Run `git status` to see all changed, staged, and untracked files
- Run `git diff --stat` to see a summary of changes
- Run `git log --oneline -5` to see recent commit style
- Present a clear summary to the user
- If there are no changes, say so and stop

## Step 2: Stage & Commit

- Propose which files to stage. **Never stage**:
  - Secrets: `.env*`, `*.pem`, `*.key`, `credentials.json`
  - Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` (unless intentionally updated)
  - Generated: `*.gen.ts`, `*.generated.*`, `*.min.js`, `*.min.css`
  - Build output: `dist/`, `build/`, `.next/`, `__pycache__/`
  - Dependencies: `node_modules/`, `vendor/`
  - OS/editor: `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/settings.json`
- Draft a commit message matching the repo's existing style
- **ASK the user to confirm or edit** the files and message
- Only after confirmation: stage and commit

## Step 3: Push

- Check if the current branch has an upstream remote
- If not, propose `git push -u origin <branch>`
- **ASK the user to confirm** before pushing
- Only after confirmation: push

## Step 4: Pull Request

- Check if a PR already exists (`gh pr view`)
- If it exists, show the URL and stop
- Analyze all commits on this branch vs the base
- Draft a PR title (under 72 chars) and body with summary + test plan
- **ASK the user to confirm or edit**
- Only after confirmation: create with `gh pr create`

## Rules

- NEVER skip a confirmation step
- NEVER force-push
- NEVER commit .env or credential files
- If the user says "skip" at any step, move to the next
