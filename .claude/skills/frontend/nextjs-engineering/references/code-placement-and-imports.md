# Code placement and imports

Use when creating/moving files, naming public APIs, extracting shared code or changing dependencies. Read the accepted settings revision and selected architecture; do not reopen F1/F2/F3. The [architecture foundation](../../../fullstack/system-architecture/references/frontend-foundation.md#3-feature-first-app-boundaries) owns dependency policy; this reference maps it into implementation placement.

Sections: [placement](#1-placement-map), [public APIs](#2-feature-public-apis-and-composition), [names/exports](#3-names-and-export-conventions), [packages](#4-workspace-and-package-implementation), [worked example](#5-worked-placement-and-operation-map), [changes/checks](#6-safe-changes-and-verification).

## 1. Placement map

Map `src` to the real app root, such as `apps/web/src`, only when that layout is selected. Preserve established paths incrementally. Create needed folders, not the whole example tree. Routes/layouts compose feature public APIs; domain presentation and state mapping live with their owner.

| Responsibility | Home and constraints |
| --- | --- |
| Page/layout/loading/error/not-found/metadata/framework entry | Required `app/**` convention; thin composition/entry adapter, no sprawling domain implementation. Router-specific conventions must match the installed version. |
| Route Handler or selected frontend gateway | Required `app/**/route.ts`; permitted operation mapping delegates to owned server adapters. A catch-all is not mandatory or inherently safe. |
| Feature UI | `features/<feature>/components/`; domain-aware labels, permissions for presentation and field mapping stay here. |
| Feature interactions | `features/<feature>/hooks/`; browser hooks and draft orchestration, not duplicated authoritative policy. |
| Query keys/client calls/mutations | `features/<feature>/api/`; one scoped key/contract source, platform transport delegated to an app adapter. |
| Form input schema/mapping | `features/<feature>/schemas/`; derive from authoritative writable transport fields. Do not copy ORM models or confuse transformed input/output types. |
| Feature copy/UI types | `features/<feature>/messages/` and `types/`, or compact named files following existing conventions. No duplicated API type source. |
| Feature UI store | `features/<feature>/store/` only if selected and justified; no query-response mirror. |
| Neutral presentation used across app features | `src/components/`; no feature imports, fetching or domain status decisions. |
| App platform adapters | Explicit `src/lib/api/`, `auth/`, `env/`, `providers/`, `routes/` as needed. Separate server-only and browser-safe modules/entry points. |
| Shared domain read capability | Deliberately owned application/domain module with public API and scope; not a generic utils folder or one feature's internals. |
| Shared UI/contracts/utils/config | Selected workspace packages with the foundation's distinct runtime/dependency boundaries and public exports. |
| Unit/component tests | Colocated with the owner using the selected test runner; no import-time network or secret reads. |
| Browser journeys | Existing app-owned browser-test location; cross-app/profile integration belongs to its agreed integration owner. |

Small features can use a few files instead of every subdirectory. A one-line format helper need not become a service. Promote a cohesive capability, not incidental repeated syntax. Existing domain decisions remain authoritative regardless of file naming.

## 2. Feature public APIs and composition

Use explicit `features/<feature>/index.ts` client-safe exports and `server.ts` for needed server-only exports. Routes/composition consumers import those entry points. Inside a feature use clear local imports and avoid importing its own barrel, which can create cycles. No sibling feature imports, including through another feature's public barrel. No app-to-app imports.

The server entry has the framework-appropriate server-only guard and does not re-export through the client entry. A type-only import is erased by TypeScript, but importing privileged persistence types as public contracts still breaks ownership; define the proper public DTO instead. A client-safe filename/barrel is insufficient if its transitive graph reaches a server module.

When sibling capabilities must collaborate:

1. Compose them in a route/container with narrow props or slots; keep feature internals private.
2. For a real application/domain dependency, agree a public owner contract outside either feature's private UI. Preserve authority on the backend where applicable.
3. Extract an app/shared package only when its cohesive purpose, consumers and runtime requirements are clear. Record approved foundation exceptions to the second-consumer heuristic.

Move implementations and update consumers; do not leave copied sources that diverge. A generic primitive can be shared while domain mapping stays in its feature. Example: neutral Badge is UI; mapping `order.status` to permitted labels/tones/actions belongs to Orders or an explicitly owned orders presentation package, not neutral UI.

## 3. Names and export conventions

For new code without conflicting accepted conventions: kebab-case paths, PascalCase component exports, `use-*.ts`/`useThing` hooks, intention-revealing helpers, `*Schema` validation values and explicit types. Framework-required names take precedence. Avoid one unbounded `utils.ts`/`common` module. Existing consistent conventions should not be renamed as unrelated work.

Use named exports for ordinary application modules. Preserve framework-required default exports for page/layout and other entries that require them. App Router Route Handlers export named HTTP methods such as `GET` and `POST`, not a default handler. See [Route Handler conventions](https://nextjs.org/docs/app/api-reference/file-conventions/route). Do not generalize one entry's convention to every Next.js file.

Use app aliases only for that app's accepted source root, local relative imports within a feature, and package names/declared exported subpaths across workspaces. Import type-only symbols explicitly where appropriate. Keep client/server entries separate and avoid broad `export *` barrels. Let configured format/lint tools handle import ordering; do not install a sorter incidentally.

Providers belong to the smallest layout scope needing them. A global theme provider may differ from an authenticated query provider. Explicit browser-safe and server-only environment modules prevent a shared barrel from exposing server configuration. Read configuration through the selected validated adapter; diagnostics name missing variables without printing values. A `NEXT_PUBLIC_` prefix denotes client exposure and cannot protect a secret.

## 4. Workspace and package implementation

Every workspace member declares its own package name, dependencies/dev dependencies/peers and public exports. App aliases cannot bypass that contract. Required local dependencies use the selected `workspace:` form. Do not fix an undeclared import by hoisting everything, adding all dependencies at the root or linking another repository's source.

For each package decide:

- Owner, purpose, consumers and public subpaths; allowed incoming/outgoing edges and cycle checks.
- Browser/server/pure/config runtime classification; declared external and peer dependencies, including tested React compatibility where needed.
- Source-consumed versus built output; module/type/asset/CSS resolution, build dependencies and production consumer integration.
- Same-workspace revision versus separately published version; supported old/new consumers and publication authority.

Neutral UI has no contracts/API/auth/ORM dependencies. Contracts contain approved transport schemas/types/errors, no React/Next/Drizzle implementations. Pure utils have no React/Next or I/O side effects. Trusted server packages never enter client dependency graphs. Domain-specific packages must be named and owned explicitly rather than disguised as UI/utils.

Extraction is an API change. Inspect all import/export consumers, tests, generated artifacts and known external packages. Preserve supported subpaths through a compatibility plan rather than silently removing them. Do not auto-publish, access credentials or regenerate unrelated package versions. pnpm and optional Turbo commands follow actual project scripts and selection, not copied commands from another kit.

## 5. Worked placement and operation map

Illustrative tenant Customer feature; map this to actual accepted requirements, do not scaffold it into every product:

```text
app/(workspace)/customers/page.tsx       compose list using feature entry
features/customers/index.ts             export client-safe list/form views
features/customers/server.ts            export guarded server read, if selected
features/customers/api/keys.ts           scope and result-changing parameters
features/customers/api/queries.ts        calls approved platform transport
features/customers/api/mutations.ts      captured operation/scope and outcomes
features/customers/schemas/edit.ts       UI input and writable DTO mapping
features/customers/components/edit.tsx  controls and accessible recovery
lib/api/client.ts                       browser-safe transport/error adapter
lib/api/server.ts                       guarded server adapter, if selected
```

The authoritative Customer DTO/error definition belongs to its accepted contract owner, possibly a public contracts package or generated client. The backend owns identity verification, requested-tenant membership, resource policy, uniqueness/revision constraints and persistence. The route can compose a separate report panel without Customers importing Reports.

Movement: route/interaction -> feature adapter -> declared contract -> selected server/browser transport -> backend owner -> safe DTO/error -> feature state/cache -> accessible outcome/navigation. Each arrow names real functions/files in the handoff. Unknown backend paths are gaps, not invented implemented services. Public content with no API uses its actual content source and renderer instead.

## 6. Safe changes and verification

Before moving code, inspect consumers and runtime classification. Make the smallest cohesive move; update imports/exports/tests and remove obsolete duplicates within authorized paths. Cross-app extraction, contract generation, migrations and new packages require the agreed owners. Preserve unrelated files and avoid wholesale reorganizations to match examples.

Plan and execute, under task authority, appropriate checks for missing/deep imports, cycles, client/server leaks, type resolution, actual production builds and affected tests. Export-map correctness requires the actual consumer/bundler/module target, not just an editor resolving a path. For published packages, add a disposable packed-consumer check when publication is in scope and approved. No package/module is implemented or certified by this reference.

PowerShell command shapes, only after inspecting actual package names/scripts:

```powershell
pnpm --filter "@project/web" run typecheck
pnpm --filter "@project/admin" run build
pnpm --filter "...@project/ui" run test
```

Verify matched members and non-skipped tasks; inspect the approved base-to-candidate diff, including uncommitted work. An empty selection is not a pass. See [pnpm filtering](https://pnpm.io/filtering). Report revision, commands, observed output and missing consumer/runtime coverage. A read-only reviewer inspects evidence; it does not gain shell execution from this guide.
