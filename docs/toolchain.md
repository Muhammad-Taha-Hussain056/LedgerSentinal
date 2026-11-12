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

References: [Turborepo configuration](https://turborepo.com/docs/reference/configuration),
[pnpm package metadata](https://pnpm.io/package_json),
[TypeScript strict checking](https://www.typescriptlang.org/tsconfig/strict.html).
