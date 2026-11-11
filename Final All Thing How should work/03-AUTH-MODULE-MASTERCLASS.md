# 03. Auth Module Masterclass: End-to-End Reference Implementation

> **A complete, production-grade implementation guide for the Authentication & Session Module (NestJS 10 + Drizzle + PostgreSQL + Next.js 14).**
> Built across 5 isolated micro-sessions using the Hybrid Orchestra pattern.

---

## 1. Module Architecture & Security Requirements

```
[Next.js Client] ──► POST /api/v1/auth/login ──► [AuthController]
                                                        │ (Validate LoginDto)
                                                        ▼
                                                  [AuthService]
                                                        ├── Verify Argon2 Password Hash
                                                        ├── Issue Access Token (JWT - 15m)
                                                        └── Issue Refresh Token (UUID - 7d)
                                                                │
                                                                ▼
                                                [UserRepository & SessionRepo]
                                                                │
                                                                ▼
                                                    [PostgreSQL (Drizzle)]
```

### Security Decisions:
- **Password Hashing:** Argon2id with recommended memory and time costs.
- **Access Tokens:** Short-lived JWT (15-minute expiration) delivered via Bearer token or Secure Cookie.
- **Refresh Tokens:** Long-lived (7 days), stored hashed in PostgreSQL, rotated on every refresh to prevent replay attacks.
- **Cookie Security:** `HttpOnly`, `Secure` (in prod), `SameSite: 'Lax'`, `Path: '/'`.

---

## 2. Session 1: Database Schema & Migration (15 mins)

### Goal:
Define `users` and `refresh_tokens` tables in Drizzle, pass the Database Verification Gate, and generate SQL migrations.

### Copy-Paste Prompt (Session 1):
```text
We are starting Session 1 for the Auth Module.
Load skill .claude/skills/database/database-engineering.
Stack: PostgreSQL + Drizzle ORM.

Task Scope:
1. Create 'src/database/schema/users.ts':
   - id: uuid primaryKey default gen_random_uuid()
   - email: varchar(255) notNull unique index
   - password_hash: varchar(255) notNull
   - status: varchar(30) notNull default 'ACTIVE' (index)
   - created_at: timestamptz notNull default now()
   - updated_at: timestamptz notNull default now()

2. Create 'src/database/schema/refresh-tokens.ts':
   - id: uuid primaryKey default gen_random_uuid()
   - user_id: uuid notNull foreignKey -> users.id on delete cascade (index)
   - token_hash: varchar(255) notNull (index)
   - expires_at: timestamptz notNull (index)
   - created_at: timestamptz notNull default now()

3. Export both from 'src/database/schema/index.ts'.
4. Do NOT generate migrations yet. Stop and wait for database-verifier.
```

### Review Gate:
Run the `database-verifier` prompt (from [02-HYBRID-AGENT-WORKFLOW.md](02-HYBRID-AGENT-WORKFLOW.md)).
Once passed, run:
```bash
npm run db:generate
```

### Git Checkpoint:
```bash
git add src/database/schema/ drizzle/
git commit -m "feat(auth): add users and refresh_tokens drizzle schemas and migration"
```
**Exit the session.**

---

## 3. Session 2: User Repository & Password Hasher (20 mins)

### Goal:
Create the abstract repository port, Symbol token, concrete Drizzle repository, and Argon2 password hashing service.

### Copy-Paste Prompt (Session 2):
```text
We are starting Session 2 for the Auth Module.
Read CLAUDE.md and inspect 'src/database/schema/users.ts'.
Load skill .claude/skills/database/repository-pattern.

Task Scope:
1. Repository & Token:
   - 'src/database/repositories/user.repository.ts' (extends BaseRepository, Drizzle queries for users)
   - 'src/modules/users/constants/users.constants.ts' (export const USER_REPOSITORY = Symbol('USER_REPOSITORY'))
2. Password Hasher Service:
   - 'src/modules/auth/services/password-hasher.service.ts' (using argon2: hash(password), verify(hash, password))
3. Unit Tests:
   - 'src/modules/auth/services/password-hasher.service.spec.ts'
   - 'src/database/repositories/user.repository.spec.ts'

Run 'npm test password-hasher' and 'npx tsc --noEmit'.
Report results and STOP.
```

### Verification & Git Checkpoint:
- Check that tests pass and TypeScript has 0 errors.
```bash
git add src/database/repositories/ src/modules/users/ src/modules/auth/
git commit -m "feat(auth): implement user repository and argon2 password hasher"
```
**Exit the session.**

---

## 4. Session 3: Auth Service & Business Logic (20 mins)

### Goal:
Implement registration, credential validation, JWT token issuance, refresh token rotation, and logout.

### Copy-Paste Prompt (Session 3):
```text
We are starting Session 3 for the Auth Module.
Read CLAUDE.md and the files created in Session 2.
Load skill .claude/skills/backend/nestjs-engineering.

Task Scope:
1. Typed Domain Exceptions:
   - 'src/modules/auth/constants/auth.exceptions.ts'
     (EmailAlreadyExistsException, InvalidCredentialsException, RefreshTokenRevokedException)
2. Auth Service:
   - 'src/modules/auth/services/auth.service.ts'
   - Injects USER_REPOSITORY (Symbol) and PasswordHasherService
   - Methods:
     * register(email, password): Promise<{ id: string, email: string }>
     * validateCredentials(email, password): Promise<UserRecord>
     * login(user): Promise<{ accessToken: string, refreshToken: string }>
     * rotateRefreshToken(oldRefreshToken): Promise<{ accessToken: string, refreshToken: string }>
     * logout(userId): Promise<void>
3. Unit Tests:
   - 'src/modules/auth/services/auth.service.spec.ts'
   - Mock repository and JwtService. Test all success and error paths.

Run 'npm test auth.service.spec.ts'.
Report results and STOP.
```

### Verification & Git Checkpoint:
- Verify: 5 unit tests pass.
```bash
git add src/modules/auth/
git commit -m "feat(auth): implement auth domain service with token rotation and tests"
```
**Exit the session.**

---

## 5. Session 4: DTOs, Passport JWT Strategy & Controller (20 mins)

### Goal:
Expose HTTP endpoints, enforce class-validator DTOs, set HttpOnly cookies, integrate with Gateway guards and decorators, and wire the NestJS module.

### Copy-Paste Prompt (Session 4):
```text
We are starting Session 4 for the Auth Module.
Read CLAUDE.md and inspect 'src/modules/auth/services/auth.service.ts'.
Ensure CosmonyX flat module structure (NO /presentation or /application).

Task Scope:
1. DTOs with class-validator:
   - 'src/modules/auth/dto/register.dto.ts' (@IsEmail(), @MinLength(8))
   - 'src/modules/auth/dto/login.dto.ts'
   - 'src/modules/auth/dto/auth-response.dto.ts'
2. Passport JWT Strategy & Gateway Security Alignment:
   - 'src/modules/auth/strategies/jwt.strategy.ts' (produces ActorContext)
   - Controller utilizes Gateway decorators from 'src/decorators/' (@Public(), @AuthN(), @CurrentUser())
3. Auth Controller:
   - 'src/modules/auth/controllers/auth.controller.ts'
   - POST /api/v1/auth/register (@Public(), returns 201)
   - POST /api/v1/auth/login (@Public(), returns accessToken, sets HttpOnly refreshToken cookie)
   - POST /api/v1/auth/refresh (@Public(), reads cookie, rotates tokens)
   - POST /api/v1/auth/logout (@AuthN(), clears cookie)
   - GET /api/v1/auth/me (@AuthN(), reads actor from @CurrentUser())
4. Wire Module:
   - 'src/modules/auth/auth.module.ts' and import into 'src/app.module.ts'.
5. Verification:
   - Run 'npm run build' and 'npm run lint'.

Report terminal output and STOP.
```

### Verification & Git Checkpoint:
- Verify: `npm run build` exits 0.
```bash
git add src/modules/auth/ src/app.module.ts
git commit -m "feat(auth): add auth controller, DTOs, JWT strategy, and module wiring"
```
**Exit the session.**

---

## 6. Session 5: Next.js Frontend Integration (20 mins)

### Goal:
Build the Next.js App Router Auth Context, login form, and route protection.

### Copy-Paste Prompt (Session 5):
```text
We are starting Session 5 for the Auth Module (Frontend).
Load skill .claude/skills/frontend/nextjs-engineering.
Stack: Next.js 14 App Router + React Hook Form + Zod + Tailwind.

Task Scope:
1. Zod Validation Schema:
   - 'apps/web/src/features/auth/schemas/login.schema.ts'
2. Auth Context & Provider:
   - 'apps/web/src/features/auth/context/auth-context.tsx' (stores current user state, exposes login/logout)
3. Login Form Component:
   - 'apps/web/src/features/auth/components/login-form.tsx' (React Hook Form + Zod, semantic UI tokens)
4. Next.js Route Page:
   - 'apps/web/src/app/(auth)/login/page.tsx'
5. Verification:
   - Run 'pnpm --filter web build' (or typecheck).

Report output and STOP.
```

### Verification & Git Checkpoint:
```bash
git add apps/web/
git commit -m "feat(web): add login page, form component, and auth context"
```

---

## 7. Pre-PR Review Gate (The Final Seal)
Before submitting your code:
1. Run `security-reviewer` prompt (from [02-HYBRID-AGENT-WORKFLOW.md](02-HYBRID-AGENT-WORKFLOW.md)).
2. Run `contract-reviewer` prompt.
3. Update `docs/execution.md` marking `AUTH-01` as **VERIFIED**.
4. Push your branch:
   ```bash
   git push origin feat/auth-module
   ```
You now have a clean, tested, senior-grade Authentication feature delivered with zero token waste!
