---
name: system-architecture
description: Use when a project needs architecture decisions, frontend profiles, application or service boundaries, shared packages, API and data ownership, deployment topology, or a consequential architecture change before implementation.
---

# System architecture

Produce a reviewable architecture within the user's settings. This skill defines decisions and handoffs; it does not authorize scaffolding. For materially unclear product intent, use the available project-discovery skill first. Routine changes reuse existing decisions without reopening the whole architecture.

## Procedure

1. Inspect the approved brief, current repository, contracts, versions, lockfiles and real reusable assets. Distinguish facts, proposals, assumptions and missing evidence. Preserve existing architecture and compatibility unless a change is approved.
2. Resolve independent axes: repository/workspace, frontend applications/composition, backend deployment, data ownership and infrastructure. The user selects F1, F2 or F3 before frontend project implementation. Missing selections block dependent work; urgency is not a profile selection. pnpm is required. Other libraries and topology need explicit project settings.
3. For frontend work, read [frontend-foundation](references/frontend-foundation.md), then exactly the selected profile: [F1 single app](references/frontend-f1-single-app.md), [F2 multiple apps](references/frontend-f2-multiple-apps.md), or [F3 microfrontends](references/frontend-f3-microfrontends.md). Read another profile only for an explicitly requested comparison or migration.
4. For consequential decisions, use [architecture-decisions](references/architecture-decisions.md). Map domains, owners, consumers, trust boundaries, sync/async communication, consistency, expected volume, queries/indexes, migration, reliability and operating cost. Read applicable sections of the [original standards](../../../../docs/specifications/standards/01-frontend-backend.md), [security/data standards](../../../../docs/specifications/standards/02-security-data-saas.md) and [API/data-flow contract](../../../../docs/specifications/addenda/2026-10-20-api-data-flow-contract.md). Detailed backend/database profile guides are not installed; report that gap.
5. Map each important journey across route, feature, contract, trusted server boundary, use case, persistence owner, effects, response and UI/cache/navigation. Serialize ownership of shared contracts and migrations before parallel implementation. Identify available assets versus modules still to build.
6. Compare two viable alternatives when a consequential decision is open. Explain correctness, security, performance, operations, cost, compatibility and reversibility. Do not manufacture alternatives for a locked decision or fabricate measurements.
7. Return the decision record, exact boundaries, operation handoff, failure cases, compatibility/recovery plan, measurable acceptance and planned evidence. Highlight blockers and the next authorized step. A read-only architect plans; an authorized implementer and verifier execute separately.

Keep small outputs in chat unless a project artifact is authorized. Load only relevant references and return changed decisions with links to existing records. Never equate documentation, a dependency install or one passing fixture with runtime compatibility, implemented modules or support for every project category.

File conventions: [Claude Code skills](https://code.claude.com/docs/en/skills); companion agent conventions: [Claude Code subagents](https://code.claude.com/docs/en/sub-agents). Rechecked 2026-10-21; native invocation remains unverified.
