# LedgerSentinal

LedgerSentinel is a local portfolio project demonstrating reliable payment ingestion, an immutable ledger, and human-reviewed invoice reconciliation with synthetic data.

## Project documents

- [Product scope](docs/product.md)
- [Architecture](docs/architecture.md)
- [Execution plan](docs/execution.md)
- [Engineering instructions](CLAUDE.md)

Workspace, API compilation/testing, and frontend foundation harnesses are implemented.
PostgreSQL/Redis test-service configuration is defined and validated. Financial
features and infrastructure execution remain pending their owning tasks. The shared
contracts package provides verified exact-money, pagination and common transport schemas.

## Local harness checks

Use Node 24.10.x–24.x and pnpm 10.24.0. Install once from this directory with
`pnpm install`; see [toolchain details](docs/toolchain.md) for exact versions and caches.

```powershell
node --test tools/verification/workspace.test.mjs
node --test tools/verification/compose.test.mjs
pnpm --filter @project/contracts exec vitest run src/common.test.ts
npm.cmd --prefix apps/api run test -- --runInBand --runTestsByPath test/harness.spec.ts
pnpm --filter @project/web exec vitest run src/app/page.test.tsx
pnpm --filter @project/web run build
```

For a local preview, use `pnpm --filter @project/web run dev --hostname 127.0.0.1`.
The page is a static preparation screen. The API currently provides a module harness,
not an HTTP server. To run browser smoke tests after building, use
`pnpm exec playwright test tests/e2e/foundation.spec.ts` with installed Playwright
Chromium, or set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Chrome.

Compose verification checks configuration only and needs the Docker Compose CLI.
No containers or migrations are started by these checks. See the disposable-service
section in [toolchain details](docs/toolchain.md) before any future environment run.

## Git workflow

- `development` is the integration and default working branch.
- Create task branches from `development` and merge reviewed pull requests back into it.
- Promote reviewed releases from `development` to `production` through a pull request.
- Follow the applicable `.claude/` skills and rules for each task.
