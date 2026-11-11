# 02. The Hybrid Agent Workflow: Token Defense & Senior Review Gates

> **How to save 80% to 90% of your token budget by coding in Single-Agent mode, while leveraging specialized Orchestra agents as Senior Reviewers at critical quality gates.**

---

## 1. The Multi-Agent Trap vs. The Hybrid Solution

### Why full multi-agent systems burn your session limits:
If you ask an AI system to spawn 4 autonomous subagents (e.g. `backend-architect` ──► `api-builder` ──► `service-builder` ──► `test-writer`):
- Every subagent gets its own duplicated copy of system prompts, files, and conversation history.
- A simple task that requires 30 lines of code ends up consuming **120,000 to 180,000 tokens**.
- You hit your weekly Claude Code or API limit in 2 hours.

### The Hybrid Model (The Sweet Spot):
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SINGLE-AGENT CODING (90% of your time):                                  │
│    - One clean session, one task at a time.                                 │
│    - AI loads only the specific skill it needs (e.g. 'repository-pattern'). │
│    - Token usage: ~10,000 to 15,000 tokens per session.                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. SPECIALIST REVIEW GATES (10% of your time):                              │
│    - Read-only agents invoked only at 2 critical milestones:                │
│      GATE 1: Database Schema & Migration Gate                               │
│      GATE 2: Pre-PR Security & Contract Gate                                │
│    - Token usage: ~3,000 to 5,000 tokens per review.                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Gate 1: The Database Schema Gate

**When to trigger:** Before writing any backend service or generating production migrations.

### Specialist Agents Used:
1. [`.claude/agents/database/database-architect.md`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/agents/database/database-architect.md)
2. [`.claude/agents/database/database-verifier.md`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/agents/database/database-verifier.md)

### The Workflow:
1. Single agent drafts the proposed Drizzle table schema in `src/database/schema/[feature].ts`.
2. **Invoke the Database Verifier** using this exact prompt:

```text
Act as database/database-verifier.
Inspect 'src/database/schema/[feature].ts' against CLAUDE.md database golden rules.

Audit:
1. Are foreign keys properly indexed?
2. Are created_at and status columns indexed?
3. Is cascade deletion behavior explicit (ON DELETE CASCADE / SET NULL)?
4. Does this schema avoid over-normalization (Table Justification Test)?
5. Are nullable fields strictly validated?

Provide a Pass/Fail scorecard with required fixes. Do not modify files.
```

3. Only after `database-verifier` issues a **PASS**, you approve running:
   ```bash
   npm run db:generate
   ```

---

## 3. Gate 2: The Pre-PR Security & Contract Review Gate

**When to trigger:** After completing all tasks in a feature module, before opening a Git Pull Request or showing your work to your manager.

### Specialist Agents Used:
1. [`.claude/agents/fullstack/security-reviewer.md`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/agents/fullstack/security-reviewer.md)
2. [`.claude/agents/backend/contract-reviewer.md`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/agents/backend/contract-reviewer.md)

### The Workflow:
1. Run `git diff main...HEAD` to see all changes in your feature branch.
2. **Invoke the Security Reviewer** with this prompt:

```text
Act as fullstack/security-reviewer.
Review our git diff for the [FEATURE_NAME] branch.

Audit:
1. Authentication & Tenant Isolation: Are queries filtering by tenant/user_id?
2. Injection: Are there any raw SQL string interpolations?
3. Secrets: Are there hardcoded tokens, passwords, or test credentials?
4. Input Validation: Are DTOs using class-validator with whitelist: true?
5. Error Leaks: Are raw database errors leaked to the client?

List any blocking vulnerabilities. Do not modify files.
```

3. **Invoke the Contract Reviewer** with this prompt:

```text
Act as backend/contract-reviewer.
Inspect our controller and DTO files for [FEATURE_NAME].

Verify:
1. Do response DTOs match docs/architecture.md API contracts?
2. Are Swagger decorators (@ApiTags, @ApiOperation, @ApiResponse) complete?
3. Are HTTP status codes correct (201 for POST, 200 for GET/PATCH, 204 for DELETE)?
4. Is RFC-9457 error format respected on failure cases?

Report any contract drift.
```

---

## 4. How to Route Skills in Single-Agent Mode

When you are writing code, tell the AI which skill from [`.claude/skills/`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/skills/) to load. This gives the AI expert knowledge without loading the entire repository:

| When Implementing | Tell the AI |
|---|---|
| Drizzle schema & migrations | *"Load skill .claude/skills/database/database-engineering"* |
| Repositories & interfaces | *"Load skill .claude/skills/database/repository-pattern"* |
| NestJS services & modules | *"Load skill .claude/skills/backend/nestjs-engineering"* |
| Next.js App Router & Server Components | *"Load skill .claude/skills/frontend/nextjs-engineering"* |

By explicitly naming the skill, the AI loads only the 200 lines it needs, keeping token consumption at rock-bottom levels.
