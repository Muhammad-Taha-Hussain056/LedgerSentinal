# 05. How to Create the Docs: product.md, architecture.md & execution.md

> **Step-by-step walkthrough: How to turn a rough 1-sentence idea into the 3 core project control documents, and how to use them to drive the implementation of ANY feature.**

---

## 1. The 3-Phase Document Pipeline

Before writing a single line of code, you run **3 short Plan-Mode sessions** to create the 3 core documents. Each takes 5–10 minutes:

```
[Your Rough Idea]
       │
       ▼  (Prompt 1: Discovery Session - 10 mins)
[docs/product.md]  <── "What are we building & what is out of scope?"
       │
       ▼  (Prompt 2: Architecture Session - 10 mins)
[docs/architecture.md]  <── "What is the DB schema & API contract?"
       │
       ▼  (Prompt 3: Task Breakdown Session - 5 mins)
[docs/execution.md]  <── "What are the 15-minute micro-tasks?"
       │
       ▼  (Prompts 4–7: Sliced Execution Sessions)
[Working, Tested Code in Git]
```

Once `product.md` and `architecture.md` are approved, **THEY ARE FROZEN.**
They become the immutable truth that stops the AI from hallucinating.

---

## 2. Phase 1: How to Create `docs/product.md` (Requirements)

### The Problem:
If you tell an AI: *"Build a Lead Management feature"*, it will hallucinate a massive system with email autoresponders, CSV importers, Zapier webhooks, and complex role permissions that you didn't ask for.

### How to Create It:
1. Open a clean session in **Plan Mode** (or state: *"DISCOVERY ONLY. NO CODE"*).
2. Copy and paste this prompt:

```text
Act as a Principal Product Analyst. We are creating docs/product.md.
Rules: DISCOVERY ONLY. Do not write code or design database schemas yet.

My Feature Idea:
"I want a Lead Management feature where authenticated users can create leads, view their own list of leads, edit lead details, and update lead status (NEW, CONTACTED, QUALIFIED, LOST)."

Your task:
1. Restate the core problem and target persona.
2. Define the explicit MVP scope (max 4-5 items).
3. Define the explicit OUT-OF-SCOPE list (things we will NOT build now).
4. Ask me up to 4 high-impact questions to clarify business rules. For each, recommend a sensible default.
5. Produce a numbered Functional Requirements table with columns: [ID, Requirement, Testable Acceptance Condition].

Save the approved output to docs/product.md.
```

### What You Do Next:
The AI will ask you 3–4 questions (e.g. *"Should leads be shared across a team or private to the user?"*).
You answer them:
> *"1. Private to the user. 2. Accept your recommended default for lead status validation."*

The AI generates `docs/product.md`. You review it, verify the acceptance conditions, and **Freeze it**.

---

## 3. Phase 2: How to Create `docs/architecture.md` (Technical Contract)

### The Problem:
If you don't define the database schema and API contracts upfront, the AI will invent random table names (e.g. `tbl_leads`, `lead_items`, `prospects`), forget foreign key indexes, and use inconsistent HTTP response shapes.

### How to Create It:
1. Open a clean session.
2. Copy and paste this prompt:

```text
Act as a Principal Software Architect.
Read docs/product.md and CLAUDE.md.
We are creating docs/architecture.md. Strictly NO IMPLEMENTATION CODE.

Stack: NestJS 10, PostgreSQL, Drizzle ORM, Next.js 14 App Router, TypeScript strict.

Produce:
1. Module Boundary & Directory Placement:
   - apps/api (or apps/gateway) vs apps/web.
   - Dedicated Gateway & App Security Cross-Cutting Structure:
     `src/decorators/`, `src/filters/`, `src/guards/`, `src/interceptors/`, `src/interfaces/`, `src/middleware/`, `src/pipes/`.
   - Feature modules: Flat structure under `src/modules/<feature>/` (controllers, services, dto, constants).
2. Gateway Security Core:
   - Guard sequence: `authN.guard.ts` (authenticates token -> sets `ActorContext`) -> `authZ.guard.ts` (checks permissions).
   - Global exception normalization: `exceptions.filter.ts` (RFC-9457).
   - Response envelope & audit interceptors.
3. Database Schema (PostgreSQL + Drizzle):
   - Table names (plural snake_case)
   - Columns, types, defaults
   - Foreign keys with ON DELETE CASCADE and indexes
   - Status/filter indexes
4. API Contract Table:
   - Method, Endpoint path, Auth Guard, Request Body Schema, Success Response (200/201), Error Codes (400, 401, 404).
5. Error Format: Standard RFC-9457 format.
6. Explicitly Deferred Complexity: Architectural items we are deferring.

Save this to docs/architecture.md and wait for my review.
```

### Review Gate:
Before approving `docs/architecture.md`, inspect:
- Are the Gateway cross-cutting security layers defined (`guards`, `filters`, `interceptors`, `decorators`, `pipes`)?
- Are all foreign keys indexed?
- Does every endpoint have an explicit success response schema?
- Are error codes defined?
If yes, approve and **Freeze `docs/architecture.md`**.

---

## 4. Phase 3: How to Create `docs/execution.md` (Task Control Board)

### The Problem:
If you don't slice work into 15-minute tasks, the AI tries to write the entire feature in one turn, resulting in context window blowout and rate limit exhaustion.

### How to Create It:
1. Copy and paste this prompt:

```text
Act as a Technical Lead.
Read docs/product.md and docs/architecture.md.
We are creating docs/execution.md.

Rules:
1. Break this feature into ordered, testable micro-tasks.
2. Each task must take no more than 15-20 minutes and touch only 2 to 4 files.
3. Every task must have an automated verification command (e.g. npm test or tsc).
4. Slicing pattern:
   - SETUP-01: Monorepo workspace config
   - SETUP-02: App shell & DB connection
   - SETUP-03: Gateway Core (guards, filters, interceptors, pipes, decorators, middleware)
   - Task 1: Schema & Migration SQL
   - Task 2: Domain Entity, Repository Port & Implementation
   - Task 3: Domain Service & Business Logic
   - Task 4: DTOs, Controller, Swagger & Module Wiring
   - Task 5: Frontend UI (if applicable)

Output this as the Master Task Table in docs/execution.md.
```

The AI outputs `docs/execution.md`. This becomes your living flight recorder.

---

## 5. How to Implement EVERY Feature Using the 3 Parts

Now that the 3 documents exist, you can build **ANY feature** (Leads, Auth, Billing, Projects, Invoices) using the Formula 1 Machine:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE FEATURE FACTORY                             │
│                                                                        │
│ 1. THE STEERING WHEEL (docs/execution.md)                              │
│    Tells you: "The active task is LEAD-01 (Repository Layer)."         │
│                                                                        │
│ 2. THE ENGINE (.claude/skills/database/repository-pattern)             │
│    Gives the AI: The exact TypeScript pattern for Symbol tokens,       │
│    ports, and Drizzle repositories.                                    │
│                                                                        │
│ 3. THE BRAKES (npx tsc --noEmit && npm test)                           │
│    Verifies: Zero compiler errors and 3 unit tests green.              │
│    If AI fails twice ──► git checkout . (Two-Strike Rule).            │
│                                                                        │
│ 4. GIT COMMIT & HANDOFF                                                │
│    git commit -m "feat(lead): implement lead repository (LEAD-01)"     │
│    Update execution.md ──► Close session.                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Summary: Where Each File Lives in Your Repository

```
D:\AI Orchestra Final - Copy\
├── CLAUDE.md                            <-- Global Constitution
├── docs/
│   ├── product.md                       <-- Created in Phase 1 (FROZEN)
│   ├── architecture.md                  <-- Created in Phase 2 (FROZEN)
│   └── execution.md                     <-- Created in Phase 3 (ACTIVE LIVING DOC)
├── Final All Thing How should work/     <-- Your Master Operating Manual
│   ├── 00-MASTER-ORCHESTRA-ARCHITECTURE.md
│   ├── 01-SYSTEM-SETUP-AND-HOOKS.md
│   ├── 02-HYBRID-AGENT-WORKFLOW.md
│   ├── 03-AUTH-MODULE-MASTERCLASS.md
│   ├── 04-DAILY-DEVELOPER-RUNBOOK.md
│   └── 05-HOW-TO-CREATE-THE-DOCS-AND-SPECIFICATIONS.md  <-- This guide
└── ai-session-playbook/templates/       <-- Raw copy-paste templates
```
