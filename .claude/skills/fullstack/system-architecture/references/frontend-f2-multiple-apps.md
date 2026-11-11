# F2: multiple frontend applications

Use only after the user selects F2. Read [frontend-foundation](frontend-foundation.md). F2 has multiple frontend applications with explicit route/origin and deployment ownership, without shell/remote composition into a single product surface. Each app uses the foundation's feature-first internals. A combined product composition needs a separately accepted F3 decision, not a label inferred from Turborepo.

## Profile contract

Typical examples are a public website, customer portal and administration application. They can share selected packages and backend contracts while retaining independent app entry points. Record why they are separate, who owns each one, its audiences/origin/routes, release and operational boundary, supported browsers and trusted API consumers.

Frontend and repository choices remain independent:

- **One pnpm workspace:** apps and packages share a lockfile and explicit local dependencies; optional approved Turborepo coordinates actual tasks. App release independence still needs compatibility testing.
- **Separate repositories:** each uses pnpm and its own lockfile. Share approved versioned packages/generated clients through a selected distribution process, with consumer ownership and release authority. No private filesystem imports outside repositories.

Neither option mandates a separate backend per app, microservices, a private registry, a BFF or a universal UI library. Record the actual backend/data/contract ownership separately.

## Workspace blueprint and import rules

Illustration for an approved workspace, not a generated or existing starter:

```text
project/
  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
  apps/
    web/                       own routes/features/adapters/tests
    admin/                     own routes/features/adapters/tests
  packages/
    ui/                        neutral presentation and tokens
    contracts/                 public DTO/error schemas and types
    utils/                     pure TypeScript
    config/                    selected build/tool configuration
```

Create only packages with a defined owner/consumer or an approved foundation purpose. Each app declares exact workspace package dependencies using the chosen `workspace:` policy and consumes only exports. Apps never import other apps, including `apps/web/src/features/orders` from admin. Shared UI never imports app features, backend services or Drizzle tables. An admin screen with broader permissions does not justify a broader public customer DTO.

Common domain use cases remain in their authoritative backend or approved domain package; do not move a domain into generic utils. When two apps need common domain presentation, define a named domain UI package with its own owner and public props, preserving the neutral primitive UI package. Record runtime dependencies and avoid private cross-feature imports inside the package.

## Required app and package matrix

| Area | Record before implementation |
| --- | --- |
| App ownership | Name, owner, business audience, origin/base path, entry routes, environment and deployment unit. |
| Shared asset | Owner, consumers, public exports, runtime/peer requirements, built/source consumption and release strategy. |
| Contracts | Definition owner, generation direction, consumer revisions, public versus administrative fields and compatibility window. |
| Identity | Session provider/verification, cookie/origin scope, SSO handoff if selected, expiry/logout/revocation and tenant selection per app. |
| Communication | Browser API/gateway/server adapter for each journey, allowed origins and response/error mapping. |
| Verification | Changed packages, dependent consumers, production builds, browser journeys and mixed-release cases. |

App-specific configuration is owned by that app. Client-public config contains no privileged values. Separate build-time versus runtime config and validate required names without printing secrets. Shared build caches must include relevant inputs and must not cross environment/security boundaries incorrectly.

## Authentication, navigation and shared state

Cross-app navigation is an explicit link/redirect contract: allowed destinations, return paths, user-visible transition, preserved filters where safe and behavior for unauthorized roles. Validate return URLs against approved targets. Do not put bearer tokens or sensitive state in query strings to transfer sessions.

Apps do not share a memory store or query client merely because they share a workspace. Record session/cookie scope for their actual domains. Shared cookies require deliberate trust and CSRF decisions; unrelated applications should not gain session access accidentally. A frontend admin app is not the authority granting admin privilege. All APIs enforce current policy.

On logout/account/tenant transitions, define which apps and browser tabs must refresh or stop protected work. Use a selected safe coordination mechanism without treating a client event as proof of authority. Reverify sessions on each trusted entry. Clear/partition each app's caches and prevent late old-session responses. Do not persist protected records into a common origin store without an explicit privacy/lifecycle design.

Language, timezone, theme and preference sharing can use a small agreed contract; do not serialize full app stores. Data ownership and revocation remain server-enforced. Cross-app workflow completion should use stable resource IDs/status through authorized APIs rather than importing another app's private components.

## Shared contract and package rollout

One schema owner controls API contract changes. Share allowlisted transport types/validation, never database models as API DTOs. Generated clients are derived in one direction; inspect generation output and version. The frontend architect supplies consumer impact, while backend/database owners approve domain and migration implications.

For every shared change record:

1. Changed exports/DTOs and current consumers, including other repositories and templates when known.
2. Current and candidate versions, peer/runtime compatibility and whether the package is built or source-consumed.
3. Compatible additive change versus breaking change; migration steps for each consumer.
4. Old app/new API and new app/old API behavior during the actual supported deployment window. Include cached browsers and delayed work where relevant.
5. Deployment ordering, deprecation window, feature flags if selected, observation and rollback/forward-repair limits.

A shared lockfile makes edits reviewable together; it does not deploy every app atomically. Separate app releases must not require a synchronized update unless that restriction is explicitly accepted. Do not auto-publish packages, access registry credentials or deploy as part of architecture planning.

## Example handoff: customer portal and admin

Portal Customers and admin Customer Management are separate features. They may consume a public contract package with distinct customer/admin response shapes and neutral UI primitives. Admin does not import the portal feature to reuse a form; extract a justified domain form component or compose shared primitives while each app owns policy-specific fields and transport.

Read flow: owning app route -> its feature -> approved adapter -> authoritative API checks role/resource/tenant -> safe app-specific DTO -> independently scoped view/cache. A portal user opening an admin URL remains denied regardless of whether both apps use the same UI package.

Mutation flow: app-specific editable-field schema -> owning API contract -> resource policy/use case/transaction owner -> safe result -> correct app cache/navigation. Cross-app derived views have an explicit freshness/revalidation mechanism rather than assuming local invalidation affects another browser/app. A stale admin form needs a real concurrency contract; hiding fields in the portal cannot prevent mass assignment on the server.

## Required evidence plan

- Dependency graph, declared workspace dependencies, public export/type resolution and server-only leak checks. Shared package edits cover affected consumers, not only the edited package.
- Each app's production build and meaningful tests against the candidate package/contract revision. An empty filter or skipped task is not evidence.
- Applicable role/tenant negative cases, direct API authorization, cross-app login/return/logout/expiry, stale request completion after switching and private-cache isolation.
- Shared UI tokens/components across representative app contexts, accessibility, long content/locales and compatible React/runtime resolution.
- At least the supported mixed frontend/API/package release cases and failure/recovery for the chosen deployment model. Consumer builds prove compilation, not session or API behavior.
- Actual per-app and shared-package performance effects; do not claim reduced bundle size merely because code is shared at source level.

Architect output includes the app/package/origin matrix, accepted repository option, contract owner/revision, per-app operation maps, independent release plan and verification scope. Report unknown external consumers as a gap. No F3 runtime composition checks are required unless F3 is selected through an approved change.
