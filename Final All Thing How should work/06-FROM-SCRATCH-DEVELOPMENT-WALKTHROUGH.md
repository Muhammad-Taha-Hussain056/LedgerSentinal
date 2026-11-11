# 06. From Scratch: The Complete Development Walkthrough

> **The definitive tutorial: How to start with an empty repository, how Claude interacts with the Orchestra without blowing up tokens, and the exact script to follow from Day 1 to Production.**

---

## 1. How Claude Sees the Orchestra (The Secret to Zero Token Burn)

You might wonder: *"How does Claude know about the whole `.claude/` folder? Do I need to tell Claude to read all 39 skills at the start?"*

**NO! NEVER tell Claude to "read the whole orchestra folder".**
If you do that, you load 150,000 tokens into memory before writing a single line of code. You will hit your rate limit in 10 minutes.

### How Progressive Disclosure Works:
Claude Code and the Orchestra are designed to load context **automatically and on-demand**:

```
1. ON STARTUP (Automatic — ~1,500 tokens):
   Claude automatically reads:
   ├── CLAUDE.md (The Constitution & Golden Rules)
   └── .claude/settings.json (Registers hooks and permissions)
   Then runs .claude/hooks/session-start.mjs (Prints pinned stack versions).

2. ON DEMAND (Triggered by your prompt — ~2,000 tokens):
   You tell Claude: "Load skill .claude/skills/database/repository-pattern".
   Claude reads ONLY that single skill file when it needs it.

3. FOR CONTROL (Read from disk — ~1,500 tokens):
   Claude reads docs/execution.md to see what task is next.
```

**Total context at start: Less than 5,000 tokens.** (Instead of 150,000 tokens!)

---

## 2. The Complete Project Lifecycle: From Zero to Deployed

Every software project you build will follow these exact **5 Phases**:

```
PHASE 0: Repo Scaffold & Config        (1 session  — 15 mins)
PHASE 1: Product Discovery             (1 session  — 15 mins) ──► Freezes docs/product.md
PHASE 2: Architecture & Contracts     (1 session  — 15 mins) ──► Freezes docs/architecture.md
PHASE 3: Task Breakdown                (1 session  — 10 mins) ──► Creates docs/execution.md
PHASE 4: Sliced Implementation Sprints (20 mins per task)    ──► 1 Task = 1 Git Commit
```

---

## 3. Step-by-Step Walkthrough (What You Type & What You Do)

### PHASE 0: Repo Scaffold & Setup (Session 1)
*Goal: Ensure Git is initialized and project configuration is locked in.*

1. In your terminal:
   ```bash
   git init
   git branch -M main
   ```
2. Open Claude. Paste this prompt:
   ```text
   Inspect our project directory and .claude/orchestra.config.json.
   Verify that packageManager, frontendPackageManager, and stack settings match:
   - Backend: NestJS 10, PostgreSQL, Drizzle ORM
   - Frontend: Next.js 14 App Router, pnpm
   Verify that CLAUDE.md is present and .claude/hooks are executable.
   Report your findings and STOP.
   ```
3. Claude confirms the stack is set. Commit to Git:
   ```bash
   git add .
   git commit -m "chore: initialize repository with orchestra configuration"
   ```
4. **Close session.**

---

### PHASE 1: Product Discovery (Session 2)
*Goal: Define what we are building and what is explicitly OUT OF SCOPE. No code!*

1. Open a fresh Claude session.
2. Paste this prompt:
   ```text
   Act as a Senior Product Analyst. We are creating docs/product.md.
   Rules: DISCOVERY ONLY. Strictly NO CODE. Do not design database schemas yet.

   My Project Idea:
   [PASTE YOUR RAW 2-3 SENTENCE IDEA HERE, e.g.:
   "A SaaS Lead Management system where authenticated users can create leads, view paginated leads, update lead status, and track deal stages."]

   Your task:
   1. Restate the problem statement and target persona.
   2. Define an explicit MVP scope list (max 4-5 items).
   3. Define an explicit OUT-OF-SCOPE list (what we will NOT build now).
   4. Ask me up to 4 high-impact questions to clarify business rules. Recommend defaults.
   5. Produce a numbered Functional Requirements table [ID, Requirement, Acceptance Condition].

   Format your output as docs/product.md and wait for my review.
   ```
3. Claude will ask you 3–4 questions. Answer them in 1–2 lines.
4. Claude writes `docs/product.md`.
5. Review `docs/product.md`. If good:
   ```bash
   git add docs/product.md
   git commit -m "docs: approve frozen product requirements"
   ```
6. **Close session.**

---

### PHASE 2: Technical Architecture & Contracts (Session 3)
*Goal: Design the database schema and API contracts. Strictly no code!*

1. Open a fresh Claude session.
2. Paste this prompt:
   ```text
   Act as a Principal Software Architect.
   Read docs/product.md and CLAUDE.md.
   We are creating docs/architecture.md. Strictly NO IMPLEMENTATION CODE.

   Produce:
   1. Folder Boundaries (apps/api vs apps/web vs packages/contracts).
   2. Dedicated Gateway Security & App Cross-Cutting Structure:
      - `src/decorators/` (@AuthN, @AuthZ, @CurrentUser, @ApiRoute, @ApiPagination, @ApiFormData)
      - `src/filters/` (exceptions.filter.ts for RFC-9457 error mapping via APP_FILTER)
      - `src/guards/` (authN.guard.ts, authZ.guard.ts via APP_GUARD)
      - `src/interceptors/` (response.interceptor.ts, logging.interceptor.ts via APP_INTERCEPTOR)
      - `src/interfaces/` (actor-context.interface.ts, request-context.interface.ts)
      - `src/middleware/` (correlation-id.middleware.ts, raw-body.middleware.ts)
      - `src/pipes/` (validation.pipe.ts, required.pipe.ts)
   3. PostgreSQL + Drizzle Database Schema:
      - Table names (plural snake_case)
      - Column types and defaults
      - Foreign keys with ON DELETE CASCADE and indexes
      - Status / filter indexes
   4. API Contract Table:
      - Method, Endpoint path, Auth Guard, Request Body Schema, Success Response, Error Codes.
   5. Error format: RFC-9457 standard.
   6. Security & Tenant Isolation rules.

   Save this to docs/architecture.md and wait for my review.
   ```
3. Review `docs/architecture.md`. Check that Gateway security core is defined, foreign keys have indexes, and endpoints have response schemas.
4. If approved:
   ```bash
   git add docs/architecture.md
   git commit -m "docs: approve frozen technical architecture and contracts"
   ```
5. **Close session.**

---

### PHASE 3: Task Breakdown (Session 4)
*Goal: Slice the architecture into 15–20 minute micro-tasks.*

1. Open a fresh Claude session.
2. Paste this prompt:
   ```text
   Act as a Technical Lead.
   Read docs/product.md and docs/architecture.md.
   We are creating docs/execution.md.

   Rules:
   1. Break the MVP into ordered, testable micro-tasks.
   2. Sizing rule: Each task must take 15-20 minutes and touch only 2 to 4 files.
   3. Every task must have an automated verification command (e.g. npm test or tsc).
   4. Slicing pattern:
      - SETUP-01: Monorepo workspace & configs
      - SETUP-02: App shell, docker-compose & database connection
      - SETUP-03: Gateway Core (guards, filters, interceptors, pipes, decorators, middleware)
      - [MODULE]-01: Database Schema & Migration
      - [MODULE]-02: Repository & Port Interface
      - [MODULE]-03: Domain Service & Business Logic
      - [MODULE]-04: Controller, DTOs & Swagger
      - [MODULE]-05: Frontend UI (if applicable)

   Save this to docs/execution.md with initial state NOT_STARTED.
   ```
3. Review `docs/execution.md`.
4. Commit:
   ```bash
   git add docs/execution.md
   git commit -m "docs: approve execution task plan"
   ```
5. **Close session.**

---

### PHASE 4: The 5-Step Coding Sprint (Every Coding Session)
*This is the loop you run for every single task in `docs/execution.md`.*

```
Step 1: Cold-Start Prompt ──► Step 2: Approve Scope ──► Step 3: Implement & Test
                                                              │
                                                              ▼
Step 5: Commit & Exit Session ◄── Step 4: 60-Second Diff Audit
```

#### Step 1: Open Fresh Session & Paste Cold-Start Prompt:
```text
We are resuming work on this repository.
Read CLAUDE.md and docs/execution.md.
Run 'git status' to inspect current repository state.
Find the first approved task whose status is NOT_STARTED or IN_PROGRESS.

Before writing any code, state:
1. Task ID and objective.
2. Exact files you plan to touch (max 2–3 files).
3. The exact verification command we will run to prove it works.

Wait for my approval.
```

#### Step 2: Approve Scope
Look at Claude's response.
* If it proposes 2–3 files: Reply: `"Approved. Implement and run the verification command."`
* If it tries to touch 8 files: Reply: `"Too big. Break this down. Only touch [file A and B] first."`

#### Step 3: Implement & Verify
Claude writes the code and runs the test command:
* E.g. `npm test user.drizzle.repository.spec.ts`
* E.g. `npx tsc --noEmit`
* If tests pass, move to Step 4.
* If a test fails: Run the **Diagnostic Prompt** (Prompt 6 in Playbook). Remember the **Two-Strike Rule**!

#### Step 4: 60-Second Diff Audit
In your terminal, run:
```bash
git diff
```
Quickly check:
- Did it edit any unrelated files? (No)
- Did it add random npm packages? (No)
- Did it delete or cheat on tests? (No)

#### Step 5: Commit & Exit
Tell Claude:
```text
Stop coding. Update docs/execution.md to mark [TASK-ID] as VERIFIED with test evidence.
```
In your terminal:
```bash
git add .
git commit -m "feat([module]): complete [TASK-ID] with passing tests"
```
**CLOSE CLAUDE.** Take a 3-minute break. Open a fresh session for the next task!

---

## 4. The 3 Things That Make You Better Than Senior Developers

By following this exact procedure:
1. **You never get lost:** `docs/execution.md` always tells you what was done and what comes next.
2. **You never get blamed for broken code:** Every single commit is backed by passing unit tests and green typechecks.
3. **You never burn tokens:** Your context stays under 15k tokens per session, meaning you will never run out of Claude credits or hit session limits.
