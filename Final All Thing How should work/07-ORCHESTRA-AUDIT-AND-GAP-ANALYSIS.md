# 07. Orchestra Audit & Gap Analysis: Pre-Flight Verification

> **A realistic, production readiness simulation of the Orchestra (.claude/) across Backend, Database, and Frontend.**
> Identifies the 6 real-world gaps that will break your build or exhaust tokens, and provides the exact fixes.

---

## 1. Executive Summary: Is It Ready for Production?

### Verdict: **ARCHITECTURALLY READY, BUT FOUNDATIONALLY EMPTY.**

The conceptual architecture, golden rules, and safety hooks in `.claude/` are **exceptionally well-designed**:
- The Repository Pattern rules in `CLAUDE.md` are enterprise-grade.
- The hooks (`guard-bash.mjs`, `guard-write.mjs`) successfully block destructive commands and credentials.
- The prompt structures prevent hallucinations when executed one task at a time.

**HOWEVER, if you try to build a feature right now, it will immediately fail.**
Why? Because the repository is currently an **empty shell** without `package.json`, `pnpm-workspace.yaml`, or database configs.

Below is the verified audit of the **6 Critical Gaps** and how to fix each before starting work.

---

## 2. The 6 Critical Gaps Verified

### GAP 1: The "Cold Engine" Gap (Zero Monorepo Code Scaffolded)
* **What's Happening:** The repository contains only `.claude/`, `docs/`, and guides. There is no `package.json`, no `apps/api`, no `apps/web`, and no `packages/`.
* **The Failure:** If you ask Claude to execute `/new-module leads` or `npm run db:generate`, it immediately crashes with:
  `ENOENT: no such file or directory, open 'package.json'`
  The AI will panic, run `npm init`, install mismatched packages, and burn 30,000 tokens trying to debug its own missing environment.
* **The Fix:** You must complete **Task SETUP-01** (creating root `package.json`, `pnpm-workspace.yaml`, and `turbo.json`) before running any module commands.

---

### GAP 2: Package Manager Inconsistency (`npm` vs `pnpm` Collision)
* **What's Happening:**
  1. `orchestra.config.json` sets `"packageManager": "npm"` for backend, but `"frontendPackageManager": "pnpm"` for frontend.
  2. In `.claude/hooks/session-start.mjs` (line 52), there is a bug:
     ```javascript
     // BUG: It reads config.packageManager instead of config.frontendPackageManager
     console.log(`[Frontend] framework: nextjs (app router) | packageManager: ${config.packageManager ?? 'pnpm'} | scope: ${config.scope ?? '@scope'}`);
     ```
     This outputs: `[Frontend] packageManager: npm` (which contradicts rule 1 of frontend golden rules: *"pnpm only"*).
  3. Running `npm` in backend and `pnpm` in frontend inside the same monorepo root causes lockfile wars (`package-lock.json` vs `pnpm-lock.yaml`) and broken dependency hoisting.
* **The Fix:** 
  1. Standardize on **pnpm** across the entire monorepo (`pnpm --filter api ...`, `pnpm --filter web ...`).
  2. Fix line 52 in `session-start.mjs` to read `config.frontendPackageManager`.

---

### GAP 3: The Ghost Contract Gap (`@scope/contracts` Does Not Exist)
* **What's Happening:**
  - `CLAUDE.md` Golden Rule 12 states: *"Contracts shared via published @scope/contracts package or internal workspace package."*
  - `frontend.md` Rule 8 states: *"Forms are React Hook Form + Zod, schemas derived from @scope/contracts."*
  - But `packages/contracts/` does not exist on disk!
* **The Failure:** Any service, controller, or frontend form trying to import contracts will trigger:
  `TS2307: Cannot find module '@project/contracts' or its corresponding type declarations.`
* **The Fix:** Create `packages/contracts/package.json` and export shared DTO types before building features.

---

### GAP 4: Missing Drizzle Configuration (`drizzle.config.ts`)
* **What's Happening:**
  - The database engineering commands mandate `npm run db:generate` and `npm run db:migrate`.
  - But Drizzle Kit requires a root or API-level `drizzle.config.ts` specifying:
    - `schema: './src/database/schema/*.ts'`
    - `out: './drizzle'`
    - `dialect: 'postgresql'`
    - `dbCredentials: { url: process.env.DATABASE_URL }`
* **The Failure:** Calling `db:generate` fails immediately with `Config file 'drizzle.config.ts' not found`.
* **The Fix:** Place a valid `drizzle.config.ts` in `apps/api/` during `SETUP-02`.

---

### GAP 5: Windows OS & PowerShell Path Compatibility
* **What's Happening:**
  - Your system is **Windows** running **PowerShell**.
  - `.claude/settings.json` permissions specify Linux-style Bash matchers: `"Bash(npm run *)"`.
  - In PowerShell, chained commands (`pnpm build; pnpm test`) or multiline command strings can behave differently than Linux Bash, and backslashes in Windows file paths (`src\modules\auth\user.ts`) can cause regex matching issues in hook scripts if not normalized.
* **The Fix:** Verify all hook file paths are normalized with `.replace(/\\/g, '/')` (already present in `guard-write.mjs`).

---

### GAP 6: The CQRS Boilerplate Trap (Risk for a 1-Year Developer)
* **What's Happening:**
  - In `orchestra.config.json` line 55, `"cqrs": true` is enabled.
  - The command `new-module.md` instructs the AI: *"If toggles.cqrs is true, generate the command/query/event shells alongside the service."*
* **The Failure:** For a 1-year developer, CQRS adds **5 extra files per action** (CreateLeadCommand, CreateLeadHandler, GetLeadsQuery, GetLeadsHandler, LeadCreatedEvent).
  This quadruples token consumption and causes unnecessary complexity for early MVP development.
* **The Fix:** Set `"cqrs": false` in `orchestra.config.json` for Phase 1. Use standard Domain Services until you actually need event sourcing.

---

### GAP 7: The Gateway Security Core Gap (Missing Cross-Cutting Space)
* **What's Happening:**
  - In real-world enterprise architectures like CosmonyX (`COSMONYX-BE-001/apps/gateway/src/app`), security and HTTP lifecycle artifacts have dedicated, standardized homes:
    `decorators/`, `filters/`, `guards/`, `interceptors/`, `interfaces/`, `middleware/`, `pipes/`.
  - Without this, the AI scatters `AuthNGuard` or `JwtAuthGuard` into arbitrary feature subfolders or invents academic `/presentation/guards` folders, leading to broken imports, fragmented auth logic, and duplicate interceptors.
* **The Failure:** Endpoints end up with inconsistent auth decorators, unhandled exceptions leaking raw database errors, and no standardized response envelope.
* **The Fix:** Codify the CosmonyX Gateway standard with explicit dedicated folders in `apps/api/src/` (or `apps/gateway/src/app/`) and register global guards (`AuthNGuard`, `AuthZGuard`), filter (`ExceptionsFilter`), and interceptors (`ResponseInterceptor`, `LoggingInterceptor`) in `app.module.ts`.

---

## 3. Pre-Flight Checklist: How to Test Before Starting

Before asking Claude to build your first feature (`AUTH-01` or `LEAD-01`), execute this **Pre-Flight Test**:

```
[Pre-Flight Test Checklist]
├── 1. Fix line 52 in .claude/hooks/session-start.mjs (read frontendPackageManager).
├── 2. Set "cqrs": false in .claude/orchestra.config.json.
├── 3. Execute Task SETUP-01:
│      - Create package.json & pnpm-workspace.yaml
│      - Create apps/api, apps/web, and packages/contracts
│      - Run 'pnpm install'
├── 4. Execute Task SETUP-02:
│      - Add drizzle.config.ts to apps/api
│      - Create apps/api/src/app.module.ts with health check endpoint
│      - Run 'pnpm --filter api build'
├── 5. Execute Task SETUP-03 (Gateway Security Core):
│      - Create apps/api/src/{decorators,filters,guards,interceptors,interfaces,middleware,pipes}
│      - Wire AuthNGuard, AuthZGuard, ExceptionsFilter, and ResponseInterceptor in app.module.ts
│      - Verify build passes: 'pnpm --filter api build'
└── 6. Run 'node .claude/hooks/session-start.mjs' -> Must show pinned versions!
```

Once this Pre-Flight checklist is checked, your Orchestra will be **100% production-ready, token-safe, and ready to fly!**
