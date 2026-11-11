---
description: Review the current backend changes against orchestra standards and golden rules
argument-hint: "[optional: paths or branch to review, default: all changes vs origin/main]"
---

Run a standards review of $ARGUMENTS (default: all changes on this branch vs `origin/main`).

1. Delegate to `backend-reviewer` for code quality (architecture, patterns, naming, coupling).
2. Delegate to `contract-reviewer` for API contract review (DTOs, guards, response shape, error codes).
3. If any changed file is a service or handler, also check pattern compliance via `backend-reviewer`.
4. Combine all reports into one table sorted by severity, then give a single verdict.
5. Do not fix anything unless I ask; list the fixes in order of priority.
