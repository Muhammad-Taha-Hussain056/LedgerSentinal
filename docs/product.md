# LedgerSentinel — Product Discovery

**Status:** Business-rule decisions confirmed; full discovery draft awaiting review. Not approved for implementation.  
**Date:** 2026-11-11  
**Source:** User-provided LedgerSentinel PRD and subsequent discovery instructions.  
**Confirmed direction:** Learning/portfolio first, using synthetic financial records.

This document defines product behavior and acceptance conditions. It does not define architecture, database schemas, API contracts, implementation tasks, or a production launch commitment. The four choices in section 5 were explicitly confirmed by the user on 2026-11-11; the remaining scope and requirements await full-document review.

## 1. Problem statement

Financial operations teams receive repeated payment notifications and must compare payment records with invoices. Duplicate processing can overstate money received, editable transaction history makes corrections difficult to audit, and manual matching takes time while allowing discrepancies to slip through.

LedgerSentinel will demonstrate a trustworthy workflow: accept a verified payment notification, record its financial effect once in a balanced and immutable ledger, suggest an invoice match, and let an operator review and confirm the association. Incorrect ledger records are corrected through linked reversing entries rather than edits.

For this portfolio release, success means demonstrating those behaviors with repeatable synthetic examples, including duplicates, invalid notifications, unbalanced entries, ambiguous matches, and operator mistakes. Claims of regulatory compliance, production readiness, unlimited throughput, or zero data loss under every failure scenario are not acceptance criteria.

## 2. Target persona

**Primary persona: Financial operations analyst at a small business.** This person needs to find a received payment, compare its amount and reference with an invoice, understand discrepancies, and record a review decision without changing financial history.

**Portfolio evaluator:** A reviewer should be able to follow a documented demonstration and observe both successful processing and rejected or recoverable failures. This does not require a separate evaluator role or application.

## 3. Proposed MVP scope

The following five capabilities describe the proposed first release, aligned with the confirmed decisions in section 5.

1. **One simulated payment-provider integration.** Receive signed synthetic incoming-payment notifications, reject unverifiable or expired notifications, and prevent repeated notifications from creating duplicate financial effects.
2. **Balanced, immutable financial records.** Record exact USD amounts with at most two decimal places against a fixed demonstration account set; show entry details and correct an erroneous entry through one linked full reversal with a required reason.
3. **Structured invoice intake.** Import synthetic invoice records containing invoice number, vendor, invoice date, currency, amount, and an optional payment reference. Validate the records and report rejected inputs clearly.
4. **Assisted reconciliation with human confirmation.** Suggest payments with equal amount and currency, explain matching evidence, and let the operator explicitly approve one eligible association. A matching reference is optional. Matching creates an association only, with no revenue recognition or additional financial entry.
5. **One workspace and one operator.** The operator can inspect processing outcomes, journal entries, invoices, matching evidence, confirmed links, and reversal history, and can approve matches and perform full reversals. Include a guided demonstration dataset and scenario instructions.

## 4. Explicit out of scope for this release

- Real customer money, live payment-provider accounts, payment initiation, refunds, and payouts.
- Multiple organizations, tenant onboarding or switching, organization memberships, and role administration.
- A custom authentication product, social login, account recovery, billing, and subscriptions. The proposed demo runs locally with synthetic data; public authenticated access requires a later scope decision.
- PDF upload, PDF viewing, OCR, AI extraction, field-coordinate highlighting, and a separate document-processing service. Structured invoice input proves the review workflow first.
- Bank connections and statement imports. Initial reconciliation compares invoices with payments received through the simulated provider.
- Automatic final approval or linking, autonomous financial actions, write-offs, fee adjustments, and exchange-rate calculations.
- Partial payments, installment payments, overpayments, payment splits, and many-to-many invoice/payment allocations.
- A configurable chart of accounts, tax calculation, accounting-period close, and a full accounting/reporting suite.
- Invoice issuance, accounts-receivable accounting, and revenue recognition. Imported invoices are reconciliation evidence only.
- Live socket telemetry, multiple frontend applications, and independently deployed services as MVP deliverables. Technical topology belongs in the next phase.
- Production availability guarantees, formal compliance certification, disaster-recovery certification, and high-throughput benchmarks. Basic failure visibility and recoverable processing remain required.

These are proposed deferrals from the broader PRD, not claims that those capabilities lack future value.

## 5. Confirmed business-rule decisions

The user selected Q1-A, Q2-A, Q3-A, and Q4-A on 2026-11-11. Checked options record those decisions; unchecked options are retained as alternatives considered. These answers confirm the four business rules, not approval of the entire document or permission to implement.

### Q1. How many workspaces and operator roles must the first demo support?

**Recommended default:** One local demonstration workspace and one operator who can inspect, reconcile, and reverse synthetic records. No organization administration or differentiated roles.

**Decision impact:** Determines whether multi-tenant ownership and approval permissions are MVP requirements. Multiple organizations or a separate approver would materially expand this draft.

- [x] **Q1-A — One workspace, one operator (selected).** The operator can inspect, match, and reverse synthetic records. Smallest portfolio scope.
- [ ] **Q1-B — One workspace, separate operator and approver.** An operator proposes matches and reversals; an approver confirms them. Adds permissions and an approval workflow.
- [ ] **Q1-C — Multiple organizations.** Each organization has its own records and operator access. Adds membership, organization switching, and isolation requirements; role details need follow-up.

**Your decision:** Confirmed Q1-A. One local demonstration workspace, one operator, and no separate approver or organization administration.

### Q2. What payment event should create a financial record, and what does it represent?

**Recommended default:** Only a simulated, successfully settled incoming payment creates an entry. It increases a demonstration bank asset account and an unapplied-receipts clearing account by the same amount. Failed, pending, and unsupported events create no ledger entry. Matching an invoice records an association only; it does not recognize revenue or create another entry.

**Decision impact:** Defines the first money movement and prevents assuming that every received notification is revenue. The selected account mapping is a confirmed synthetic-demo rule, not a production accounting policy.

- [x] **Q2-A — Settled incoming payments only (selected).** Simulated settlement increases bank and unapplied receipts equally. Invoice matching records an association only. This demonstrates payment integrity without modeling invoice accounting.
- [ ] **Q2-B — Invoice accounting plus settlement.** Issuing an invoice records receivables; receiving its payment clears receivables. Adds invoice issuance, accounting rules, and a wider financial lifecycle that must be clarified before approval.

For either option, pending, failed, and unsupported provider events create no financial entry. The initial provider remains simulated; a live or sandbox provider integration is a separate scope decision.

**Your decision:** Confirmed Q2-A. Only simulated settled incoming payments create financial entries; bank increases through a debit and unapplied receipts through an equal credit. Invoice matching creates no additional financial entry.

### Q3. Which money and correction rules should the demo enforce?

**Recommended default:** USD only, at most two decimal places, positive incoming-payment amounts, and no automatic rounding or fee tolerance. A correction uses one full reversal with a required reason; a previously reversed entry cannot be reversed again. Partial reversals and replacement entries are deferred.

**Decision impact:** Fixes the meaning of valid money, acceptable precision, and correction behavior. The source PRD's four-decimal storage example does not by itself establish a product rule.

- [x] **Q3-A — USD, two decimal places (selected).** Simple dollar-based demo examples; reject additional decimal places rather than round them.
- [ ] **Q3-B — PKR, two decimal places.** Same behavior using Pakistani rupee examples; USD is unsupported in the first release.
- [ ] **Q3-C — USD, four decimal places.** Demonstrates sub-cent precision from the original PRD; all input, comparisons, and displays must preserve that precision.

All three options retain positive incoming payments, exact arithmetic, no fee tolerance, and one full reversal with a required reason. Changing those correction rules requires an explicit amendment rather than being implied by the currency choice.

**Your decision:** Confirmed Q3-A. USD only, at most two decimal places, exact arithmetic, positive incoming payments, and no automatic rounding or fee tolerance. Corrections use one full reversal with a reason; partial reversals, replacement entries, and reversing an already reversed entry are excluded.

### Q4. What evidence is sufficient to recommend and approve an invoice match?

**Recommended default:** One invoice links to one unreversed payment. Both must have exactly equal amounts and currency. An exact payment reference produces a strong suggestion; amount and currency alone produce candidates requiring review. Vendor and date are supporting evidence, not automatic approval rules. Multiple eligible candidates require an explicit operator choice. A payment or invoice already linked elsewhere cannot be linked again.

**Decision impact:** Defines eligibility, ambiguity, and duplicate allocation. The selected MVP uses explainable suggestions and human approval; percentage confidence and automatic matching thresholds are deferred.

- [x] **Q4-A — Exact amounts, human approval (selected).** Equal amount and currency are required; an exact reference strengthens a suggestion. The operator explicitly chooses and approves every match.
- [ ] **Q4-B — Exact reference required, human approval.** Equal amount, currency, and payment reference are all required. More conservative, but missing or inconsistent references leave invoices unmatched.
- [ ] **Q4-C — Automatically link a unique exact match.** Link only when amount, currency, and reference all match exactly and there is precisely one eligible candidate. All other cases remain for review. Adds automatic linking to MVP scope and requires additional acceptance cases.

All three options retain one invoice to one unreversed payment, prohibit double allocation, and exclude partial payments, fee tolerances, and write-offs.

**Your decision:** Confirmed Q4-A. Every match requires explicit operator approval and equal amount and currency. A reference may be absent or differ without blocking approval. Each invoice and eligible unreversed payment can have only one current allocation; ambiguity requires explicit operator selection.

## 6. Functional requirements

The requirements below incorporate the four confirmed decisions; the complete set awaits document review. Acceptance conditions describe observable outcomes, not executed test results.

| ID | Requirement | Acceptance Condition |
| --- | --- | --- |
| FR-01 | Provide a reproducible synthetic demonstration. | A reviewer can follow documented steps to process one payment, inspect its balanced entry, import one invoice, confirm its match, and inspect a separate reversal example without real credentials or customer data. |
| FR-02 | Verify payment notifications before financial processing. | A valid signed notification inside the agreed five-minute timestamp window proceeds. Missing or invalid signatures, changed payload content, and expired timestamps produce no accepted processing work or financial record. |
| FR-03 | Process only the selected settled-payment event. | A simulated settled incoming payment creates equal bank debit and unapplied-receipts credit amounts. Pending, failed, and unsupported events produce no journal entry and have an explicit reported outcome. Invoice import and matching create no financial entry or revenue recognition. |
| FR-04 | Recognize repeated business events consistently. | Replaying the same provider event with the same content, including 50 concurrent submissions, produces exactly one financial entry. Reusing its identity with changed financial content reports a conflict and produces no additional entry. |
| FR-05 | Make accepted asynchronous work recoverable and its outcome visible. | An event is reported as accepted only when it can be recovered for processing. After an interruption before completion, accepted work can resume or be explicitly retried; a retry after a completed financial write creates no duplicate entry. The operator can distinguish pending, completed, and failed outcomes. |
| FR-06 | Validate monetary inputs without approximation. | USD amounts such as 0.10 and 0.20 retain their exact values. Non-USD currency, nonnumeric values, zero or negative incoming payments, and amounts with more than two decimal places are rejected without financial effects or automatic rounding. |
| FR-07 | Record only complete, balanced entries. | Each completed entry has at least one debit and one credit with exactly equal totals. An empty entry or a 100.00 debit paired with a 95.00 credit leaves no partial financial record. |
| FR-08 | Preserve completed financial history. | A completed entry's amounts, account assignments, and posting membership cannot be changed or deleted through supported product operations. Attempts fail without changing the entry. Storage-level enforcement is specified and verified in the later architecture phase. |
| FR-09 | Support an explicit full reversal. | The single operator supplies a nonempty reason and confirms the action. A new linked entry offsets every posting of the original exactly; the original remains visible. Repeated or concurrent reversal requests yield only one effective reversal. Partial reversals and requests to reverse an already reversed original are rejected without additional financial effects. |
| FR-10 | Import and validate structured invoice records. | Each accepted record includes invoice number, vendor, valid invoice date, USD currency, and a positive amount with at most two decimal places. Payment reference is optional; its absence does not reject an otherwise valid invoice. Invalid records are identified with actionable reasons. Reimporting the same invoice number with identical content creates no duplicate; conflicting content is reported without silently replacing the invoice. |
| FR-11 | Suggest eligible payment candidates with explanations. | An invoice shows candidate payments with amount, currency, reference, and supporting evidence. Reversed or already allocated payments are excluded. No eligible payment produces an explicit no-match result; multiple candidates remain visible for review. No suggestion automatically creates a link. |
| FR-12 | Require explicit approval of a one-to-one match. | The single operator explicitly selects and approves an unlinked invoice and unlinked, unreversed payment with equal amount and currency. A missing or different payment reference does not prevent approval; a discrepancy is visible before approval. Multiple candidates require explicit selection. Repeated approval of the same pair creates no duplicate association; concurrent attempts to allocate either item elsewhere leave only one successful association and report the conflict. No match is approved automatically. |
| FR-13 | Show financial and reconciliation outcomes clearly. | The operator can browse and inspect financial entries, invoice details, pending or failed processing, suggested candidates, confirmed associations, and reversal reasons. A queued event is never presented as a completed ledger entry. Empty results and failures have explicit messages. |
| FR-14 | Keep a confirmed association consistent when its payment is reversed. | Reversing a linked payment preserves the historical association and marks it as requiring review. The invoice no longer appears currently reconciled, and the reversed payment is excluded from new matches. No automatic rematching or additional financial adjustment occurs. |

## 7. Discovery notes and review gate

- The original PRD's $1.50 variance test expects 85 points, but its supplied scoring logic awards at most 60 when the other factors match. This draft proposes explainable candidates and human approval instead of treating that score as agreed behavior.
- The original resolution workflow names a reversed status absent from its status list. Final lifecycle names and permitted transitions remain for the next phase after the product behavior is reviewed.
- Historical toolkit instructions mention previous application/authentication decisions whose supporting project documents are absent from this folder. They are not treated here as confirmed LedgerSentinel product requirements.
- Architecture, technology-version selection, schemas, migrations, API definitions, and implementation plans are intentionally deferred.

**Review requested:** Q1–Q4 are answered and recorded. Review the aligned five-item MVP, exclusions, and functional requirements, and confirm or amend the document as a whole. This discovery draft remains open until that review; no code, schema design, or implementation is authorized by these decisions.
