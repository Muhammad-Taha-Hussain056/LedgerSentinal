# Toolchain and workspace

SETUP-01.1 establishes tooling only. The user authorized this task on 2026-11-11.
Application harnesses were subsequently authorized in SETUP-01.2/01.3; their evidence
is recorded in `docs/execution.md`. Financial services, schemas and runtime integration
still belong to later tasks.

## Version matrix

| Tool | Exact baseline | Compatibility and evidence |
| --- | --- | --- |
| Node.js | 24.10.0 | Installed runtime observed with `node --version`. Supported project range: `>=24.10.0 <25`, preserving the execution plan. |
| pnpm | 10.24.0 | Installed version observed with `pnpm --version`; registry metadata requires Node >=18.12. Pinned by `packageManager` and `engines.pnpm`. |
| Turborepo | 2.11.10 | Exact published 2.x release confirmed through the npm registry; installed CLI validates the real task graph in the workspace test. |
| TypeScript | 5.9.3 | Registry metadata requires Node >=14.17; the verification compiles safe and unsafe fixtures with the installed compiler. |
| YAML parser (verification only) | 2.9.1 | Registry metadata requires Node >=14.6; parses the actual workspace and generated lockfile. |

These are the compatible versions for this task, not a claim to pin the entire
application stack. NestJS/Jest belong to SETUP-01.2, Next.js/React/frontend test tools
to SETUP-01.3, and contract dependencies to SETUP-03.1. Check exact versions and peer
requirements before those tasks install them. PostgreSQL/Redis image pinning belongs
to SETUP-02; this task does not approve or start a disposable service environment.

Registry checks used `npm view turbo@2 version engines --json`,
`npm view typescript@5.9.3 version engines --json`,
`npm view pnpm@10.24.0 version engines --json`, and
`npm view yaml@2 version engines --json`.

## Package ownership and dependency direction

| Reserved location | Package name | Manifest owner |
| --- | --- | --- |
| `apps/api` | `@project/api` | SETUP-01.2 |
| `apps/web` | `@project/web` | SETUP-01.3 |
| `packages/ui` | `@project/ui` | SETUP-01.3 |
| `packages/contracts` | `@project/contracts` | SETUP-03.1 |

`apps/*` and `packages/*` admit direct members only. No placeholder manifests are
needed for this task. Actual workspace links are checked in SETUP-03.2 once the
consumed packages exist. `@project` comes from `.claude/orchestra.config.json`.

- Applications may depend on public exports from `@project/ui` and `@project/contracts`.
- Packages never depend on applications. Applications never depend on each other.
- UI stays domain agnostic: no contracts, feature, or application imports.
- Contracts contain transport schemas/types and Zod only; no React, Next.js,
  database, or Node-only runtime dependencies.
- No relative imports across package boundaries or dependency cycles. Declare
  `workspace:*` dependencies only after the target manifests exist.
- Keep the root private and tooling-only. Do not add packages without a task that owns them.

The approved task uses the plan's package-manager resolution: root `pnpm install`
owns installation and the single `pnpm-lock.yaml`; frontend orchestration uses pnpm.
Backend scripts use `npm --prefix apps/api run <script>` after SETUP-01.2. Do not run
backend `npm install` or generate a competing npm lockfile. This task-specific
resolution takes precedence over the toolkit's generic backend installation wording.
The toolkit's separate-repository contracts publishing example does not apply here:
this plan uses one workspace, with consumption finalized in SETUP-03.2.

## Task graph and TypeScript

Build waits for dependency builds and caches `dist` and `.next` output excluding
Next's cache. Typecheck waits for dependency typechecks; tests wait for dependency
builds and may cache coverage. Lint is independent. Dev is persistent and uncached.
The shared TypeScript file participates in task hashes. Future packages expose
`build`, `typecheck`, `lint`, `test`, and `dev` as appropriate to their owned harness.

The shared compiler baseline enables strict checking, checked indexed access,
exact optional properties, isolated modules, and consistent filename casing.
ES2022 supports exact bigint arithmetic. Each consumer owns its input/output, JSX,
module, and runtime types; the API harness must override the frontend-oriented
module settings for its selected Nest runtime. No global path aliases bypass exports.

An empty Turbo dry run at this stage validates configuration only. It is not an
application build, lint, or test pass. Run the named workspace verification instead:

```powershell
pnpm install
node --test tools/verification/workspace.test.mjs
```

Verification checks installed Node/pnpm, parsed member globs, lockfile pins, task
ordering, the real Turbo dry run, and compiler behavior. It does not require future
package manifests. Git actions and subsequent tasks require session authorization.

## API and web harness matrix (2026-11-12)

| Area | Verified exact versions |
| --- | --- |
| Nest module/testing runtime | Nest common/core/testing 11.2.9, reflect-metadata 0.2.2, RxJS 7.8.2 |
| API test/compiler tools | Jest 29.7.0, ts-jest 29.4.5, TypeScript 5.9.3, Node types 24.10.0 |
| API/UI lint | ESLint and @eslint/js 9.39.1, typescript-eslint 8.48.0 |
| Web runtime | Next and eslint-config-next 16.4.6, React/React DOM 19.3.1; React types 19.3.0 |
| Component/network tests | Vitest 4.1.12, Vite 7.3.8, React plugin 5.2.0, jsdom 27.4.0, MSW 2.12.3 |
| Rendering assertions | Testing Library React 16.3.3, DOM 10.4.1, jest-dom 7.0.1 |
| Browser harness | Playwright 1.65.0; this machine's installed Chrome via PLAYWRIGHT_CHANNEL=chrome |

Exact pins and resolved transitive dependencies live in the package manifests and
the single generated pnpm lockfile. Official npm engine/peer metadata was checked,
then the actual compiler, lint, component tests, production build and browser tests
were run. This does not certify compatibility with every platform or future module.

The latest jsdom and MSW dependency chain require newer Node patches than 24.10.0;
the selected versions preserve this task's existing runtime without disabling engine
checks. React is centrally pinned in the workspace catalog; UI declares React as a
peer rather than installing an independent runtime. No contracts manifest is fabricated.

## Cache and temporary storage

The project is on D, but tool defaults originally used the Windows user profile on C.
After that drive ran out of space, `.npmrc` set repository-local `.pnpm-store`,
`.pnpm-cache`, `.pnpm-state`, and `.npm-cache` paths. These are ignored by Git.
Verification processes also scoped TEMP/TMP to `.superpowers/tmp` and npm_config_cache
to the repository's `.npm-cache`. Installed Node/npm binaries may still reside on C;
no unrelated files or existing shared caches were moved or removed.

On Windows, use `npm.cmd` for the documented API commands if the PowerShell npm shim
strips the `--` separator. The API compiler-watch command does not start an HTTP server.
Frontend typecheck runs `next typegen` first; it works without a preceding build.
Browser smoke tests require a web production build and start/stop their own server
on 127.0.0.1:3100; no API is started before its actual bootstrap exists.

UI review evidence includes the strict premium audit (0 findings) and the pinned
official DESIGN.md linter (exit 0, no errors). The latter reports two orphan-token
warnings for muted/border because those roles are consumed directly in CSS rather
than its limited component-token schema. Runtime mappings and screenshots were
checked; no duplicate or unused runtime colors were introduced to silence the tool.

## Disposable local services (SETUP-02)

`docker-compose.yml` defines configuration only, for a single owned
`ledgersentinel-test` stack. No service startup or migration has been performed.

| Service | Exact official image and immutable manifest index | Host-only endpoint |
| --- | --- | --- |
| PostgreSQL | `postgres:16.15-alpine3.24@sha256:aa6cb33cf4c19c765cefcf48d96176258800870a9a1e930ad126200f9d825139` | `127.0.0.1:55432` |
| Redis | `redis:7.2.17-alpine3.22@sha256:ea0b4a0bac3988a3129908075d6219d78cc7b2a0a4b643b14ce857333026177a` | `127.0.0.1:56379` |

Checked on 2026-11-12 against official Docker Hub tags and registry manifests;
both indexes include linux/amd64 and linux/arm64. Docker Compose v2.32.4 was used
for real configuration validation. Registry inspection did not pull image layers.

The fixed database is `ledgersentinel_test`, initialized by `ledger_test`. That
account is an initialization superuser, not the future restricted application
runtime role. PostgreSQL data and Redis append-only data have separate project-owned
`*_test_data` volumes. There are no bind mounts, external volumes, app containers,
host-network services, restart policies that start services automatically, or
published non-loopback ports.

`.env.example` contains names with empty values only: POSTGRES_PASSWORD,
TEST_DATABASE_URL and TEST_REDIS_URL. The latter two are reserved for later harnesses.
Compose refuses an unset/empty password. Real values stay human-managed; no usable
credential is committed. Health checks probe process availability with bounded
intervals/timeouts/retries; they do not prove authenticated SQL or financial invariants.

The tests require the Compose CLI but not its daemon, running services, credentials,
or network access:

```powershell
node --test tools/verification/compose.test.mjs
```

They select `.env.example` explicitly and inject an in-process nonsecret marker for
configuration expansion. The equivalent standalone validation used during this task
sets POSTGRES_PASSWORD to that marker and COMPOSE_ENV_FILES to `.env.example`, then
runs `docker compose config --quiet`. Never use this marker to start services.

Future startup needs explicit environment authorization and a real disposable test
password. One stack owns the fixed project/volume names; parallel runs require
distinct owned project namespaces. Do not target a demo/production database, reuse
another developer's volumes, or reset/delete data automatically. The next database
harness and all migrations remain separately gated.

## Common contracts (SETUP-03.1)

`@project/contracts` uses Zod 4.6.7 as its only runtime dependency and tsup 8.5.0
for bundled ESM/CJS plus matching `.d.ts`/`.d.cts` outputs. TypeScript 5.9.3,
Vitest 4.1.12 and the established ESLint tools verify the package. Registry metadata
was checked: tsup 8.5.0 supports Node >=18; tsup 9 requires a newer patch than this
machine's Node 24.10.0, so the compatible 8.x release was selected.

Required common tests, package typecheck/build/lint, `.mts`/`.cts` declaration
consumers, and both real Node export conditions were executed successfully. Export
tests enforce the public root boundary. No application dependencies or root path
aliases bypass package exports. API/Next production consumption belongs to SETUP-03.2.
See [the package contract](../packages/contracts/README.md) for serialization rulings.

## Domain contracts and application consumption (SETUP-03.2)

API and web now declare real `workspace:*` dependencies on `@project/contracts`.
Build the compiled contracts package before direct application builds; root Turbo
also follows the declared dependency graph. No new library versions were introduced.

The API build uses a separate NodeNext `.cts` fixture to compile and execute the
CommonJS export by package name; its generated `.contract-build` directory is
ignored and is not production source. The web build runs the actual operator app
build and a separate Next fixture that parses a real synthetic domain payload
during prerender. A generated-HTML assertion confirms execution. Fixture sources
are excluded from the operator app's TypeScript project and routes; the compiled
package is not bypassed through TypeScript aliases or `transpilePackages`.

Executed evidence: 53 domain tests, 126 total contracts tests, 3 compiled-export
tests, contracts typecheck/build/lint, both required application builds including
consumer gates, API/web regression/typecheck/lint, and the workspace gate. No
HTTP behavior, financial operation, database connection or infrastructure startup
is implied by this transport/build verification.

References: [Turborepo configuration](https://turborepo.com/docs/reference/configuration),
[pnpm package metadata](https://pnpm.io/package_json),
[TypeScript strict checking](https://www.typescriptlang.org/tsconfig/strict.html).
