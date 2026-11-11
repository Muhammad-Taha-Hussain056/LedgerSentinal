---
description: Safely refactor code with test coverage as a safety net
argument-hint: "[target to refactor — file, module, function, or pattern]"
---

Refactor: $ARGUMENTS

## Step 1: Understand the Current State
- Read the target code, its dependencies, its callers, and its tests.
- Identify the exact behavior, contracts, and side effects.
- **Critical:** Check existing test coverage.
  - Backend: `npm run test -- --testPathPattern=<target>`
  - Frontend: `pnpm turbo run test --filter=...`
  - **If tests do not exist or are inadequate, WRITE TESTS FIRST.** Never refactor without a test safety net.

## Step 2: Plan the Refactoring
- State the objective: clearer naming, extracted abstraction, eliminated duplication, modular decomposition, or pattern application.
- List specific atomic transformations (e.g., extract method, replace type with enum/interface, apply strategy pattern).
- Verify: does this change ANY public behavior or contract?
  - If YES: this is a behavior change / breaking change, NOT a refactor. Stop and get confirmation.
  - If NO: proceed with atomic steps.

## Step 3: Atomic Transformations
- Apply one transformation at a time.
- Run tests immediately after EACH atomic change.
- If a test fails: revert the atomic step immediately and make a smaller step.
- Follow orchestra naming and code placement standards.

## Step 4: Verification & Reviews
1. Run full type-check and linter:
   - Backend: `npm run build && npm run lint`
   - Frontend: `pnpm turbo run typecheck lint`
2. Run full test suite:
   - Backend: `npm run test`
   - Frontend: `pnpm turbo run test`
3. Delegate to reviewers:
   - Backend: `backend-reviewer`
   - Frontend: `standards-reviewer`
   - Overall: `performance-reviewer` (to confirm no regressions)
4. Confirm: code is objectively cleaner, simpler, and fully typed.

## Rules
- Never mix refactoring with new feature development or bug fixes in the same change.
- Never disable or bypass tests to make refactored code pass.
- Preserve all existing comments and JSDoc unless directly contradicted by the refactoring.
