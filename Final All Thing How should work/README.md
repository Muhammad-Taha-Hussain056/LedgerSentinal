# Final All Thing How Should Work: Master Operating Manual

> **The Unified Operating System for Building Full-Stack Software with AI Agents.**  
> Seamlessly connects the `.claude/` Orchestra (Engine), the Mechanical Proofs (Brakes), and the Sliced Prompts & Templates (Steering Wheel) to guarantee high performance, zero hallucination, and rock-bottom token usage.

---

## Complete Document Index

| Document | Purpose |
|---|---|
| **[THE-ONE-DEFINITIVE-MASTER-WORKFLOW.md](THE-ONE-DEFINITIVE-MASTER-WORKFLOW.md)** | **THE MASTER BLUEPRINT (READ THIS FIRST):** The complete unified operating manual covering full workflow, 10 deep gaps patched, prompts, decisions, and guaranteed success metrics. |
| **[00-MASTER-ORCHESTRA-ARCHITECTURE.md](00-MASTER-ORCHESTRA-ARCHITECTURE.md)** | **The Core Metaphor:** How the Engine (.claude/), Brakes (Mechanical Gates), and Steering Wheel (Prompts & Docs) operate together as a Formula 1 system. |
| **[01-SYSTEM-SETUP-AND-HOOKS.md](01-SYSTEM-SETUP-AND-HOOKS.md)** | **System Protection:** How `orchestra.config.json` and the 6 background hooks (`session-start`, `guard-bash`, `guard-write`, `protect-files`, `scan-secrets`, `format-on-edit`) prevent disasters. |
| **[02-HYBRID-AGENT-WORKFLOW.md](02-HYBRID-AGENT-WORKFLOW.md)** | **Token Defense & Review Gates:** Why Single-Agent coding saves 85% tokens, and how to invoke specialist agents (`database-verifier`, `security-reviewer`, `contract-reviewer`) only at critical gates. |
| **[03-AUTH-MODULE-MASTERCLASS.md](03-AUTH-MODULE-MASTERCLASS.md)** | **End-to-End Reference Implementation:** The complete Authentication & Session Module (Postgres, Drizzle, Argon2, JWT token rotation, HttpOnly cookies, NestJS Guard, Next.js Auth Context) built across 5 micro-sessions. |
| **[04-DAILY-DEVELOPER-RUNBOOK.md](04-DAILY-DEVELOPER-RUNBOOK.md)** | **The Daily Operating Checklist:** Hour-by-hour workflow from morning git sync to 30-minute sprint cycles, bug diagnosis, and end-of-day standup updates. |
| **[05-HOW-TO-CREATE-THE-DOCS-AND-SPECIFICATIONS.md](05-HOW-TO-CREATE-THE-DOCS-AND-SPECIFICATIONS.md)** | **How to Create the Docs:** Step-by-step guide on how to create `product.md`, `architecture.md`, and `execution.md` from a raw idea, and use them to drive ANY feature. |
| **[06-FROM-SCRATCH-DEVELOPMENT-WALKTHROUGH.md](06-FROM-SCRATCH-DEVELOPMENT-WALKTHROUGH.md)** | **From Scratch Walkthrough:** Literal Day-1 tutorial: how Claude sees the orchestra, which prompt to type first, and how to execute every phase without token blowout. |
| **[07-ORCHESTRA-AUDIT-AND-GAP-ANALYSIS.md](07-ORCHESTRA-AUDIT-AND-GAP-ANALYSIS.md)** | **Pre-Flight Gap Analysis:** Audit of the 6 real-world gaps in the current setup and how to test before starting work. |
| **[08-GAP-RESOLUTION-AND-SIMULATION-RESULTS.md](08-GAP-RESOLUTION-AND-SIMULATION-RESULTS.md)** | **Gap Resolution & Simulation:** All architecture, package manager, cross-platform, contracts, and ORM questions resolved, plus 5 additional simulation gaps patched. |

---

## The 3 Cardinal Rules to Remember Every Day

1. **Never build a full module in one session.** Slicing it into 4 micro-sessions keeps tokens under 15k, prevents rate limit exhaustion, and produces 4 clean Git commits.
2. **Never argue with an AI.** Run `npx tsc --noEmit` and `npm test`. If mechanical tests fail, the code is rejected.
3. **Always trigger the Two-Strike Rule.** If an AI fails twice to fix a bug in the same session, run `git checkout .`, close the session, and restart clean.
