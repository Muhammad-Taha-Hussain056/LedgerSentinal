# 00. Master Orchestra Architecture: The Engine, Brakes & Steering Wheel

> **The definitive operating manual for building full-stack software with AI agents without token exhaustion, context decay, or hallucination.**

---

## 1. The Core Metaphor: How the System Works Together

Building full-stack software with AI coding agents is like piloting a Formula 1 car:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE STEERING WHEEL (Control)                          │
│               The 4 Core Documents + Sliced Prompts                         │
│  - product.md (Where are we going?)                                         │
│  - architecture.md (What are the technical roads?)                          │
│  - execution.md (Which lap are we on right now?)                            │
│  - Sliced Prompts (Turn left, shift gear, brake now)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        THE ENGINE (Power & Rules)                           │
│                     The Full-Stack Orchestra (.claude/)                     │
│  - .claude/skills/ (NestJS, Next.js, Drizzle, Repository Pattern)          │
│  - .claude/rules/ (Golden rules: no ORM in controllers, Symbol tokens)      │
│  - .claude/orchestra.config.json (Project-specific settings & stack pins)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        THE BRAKES (Safety & Limits)                         │
│                     Mechanical Gates & Hard Exits                           │
│  - TypeScript Compiler (tsc --noEmit)                                       │
│  - Automated Test Suites (Jest / Vitest)                                    │
│  - 60-Second Git Diff Audits                                                │
│  - The Two-Strike Bug Rule                                                  │
│  - 30-Minute Hard Session Exit Trigger                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 1. The Engine: `.claude/` (Knowledge & Standards)
Your `.claude/` folder contains your team's cumulative senior engineering expertise:
- **`skills/`**: Tactical guides on how to implement specific patterns (e.g., `repository-pattern`, `database-engineering`, `nestjs-engineering`).
- **`rules/`**: Architectural laws that must never be broken (e.g., "Controllers validate, delegate, and return—nothing else").
- **`hooks/`**: Deterministic shell hooks that run before and after tool actions (`guard-write.mjs`, `scan-secrets.mjs`, `protect-files.mjs`).

### 2. The Steering Wheel: The 4 Documents & Sliced Prompts
The AI has no long-term memory. It only knows what is in its current context window.
- **`CLAUDE.md`**: The Constitution loaded at session start.
- **`docs/product.md`**: The Frozen Business Requirements & Explicit MVP boundaries.
- **`docs/architecture.md`**: The Frozen Tech Stack, Database Schema & API Contract tables.
- **`docs/execution.md`**: The Living Flight Log with task IDs, statuses, and verification proof.

### 3. The Brakes: Mechanical Proofs (Your Protection)
As a developer with ~1 year of experience, you never need to argue with an AI or guess if code works. **You let the machine prove it:**
- If `npx tsc --noEmit` fails ──► Code is rejected.
- If `npm test` fails ──► Code is rejected.
- If the AI fails twice on the same bug ──► Discard with `git checkout .`, close the session, and start fresh.

---

## 3. The Hybrid Agent Model: Maximizing Quality While Saving 80% Tokens

Your repository contains specialized agents in [`.claude/agents/`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/agents/).

| Mistake (Token Waste) | The Hybrid Solution (Token-Safe) |
|---|---|
| Spawning subagents for routine coding, creating massive conversational trees and burning 100k tokens per task. | **Single-Agent Coding:** Run a single lean session for coding. The AI loads only the required skill on-demand. |
| Never having code reviewed by a senior. | **Specialist Review Gates:** Invoke specialized agents (`database-verifier`, `security-reviewer`, `contract-reviewer`) *only* as read-only inspectors at critical milestones. |

### The 3 Inspection Gates:
1. **Gate 1 (Database Gate):** Run `database/database-architect` to design the schema, and `database/database-verifier` to audit indexes before running migrations.
2. **Gate 2 (Coding Phase):** Pure Single-Agent mode. Write code task-by-task (2–3 files per turn).
3. **Gate 3 (Pre-Merge Gate):** Run `fullstack/security-reviewer` and `backend/contract-reviewer` to audit the Git diff before opening a Pull Request.

---

## 4. Master Directory Structure

Here is how your workspace is structured to make this seamless:

```
D:\AI Orchestra Final - Copy\
├── .claude/                                  <-- The Engine
│   ├── agents/                               <-- Specialized review agents
│   ├── skills/                               <-- Domain engineering skills
│   ├── hooks/                                <-- Security & validation hooks
│   └── orchestra.config.json                 <-- Project stack configuration
├── CLAUDE.md                                 <-- Core operating instructions
├── docs/                                     <-- The Living Project Board
│   ├── product.md                            <-- Frozen requirements
│   ├── architecture.md                       <-- Frozen technical design
│   └── execution.md                          <-- Active task status & handoff
└── Final All Thing How should work/          <-- THE MASTER PLAYBOOK
    ├── 00-MASTER-ORCHESTRA-ARCHITECTURE.md    <-- You are here
    ├── 01-SYSTEM-SETUP-AND-HOOKS.md          <-- Config & hooks setup
    ├── 02-HYBRID-AGENT-WORKFLOW.md           <-- How to run agents token-safely
    ├── 03-AUTH-MODULE-MASTERCLASS.md         <-- Complete reference implementation
    ├── 04-DAILY-DEVELOPER-RUNBOOK.md         <-- Day-to-day execution protocol
    ├── 05-HOW-TO-CREATE-THE-DOCS-AND-SPECIFICATIONS.md <-- How to create docs & drive any feature
    ├── 06-FROM-SCRATCH-DEVELOPMENT-WALKTHROUGH.md <-- Literal Day-1 tutorial & prompts
    ├── 07-ORCHESTRA-AUDIT-AND-GAP-ANALYSIS.md <-- Pre-Flight gap audit and testing
    └── 08-GAP-RESOLUTION-AND-SIMULATION-RESULTS.md <-- Complete resolution & simulation
```

---

## 5. Monorepo & Gateway Security Architecture (CosmonyX Standard)

Your backend application (`apps/api/src/` or `apps/gateway/src/app/`) maintains a strict separation between cross-cutting security infrastructure and business feature modules:

```
apps/api/src/ (or apps/gateway/src/app/)
├── decorators/          # Cross-cutting metadata & compound decorators
│   ├── authn.decorator.ts           # @AuthN(), @Public()
│   ├── authz.decorator.ts           # @AuthZ(), @Permissions(), @Roles()
│   ├── current-user.decorator.ts    # @CurrentUser() param decorator
│   ├── api-route.decorator.ts       # Unified Swagger + HTTP method decorator
│   ├── api-pagination.decorator.ts  # Standard query pagination parameters
│   ├── api-form-data.decorator.ts   # Multipart / file upload Swagger decorator
│   └── index.ts
├── filters/             # Global exception filters
│   ├── exceptions.filter.ts         # RFC-9457 error normalization (APP_FILTER)
│   └── index.ts
├── guards/              # Authentication & Authorization gates
│   ├── authN.guard.ts               # JWT verification & ActorContext attachment (APP_GUARD)
│   ├── authZ.guard.ts               # RBAC & permission evaluation (APP_GUARD)
│   └── index.ts
├── interceptors/        # Request/Response transformation & audit
│   ├── response.interceptor.ts      # Standard envelope: { success, data, timestamp } (APP_INTERCEPTOR)
│   ├── logging.interceptor.ts       # Performance timing & correlation tracking (APP_INTERCEPTOR)
│   ├── activity-logs.interceptor.ts # Mutation audit logging (APP_INTERCEPTOR)
│   └── index.ts
├── interfaces/          # Shared security and context contracts
│   ├── actor-context.interface.ts   # ActorContext (userId, tenantId, email, roles, permissions)
│   ├── request-context.interface.ts # RequestWithActor (Express Request extended with actor)
│   ├── api-response.interface.ts    # Standard API response envelope shape
│   └── index.ts
├── middleware/          # Express transport middleware
│   ├── correlation-id.middleware.ts # Injects & forwards X-Correlation-Id
│   ├── raw-body.middleware.ts       # Preserves raw Buffer for webhook HMAC verification
│   └── index.ts
├── pipes/               # Boundary validation & sanitization
│   ├── validation.pipe.ts           # Global class-validator pipe with whitelist & transformation
│   ├── required.pipe.ts             # Explicit param / query requirement checks
│   └── index.ts
└── modules/             # Flat domain feature modules
    └── <feature>/
        ├── controllers/             # Transport handlers (@Controller, @ApiRoute)
        ├── services/                # Pure business logic (injects repository interfaces)
        ├── dto/                     # Request validation & response schemas
        ├── constants/               # Symbol injection tokens & domain enums
        └── <feature>.module.ts      # Feature DI wiring
```

