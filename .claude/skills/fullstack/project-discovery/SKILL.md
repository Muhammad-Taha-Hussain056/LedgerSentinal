---
name: project-discovery
description: Use when a new product, substantial feature, vague client request, proposal, scope discussion, or estimate needs clearer requirements, actors, ownership, constraints, or acceptance criteria before design and implementation.
---

# Project discovery

Turn the actual request into a verifiable scope without inventing business rules. Use this for rough prompts and consequential missing requirements. Skip the full procedure for an index explanation, typo fix or already specified routine change.

## Procedure

1. Read the complete request and relevant existing brief. Inspect current behavior, contracts, versions and approved reusable assets when a repository is available. Respect existing decisions; record inaccessible evidence as a gap.
2. State the problem, audience and intended outcome. Separate confirmed requirements, proposed choices, assumptions and unanswered questions. Normalize unclear wording without silently changing its meaning.
3. Map actors, permissions, user journeys, entities, lifecycle rules, integrations and ownership. Identify selected capabilities and explicit exclusions before suggesting a starter or architecture.
4. For a substantial product, full-stack flow, unfamiliar domain or high-risk change, read [requirements-quality.md](references/requirements-quality.md). Use its requirement record, architecture passport, operation handoff and category checklist. Load only the applicable linked standard sections.
5. Ask up to three consequential questions per round, explaining the decision each resolves. Continue independent read-only investigation. Missing authority, money rules, data ownership or a major architecture decision blocks dependent work; silence is not an answer. Reuse already confirmed facts instead of asking again.
6. Define functional and applicable nonfunctional requirements, dependencies, exclusions and risks. Specify observable positive, denial/failure and boundary/concurrency acceptance cases; mark their evidence as planned until executed.
7. Recommend the smallest useful vertical slice. Identify assets actually available versus missing, contract/migration ownership and later specialist needs. Present the brief and unresolved gates for review. Discovery alone does not create application files, install modules or authorize implementation.

## Required brief

Scale detail to the change; keep a small brief in chat unless a project artifact is authorized. Use these fields, marking inapplicable items with reasons:

- Problem, objective, success measure and recommended MVP.
- Actors, permissions, user journeys and confirmed requirements.
- Assumptions, proposed decisions and blocking questions.
- Data ownership, entities/lifecycles, integrations and reuse gaps.
- Architecture/profile decisions and affected API/data flow; for a narrow change, reference the existing contracts.
- Relevant quality targets, standard IDs, acceptance cases and planned evidence.
- Included/excluded scope, dependencies, risks and next authorized step.

Examples of depth: a public site needs content/contact delivery and browser acceptance, not automatic billing/tenancy; a CSV CRM needs ownership, duplicate/concurrency policy and failure feedback; a protected export needs authorization of both creation and retrieval, limits, sensitive-field policy and revocation behavior.

If evidence or business meaning is missing, return an incomplete brief with precise blockers rather than a false implementation-ready verdict. Full frontend/backend/database operation fields are defined in the linked quality reference and [API/data-flow contract](../../../../docs/specifications/addenda/2026-10-20-api-data-flow-contract.md).
