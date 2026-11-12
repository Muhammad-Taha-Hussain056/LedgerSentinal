# Common transport contracts

Private workspace package for SETUP-03.1. Its only runtime dependency is Zod.
No application, React, NestJS, database or Node-only runtime imports belong here.
Domain transports and API/web dependency wiring remain SETUP-03.2.

## Money

- `moneySchema` accepts signed ASCII decimal strings with zero to two fractional
  digits and emits exactly two. Leading zeros are normalized; negative zero emits
  `0.00`. Whitespace, plus signs, exponents, separators, nonfinite spellings and
  JavaScript numbers are rejected rather than coerced or rounded.
- Absolute magnitude is at most `9999999999999999.99`, or
  `999999999999999999n` cents. Parsing and formatting use only strings and bigint.
- `canonicalMoneySchema` validates already serialized output without normalizing it.
- `moneyToCents` and `centsToMoney` convert exactly and enforce the same range.
  Bigint is a helper result; JSON transport uses decimal strings.
- This common layer allows signed values and zero for balances. Positive settlement
  and invoice amounts/nonzero postings belong to later domain schemas.

## Pagination and envelopes

`paginationQuerySchema` defaults to page 1/limit 20, permits integer query strings
and safe integer values, rejects unknown fields, and caps limit at 100. Blank,
boolean, null, signed/exponent/decimal-string and unsafe numeric input is rejected.

`paginationMetaSchema` validates safe counts and `pages = ceil(total / limit)`;
empty results have zero pages. Empty later pages remain valid. Generic factories
`successEnvelopeSchema(item)` and `listEnvelopeSchema(item)` return strict schemas:

```text
{ data: item, meta: { correlationId } }
{ data: item[], meta: { correlationId, page, limit, total, pages } }
```

List arrays cannot exceed 100 rows, their declared limit, or total. Factories infer
the item type; exported envelope types are derived from those schemas.

## Problems

`problemSchema` represents the project's RFC-9457 shape, not a success envelope.
It requires title, error status 400–599, code and correlationId; type defaults to
`about:blank`. URI types include the architecture's application URNs. Detail,
query/fragment-free request path, and field errors are optional.

The named extensions are code, correlationId and errors. Error entries are strict
`{ path, code, message }` objects; an empty path represents a root validation error.
Correlation IDs are 1–128 ASCII letters/digits/dot/underscore/hyphen, starting with
a letter or digit. Unknown diagnostic/secret-value fields are rejected. Producers
still own sanitizing explanation text and selecting stable error codes; validating
a string's shape cannot prove its contents are safe to disclose.

## Build and checks

From the repository root:

```powershell
pnpm --filter @project/contracts exec vitest run src/common.test.ts
pnpm --filter @project/contracts run typecheck
pnpm --filter @project/contracts run build
pnpm --filter @project/contracts run verify:exports
pnpm --filter @project/contracts run lint
```

The build emits ESM/CJS and matching declarations, with Zod external. Conditional
exports expose only the public root; private source subpaths are blocked. Export
verification compiles `.mts` and `.cts` consumer fixtures and loads the real package
name through both Node module systems. Actual API and Next production-consumer
integration remains the next task. No registry publication occurs.
