# Toolchain and workspace

SETUP-01.1 establishes tooling only. The user authorized this task on 2026-11-11.
Application manifests, services, schemas, and runtime integration belong to later tasks.

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
package manifests. No automatic Git commit, push, promotion, or next task follows.

References: [Turborepo configuration](https://turborepo.com/docs/reference/configuration),
[pnpm package metadata](https://pnpm.io/package_json),
[TypeScript strict checking](https://www.typescriptlang.org/tsconfig/strict.html).
