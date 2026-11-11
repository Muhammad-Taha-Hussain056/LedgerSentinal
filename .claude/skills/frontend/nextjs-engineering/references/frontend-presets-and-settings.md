# Frontend presets and project settings

Use for project initialization, settings changes and missing technology decisions. Architecture selection remains owned by [system-architecture](../../../fullstack/system-architecture/SKILL.md); this reference owns the frontend technology defaults and override process. Presets are documented choices, not tested starter applications or a certified compatibility matrix.

Sections: [authority](#1-three-layers-of-authority), [presets](#2-two-base-presets), [defaults](#3-defaults-and-activation), [settings record](#4-project-settings-record), [overrides](#5-controlled-overrides), [versions/packages](#6-version-and-package-resolution), [acceptance](#7-adoption-and-verification).

## 1. Three layers of authority

1. **Common engineering rules:** pnpm; feature-first placement; explicit public imports; client/server separation; trusted authorization; scoped caches; accessible recovery; meaningful evidence. Activate rules only for capabilities actually present. A prototype label does not waive a security invariant.
2. **Selected preset:** the user accepts content frontend or application frontend for each app/unit. The preset defines defaults and activation conditions; it does not install tools or authorize scaffolding. Existing accepted settings are reused.
3. **Recorded overrides:** a project may change libraries or capabilities through the override contract below. Routine implementation choices within accepted settings do not need repeated approval. Consequential missing settings or incompatible choices block dependent implementation.

The user selects F1 single app, F2 multiple apps or F3 composed frontends before project implementation. The technology preset is independent. Repository/workspace, optional Turborepo, backend deployment, contract ownership and API transport are separate decisions. F3 additionally needs an approved composition mechanism with evidence for its exact versions. Read only the selected [architecture profile](../../../fullstack/system-architecture/references/frontend-foundation.md#1-settings-before-implementation).

For a new project, explain differences and obtain settings acceptance. For an existing project, inspect and preserve working conventions; do not replace libraries or regenerate a lockfile to match agency defaults silently. An existing non-pnpm repository needs an approved package-manager migration before pnpm-dependent changes. Missing requirements are not permission to choose a major architecture.

## 2. Two base presets

| Preset | Required pattern | Conditional additions |
| --- | --- | --- |
| Content frontend | Audience/content ownership, route/content lifecycle, deliberate static/server rendering, semantic navigation, project-specific visual direction, responsive media, metadata and freshness. Keep browser JavaScript proportionate to actual interaction. | CMS preview, search, contact forms, localization, analytics/consent, interactive islands and authenticated areas only when selected. |
| Application frontend | Named user journeys, thin route composition, feature-owned UI/API mapping, validated contracts, explicit state/cache ownership, complete read/write failure states and session/resource boundaries where protected. | Tenancy, billing, uploads, exports/jobs, charts/editors, real-time/offline and AI capabilities only when selected. |

Content and application surfaces may coexist. Record the preset per app or meaningful surface; choose one coherent component/data convention per owning scope. Do not introduce competing query/form/design libraries in sibling features casually. A hybrid product requires explicit boundaries and shared tokens/contracts, not an uncontrolled mixture of stacks.

Categories are not presets. Commerce adds price/cart/stock/order/payment transitions where selected; booking adds timezone/reservation/conflict rules; SaaS adds selected memberships/permissions/entitlements; AI adds streaming/cancellation/authorized tools/output handling/cost bounds. Discover another category's real invariants rather than claiming these examples cover everything. The backend owns authoritative business rules; the frontend presents their outcomes.

## 3. Defaults and activation

These defaults were agreed for the kit. Each project selects the relevant subset and exact versions before implementation. Detailed library-specific methods not yet authored remain outstanding; approval of a library is not evidence that its adapter works.

| Concern | Default | Activation and boundary |
| --- | --- | --- |
| Package manager | pnpm | Required; selected exact version, compatible Node and committed lockfile. Workspace only when chosen. |
| Framework/types | Next.js App Router, TypeScript strict | Preferred for suitable new web work. Existing router/framework changes need a scoped migration decision. Do not pick a current major from memory. |
| Styling | Tailwind with project-specific tokens | Preserve brand/design direction. CSS Modules or an established system may be an approved override. Responsive, focus, motion and state rules apply to every styling choice. |
| Components | shadcn/ui for suitable application controls | Select component provenance/primitive foundation explicitly; inspect supplied code and versions. Custom content presentation is allowed. Do not mix primitive systems accidentally or assume generated controls are accessible without checking. |
| Initial rendering/reads | Appropriate Next.js server capabilities | Decide per route and version. Interactive browser islands are deliberate; no mandatory client-query cache for a static page. |
| Interactive server state | TanStack Query | Preferred when repeated/refreshed/interactive client server state warrants it. One owner for fetched data; no copying responses into a UI store. Server/cache/hydration contracts come first. |
| Forms/validation | Native controls for simple forms; RHF and Zod for substantial forms | Define simple versus substantial from actual validation, dirty drafts, field arrays, multi-step or server-error needs. Derive UI inputs from transport contracts; server validation remains authoritative. |
| UI state | Local state first; Zustand when justified | URL owns safe shareable navigation state. A cross-component UI store needs an owner/lifetime/reset policy, not a duplicate database. |
| Testing | Vitest, React Testing Library, MSW, Playwright | Apply unit/component/network/browser layers according to changed behavior and supported framework features. Not every small feature needs every tool. Mocks prove only their actual scope. |
| Task orchestration | pnpm workspaces; optional Turborepo | Workspace/task choice is independent of frontend composition. Inspect real scripts and dependency edges; no empty task success claims. |

Do not install all defaults into a content site. Example: a static portfolio can select Next.js/TypeScript/pnpm and its styling system, omit query/form/store packages until needed, and record backend/auth/database as inapplicable. An application can select RHF/Zod and TanStack without automatically requiring a global store, tenancy or billing.

Capability additions use a small record: requirement, owner, inputs/outputs, library and reason, runtime/bundle impact, code/package home, sensitive-data boundary, failure/recovery and verification. Charts, editors, uploads, tables, localization, real-time, offline and streaming AI each require their actual lifecycle; a package installation does not establish capability support.

## 4. Project settings record

Use the project's existing approved brief/decision record, or chat for a small scope. This is required content, not permission to create a new configuration file. For each setting capture value, status (accepted/proposed/unresolved/inapplicable), owner, source/revision and applicable scope.

| Group | Required fields |
| --- | --- |
| Identity | Project/app/unit name, objective, actors, category, selected capabilities and exclusions. |
| Architecture | Accepted F1/F2/F3; F3 mechanism; app/route/origin and repository/workspace owners; backend/data axes independently. |
| Versions | Node/pnpm/Next/React/TypeScript and selected libraries; manifest intent, lockfile resolution and observed runtime evidence separately; target runtimes/browsers. |
| Presentation | Preset, brand/tokens, components/primitive source, styling, supported viewports/input modes, accessibility target, locale/timezone/currency. |
| Data/state | Route rendering/freshness, server reads, client query policy, hydration, URL/local/form/store ownership, cache partitions/invalidation and persisted-state limits. |
| API/trust | Contract source/generation owner and revision, transport per operation, safe errors, session/origin/CSRF, actor/tenant verification owner, refresh/replay and cancellation semantics. |
| Packaging | Workspace members, package owners/consumers/exports, source-versus-built strategy, peers, publication authority and compatibility window. |
| Delivery | Exact existing scripts, test layers/environments, budget targets, independently released consumers, rollout/recovery, evidence and unresolved gates. |
| Overrides | Changed choice, reason, affected scope/consumers, controls, approver and revisit/removal condition. |

Unresolved library details may use an accepted preset's rules. Unresolved money rules, authority, major topology, unsupported composition or dangerous replay cannot. Ask up to three consequential questions at a time; reuse existing answers and continue independent investigation.

## 5. Controlled overrides

An override records the original default, replacement, reason, affected routes/packages, owner/approver, compatibility and maintenance/licensing implications, performance/security/accessibility impact, replacement implementation guidance, verification, migration/recovery and revisit condition. Mark alternatives as proposed until accepted. No override silently weakens another domain's trust or data invariant.

Distinguish:

- **Routine setting:** using a documented component variant or adjusting a token within the accepted design system; implement within existing authority.
- **Capability activation:** adding an approved library for an already selected need; confirm it fits accepted settings, scope and dependency policy before installation.
- **Consequential change:** new framework, transport/session strategy, competing state owner, package-manager migration, runtime composition or incompatible major version; obtain a scoped decision before dependent work.

An alternative needs usable guidance, not only a package name. If the selected skill lacks that adapter, report the gap and prepare the smallest approved addition. Do not fall back silently to a different library. Preserve the original settings revision; later work names the amended revision and affected consumers.

## 6. Version and package resolution

Read manifests, workspace config, lockfile and observed installed versions as different evidence. A semver range, catalog entry or README is not an exact installed version. Record multiple resolved versions and peer conflicts instead of collapsing them into one value. Verify current primary documentation against the selected versions; record the model/config flags that change behavior, especially caching and composition.

Use pnpm for authorized commands and approved installed tools. A generator's source/version/options and intended writes need review before execution; no automatic `latest`, untrusted scripts or hidden package-manager substitutions. Do not change global settings or access registry credentials to investigate compatibility. This batch installs nothing.

Follow the foundation's [pnpm discipline](../../../fullstack/system-architecture/references/frontend-foundation.md#2-pnpm-and-dependency-discipline) and [shared-package contract](../../../fullstack/system-architecture/references/frontend-foundation.md#4-shared-package-contract). Use explicit workspace dependencies/exports and declared peers; check affected consumer builds. Local compatibility is distinct from independently deployed old/new consumers and cached browsers. Exact runtime combinations remain unverified until exercised.

## 7. Adoption and verification

Before implementation, return the settings record, preset/profile, selected additions, actual reusable assets, overrides, blockers and verification plan. A read-only architect proposes; an authorized implementer/verifier executes. Narrow work reuses existing decisions and reads affected sections only.

Adoption cases include minimal F1 public content; F2 app/package boundaries and multiple consumers; selected F3 composition/mixed-release proof; invalid overrides; missing versions; and preservation of an established project. No one case certifies every category or profile. Check meaningful user journeys, failures, accessibility, privacy and performance according to the selected capabilities. Report actual commands/revisions/versions, outcomes, unavailable checks and limits.

Source ownership: the supplied frontend-orchestra kit informs specificity; this reference consolidates its fixed-stack assumptions into the accepted hybrid policy. [Next.js component guidance](https://nextjs.org/docs/app/getting-started/server-and-client-components), [shadcn ownership](https://ui.shadcn.com/docs), [RHF/Zod integration](https://ui.shadcn.com/docs/forms/react-hook-form), [TanStack state guidance](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state) and [Zustand Next.js guidance](https://zustand.docs.pmnd.rs/learn/guides/nextjs) inform the library boundaries. Documentation was consulted on 2026-10-21; no starter, framework version matrix or native invocation is verified by that reading.
