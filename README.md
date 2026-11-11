# LedgerSentinal

LedgerSentinel is a local portfolio project demonstrating reliable payment ingestion, an immutable ledger, and human-reviewed invoice reconciliation with synthetic data.

## Project documents

- [Product scope](docs/product.md)
- [Architecture](docs/architecture.md)
- [Execution plan](docs/execution.md)
- [Engineering instructions](CLAUDE.md)

Implementation is pending the approvals recorded in the execution plan.

## Git workflow

- `development` is the integration and default working branch.
- Create task branches from `development` and merge reviewed pull requests back into it.
- Promote reviewed releases from `development` to `production` through a pull request.
- Follow the applicable `.claude/` skills and rules for each task.
