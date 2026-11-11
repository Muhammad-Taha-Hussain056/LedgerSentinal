# Project execution entry point

Read [CLAUDE.md](CLAUDE.md), then its applicable `.claude/` skills/rules and linked
`docs/specifications/` standards before working. Those files remain the engineering toolkit.
Codex reads them explicitly; automatic Claude rule/agent activation is not assumed.

The user authorized an application foundation in this folder using multiple runtime agents:
Next.js user/admin microfrontends, shadcn, pnpm + Turborepo, a NestJS modular monolith, and Supabase PostgreSQL
through Drizzle. Authentication remains the user's integration. The user requests no
further questions: follow confirmed requirements and existing standards, and leave undefined
business/auth/tenancy behavior unimplemented rather than inventing it.

Project mappings and their source references are recorded in
[docs/project/architecture.md](docs/project/architecture.md). They are concrete applications
of toolkit patterns, not claims that example paths or unimplemented kit assets already exist.
Keep the existing toolkit files intact. Do not add missing toolkit agents, hooks or skills
as incidental application work. Backend/database runtime workers follow the existing
standards; their assignment names do not imply installed `.claude/agents/` definitions.

Use pnpm 10.24.0 and Node 24.10.x–24.x. Keep shared contracts and migration ownership
serialized. No production deployment, credential access or database migration execution
is authorized by the scaffold task. Report only executed checks as passed.

## Continuing authentication work

The current authentication decision register supersedes the foundation's earlier user-owned
integration note. Before each implementation/review task, explicitly read the applicable
CLAUDE.md skills, rules and available agent contracts; apply their scope and handoff behavior.
Read the backend pattern reference for backend work. Do not claim automatic activation or
invent missing agent definitions. Use bounded runtime specialist assignments where needed,
with explicit ownership, exclusions and independent verification. Apply the existing
frontend agent contracts only to their documented frontend scope.

## Per-API behavior approval workflow

Campaign override, 2026-10-27: the user's later instruction authorizes all API refactors
for the bearer-auth campaign, superseding endpoint-by-endpoint approval for that scope.
Confirmed follow-ups select refresh JWT in JSON/no authentication cookies, and one selected
organization's role/permissions plus organizationId in the access JWT. Follow
docs/project/bearer-auth-refactor.md for this campaign. This does not authorize database
migration execution, production deployment, infrastructure installation or data removal.

The user's current instruction supersedes earlier no-questions wording for API work:
ask which API to work on, discuss that API's intended behavior and present its concrete
request/response/authentication/authorization/error/effect plan. Wait for the user's
explicit behavior approval before refactoring that API. Implement and verify only the
approved API, then stop and ask which API is next. Checklist order is not API approval.

The shared folder/module foundation was separately authorized first as a behavior-preserving
structural change. That authorization does not approve any endpoint behavior, cookie-to-header
JWT transport change, CSRF removal, new schema, migrations or new infrastructure.
