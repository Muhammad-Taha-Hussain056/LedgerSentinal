# 01. System Setup and Hooks Configuration

> **How the Orchestra's background hooks and configuration protect you from accidental file deletions, secret leaks, and package manager confusion.**

---

## 1. The Project Configuration: `orchestra.config.json`

The file [`.claude/orchestra.config.json`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/orchestra.config.json) is the **single source of truth** for your project setup.
Every skill, agent, command, and hook reads from this file.

```json
{
  "scope": "@project",
  "packageManager": "npm",
  "frontendPackageManager": "pnpm",
  "stack": {
    "framework": "nestjs",
    "language": "typescript",
    "orm": "drizzle",
    "database": "postgres",
    "authStrategy": "jwt"
  },
  "apps": {
    "api": { "path": "apps/api", "port": 3001 },
    "web": { "path": "apps/web", "port": 3000 }
  },
  "toggles": {
    "cqrs": false,
    "multiTenant": true,
    "eventEmitter": true,
    "swagger": true
  }
}
```

### Why this prevents hallucination:
When the AI starts, it reads this configuration. It will **never** guess whether you are using TypeORM, Prisma, or Drizzle; it will strictly use **Drizzle** because the config dictates it.

---

## 2. Automated Protection: The 6 Built-In Hooks

In [`.claude/settings.json`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/settings.json), the Orchestra registers deterministic Node.js lifecycle hooks located in [`.claude/hooks/`](file:///d:/AI%20Orchestra%20Final%20-%20Copy/.claude/hooks/):

```
                     ┌─────────────────────────────┐
                     │     AI Session Starts       │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                         [session-start.mjs]
                   (Prints pinned library versions)
                                    │
      ┌─────────────────────────────┴─────────────────────────────┐
      │                                                           │
      ▼ (Before Shell Command)                                     ▼ (Before File Write)
[guard-bash.mjs]                                            [guard-write.mjs]
- Blocks 'rm -rf /'                                         - Blocks editing .env
- Blocks 'yarn' / 'bun'                                     [protect-files.mjs]
- Blocks raw DB drops                                       - Protects root config
                                                            [scan-secrets.mjs]
                                                            - Blocks hardcoded API keys
                                                                  │
                                                                  ▼ (After File Write)
                                                            [format-on-edit.mjs]
                                                            - Auto-formats via Prettier
```

### Detailed Hook Roles:

| Hook | Lifecycle | What It Protects You From |
|---|---|---|
| **`session-start.mjs`** | `SessionStart` | Inspects `package.json` across all workspaces and prints exact pinned versions to the console so the AI never uses outdated APIs. |
| **`guard-bash.mjs`** | `PreToolUse (Bash)` | Intercepts terminal commands. Blocks destructive commands (`rm -rf`, `DROP DATABASE`, `pkill`), and rejects wrong package managers (e.g. rejects `yarn add` when pinned to `npm`). |
| **`guard-write.mjs`** | `PreToolUse (Write)` | Prevents the AI from blindly blowing away entire directories or writing massive unreviewed files. |
| **`protect-files.mjs`** | `PreToolUse (Write/Edit)` | Hard-blocks the AI from modifying `.env`, `.env.local`, `.env.production`, or Git metadata. |
| **`scan-secrets.mjs`** | `PreToolUse (Write/Edit)` | Scans the proposed code for high-entropy strings, AWS keys, JWT secrets, and database passwords before they touch your disk. |
| **`format-on-edit.mjs`** | `PostToolUse (Write/Edit)` | Automatically formats edited files with Prettier so the AI doesn't waste tokens adjusting indentation. |

---

## 3. Pinned Library Versions: Why This Matters to a Junior Dev

One of the biggest causes of AI hallucinations is **API version mismatch**:
- Example: Drizzle ORM updated its schema syntax between v0.28 and v0.33. If an AI writes syntax from v0.28, your project won't compile.
- Example: Next.js 13 introduced App Router, but the AI might try to use `getStaticProps` from Next.js 12.

### How `session-start.mjs` fixes this:
Every time you launch a session, `session-start.mjs` automatically prints:
```text
## Full-Stack Orchestra context (NestJS + Next.js)
[Backend]  framework: nestjs | orm: drizzle | db: postgres | auth: jwt
[Frontend] framework: nextjs (app router) | packageManager: pnpm | scope: @project
Pinned versions (verify version-specific APIs against these):
  @nestjs/core: ^10.3.0
  drizzle-orm: ^0.33.0
  next: 14.2.5
```
Because this is printed at the very top of the session, the AI is constrained to use only APIs that exist in those installed versions.
