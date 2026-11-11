---
name: nestjs-handoffs
description: Defines how the coordinator delegates work to bounded backend agents — what each agent receives, what it produces, what it must not do, and when to wait for approval. Load before assigning any backend agent.
---

# Backend agent handoffs

The coordinator owns scope, integration, truthful reporting, and the handoff contract. Agents own their bounded task. An agent that is missing a skill or hits an unclear decision must stop and report — never guess or expand scope.

## Handoff template (use for every agent assignment)

```
Agent:      <agent name>
Task:       <one sentence>
Inputs:     <approved plan | changed files | contract | PR diff>
Writable:   <exact paths the agent may create or modify>
Excluded:   <paths the agent must not touch>
Skills:     <list of skill files to load>
Checks:     <what to run and how to report it>
Stop on:    <conditions that require stopping and reporting to coordinator>
```

## Agent roster and boundaries

| Agent | Reads | Writes | Never |
|---|---|---|---|
| `backend-architect` | Entire repo | Nothing | Writes any file |
| `api-builder` | Plan, existing controllers | `*.controller.ts`, `*dto.ts`, module `controllers[]` | Touches service, repository, or business logic |
| `service-builder` | Plan, existing services | `*.service.ts`, `*.entity.ts`, `*.spec.ts` (service) | Imports ORM, touches controller or DTO |
| `repository-builder` | Plan, schema files | `*.repository.ts`, `*.tokens.ts`, module `providers[]` | Writes business logic, touches controller |
| `cqrs-handler` | Plan, existing commands/queries | `commands/`, `queries/`, `events/` folders | Mixes command and query in same handler |
| `backend-verifier` | All files | Nothing | Edits test assertions to make them pass |
| `backend-reviewer` | All changed files | Nothing | Fixes anything |
| `contract-reviewer` | Controllers, DTOs, guards | Nothing | Touches implementation |
| `fullstack-agent` | Approved contract, both sides | Transport boundary only (DTOs, BFF routes, fetchers) | Changes business logic |

## Standard handoff sequence for a new feature

```
1. Coordinator → backend-architect
   Input: approved feature brief
   Output: layered plan (module layout, patterns, contract, risks)
   Gate: user approval before proceeding

2. Coordinator → repository-builder
   Input: approved plan (entities, schema)
   Output: tokens.ts, IRepository interface, concrete repository, spec

3. Coordinator → service-builder
   Input: approved plan + repository interfaces
   Output: domain entity, service class, typed exceptions, service spec

4. Coordinator → cqrs-handler (if toggles.cqrs)
   Input: approved plan + service
   Output: commands, queries, events, handlers, saga (if needed)

5. Coordinator → api-builder
   Input: approved plan + service/handlers
   Output: DTOs, controller, guards, Swagger decorators, module wiring

6. Coordinator → backend-verifier
   Input: all changed files
   Output: build + lint + test results (verbatim)

7. Coordinator → backend-reviewer
   Input: git diff of all changes
   Output: blocker/warn/note table + verdict

8. Coordinator → contract-reviewer
   Input: controller + DTOs + guards
   Output: contract compliance table + verdict
```

## Stop conditions (agent must report, not continue)

| Situation | Agent action |
|---|---|
| Needed skill file is missing | List the gap; do not improvise |
| Plan is ambiguous about file ownership | Ask coordinator to clarify |
| Existing code conflicts with the pattern | Report conflict; do not silently override |
| Test fails and the cause is unclear | Report the failure verbatim; do not weaken the test |
| A change requires touching an excluded path | Stop and report; do not expand scope |
| TypeScript error that cannot be resolved without changing the plan | Report the error; do not use `any` or `@ts-ignore` |

## What the coordinator must provide in every handoff

1. A clear single-sentence task description
2. The approved plan or decision record
3. The list of writable paths
4. The list of skills to load
5. The verification command to run

**A handoff without writable paths is incomplete.** Agents must ask for them before writing.
