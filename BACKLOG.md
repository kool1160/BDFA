# BDFA Active Backlog

This is the short implementation order for BDFA. It is intentionally milestone-based. Do not expand each item into excessive planning paperwork before useful work begins.

## Operating rules

- Work on the first incomplete milestone unless Chris explicitly changes priority.
- Foreman automatically skips milestones whose status begins with Blocked, Paused, or Waiting.
- A blocked milestone may still be selected explicitly by number after Chris approves the protected work.
- Planning hands Codex the complete milestone, not a chain of separately authorized micro-tasks.
- High-risk milestones may contain internal phases, but Codex should complete every safe phase automatically.
- Pause only at the explicit approval boundaries in `AGENTS.md` or when a material unknown prevents safe progress.
- Use focused commits as checkpoints.
- Prefer one milestone pull request over many phase-level or documentation-only pull requests.
- Do not require separate approval merely to move from assessment to design, documentation, test preparation, or other safe internal phases.
- Update this file when a milestone changes state.
- Do not buy or commit to a financial-data provider before confirming support for Chris's actual institutions.

## Milestone 1 — Establish the trusted baseline

**Status:** Complete

- [x] Confirm the authoritative branch and deployed production commit.
- [x] Resolve or close stale and superseded pull requests.
- [x] Verify the current production app with a smoke test.
- [x] Confirm no common credential signatures are present in tracked files or reachable repository history requiring rotation.
- [x] Record the trusted baseline in the project record.

**Recommended level:** 2X for repository cleanup and verification; 4X only if leaked credentials or a security incident is found.

## Milestone 2 — Lock the application to Chris

**Status:** Blocked — repository preparation merged in PR #113. Live Supabase catalog access, RLS/database execution, Auth changes, real credentials, test identities, and production verification require Chris's explicit approval.

**Issue:** #114

- Apply and verify Supabase RLS in the live project.
- Restrict access to the approved owner identity.
- Disable unrestricted public signup.
- Verify owner access succeeds.
- Verify an unauthorized authenticated identity fails.
- Verify unauthenticated access fails.
- Confirm logout, recovery, and session behavior.
- Record policies and live test evidence.

**Recommended level:** 4X for protected live execution and security review. Select this milestone explicitly only after approval.

## Milestone 3 — Create the actual account coverage matrix

**Status:** Waiting — the privacy-safe matrix template is prepared, but Chris must confirm the actual institutions and account types before this milestone can be complete or provider coverage can be tested.

**Issue:** #115

Create a concise private inventory of the accounts Chris actually uses. For each account record:

- institution
- account type
- data required: balance, transactions, liabilities, holdings, investment activity, or contributions
- Plaid support result
- secondary-provider need
- desired refresh frequency
- fallback method if no reliable connection exists

HealthEquity is a required test case. This is a practical provider-selection checklist, not a large standalone research project.

**Recommended level:** 2X for inventory and documentation; 3X when testing provider APIs or real connection behavior.

**Prepared evidence:** `docs/ACCOUNT_COVERAGE_MATRIX.md` records the required account and asset categories, the mandatory HealthEquity test case, provider-verification boundaries, refresh expectations, and fallbacks without storing personal account identifiers. Completion is still waiting on Chris's actual institution inventory.

## Milestone 4 — Define the normalized financial model

**Status:** Complete — repository-only model design recorded; live schema/database implementation remains a later protected milestone.

**Issue:** #116

Design provider-independent records for:

- financial connections
- institutions
- accounts
- balances and balance history
- transactions
- holdings
- investment transactions
- liabilities
- recurring items
- manual assets and valuations
- sync runs and connection events
- source snapshots and audit metadata

Preserve the existing snapshot system as a recovery and portability mechanism while normalized syncing is proven.

**Recommended level:** 4X for architecture, followed by 3X implementation phases.

**Evidence:** `docs/NORMALIZED_FINANCIAL_MODEL.md` defines the owner-scoped,
provider-independent records, provenance and temporal metadata, idempotency and
reconciliation boundaries, snapshot recovery contract, derived-data boundary,
and safe implementation sequence. No runtime, live database, authentication,
RLS, provider credential, or financial calculation changes were made.

## Milestone 5 — Build the secure provider backend

**Status:** Blocked — repository-only security design and implementation preparation is recorded, but backend runtime/deployment selection, live Supabase owner/RLS/Auth foundation, provider selection, secret management, credentials, and production access require Chris's explicit approval.

**Issue:** #117

Add server-side capabilities for:

- link or connection token creation
- public-token exchange
- protected access-token storage
- account and balance retrieval
- transaction synchronization
- investment and liability synchronization
- webhook verification and handling
- reauthentication
- disconnection and token deletion
- safe sync logging

No provider secret or permanent access token may reach browser code.

**Recommended level:** 4X for security design and token storage; 3X for contained provider endpoints after the design is approved.

**Prepared evidence:** `docs/SECURE_PROVIDER_BACKEND_DESIGN.md` defines the
server boundary, token lifecycle, endpoint contract, webhook and sync
invariants, redaction rules, approval-gated implementation sequence, and
acceptance evidence. No backend runtime, dependency, provider credential,
database, authentication, RLS, or financial calculation change was made.

## Milestone 6 — Prove Plaid coverage

**Status:** Blocked — the repository-only Sandbox protocol is prepared, but backend/runtime selection, Plaid Sandbox credentials, and Chris's institution inventory require explicit approval before execution.

**Issue:** #118

- Implement Plaid Sandbox first.
- Connect Chris's real institutions gradually only after security foundations are verified.
- Record balances, transactions, liabilities, holdings, refresh behavior, reauthentication behavior, and missing data for each institution.
- Do not assume Plaid covers every account.

**Recommended level:** 3X.

**Prepared evidence:** `docs/PLAID_SANDBOX_COVERAGE_PROTOCOL.md` defines the
redacted institution-by-institution test record, required data classes,
refresh/reauthentication checks, retry-deduplication evidence, and decision
rule. No Plaid API calls, credentials, backend runtime, database, auth/RLS, or
production financial data were used.

## Milestone 7 — Add the minimum required secondary connector

**Status:** Blocked — Milestone 6 has not produced institution-level Plaid gap evidence, and HealthEquity coverage remains unverified. Provider selection, Sandbox credentials, backend/runtime execution, and production access require the preceding approval and evidence gates.

**Issue:** #119

Choose a second provider only from the gaps proven during Milestone 6, with HealthEquity treated as a required case.

The second provider must normalize into the same BDFA data model. The interface should not depend on which provider supplied an account.

**Recommended level:** 3X, with a 4X review for credential storage or major security boundaries.

**Prepared evidence:** `docs/PROJECT_RECORD.md` records the repository reconciliation and exact prerequisites. No secondary provider was selected, no provider runtime or dependency was added, and no credentials or external provider calls were used.

## Milestone 8 — Connection health and automatic sync

**Status:** Complete — repository-only connection health and automatic refresh are implemented for the existing owner-authenticated Supabase snapshot path. Provider-level source timestamps, partial institution data, and provider-specific reauthentication remain dependent on the secure provider backend and normalized connection model.

**Issue:** #120

Add:

- last successful sync
- last attempted sync
- provider source timestamp
- error status
- reauthentication required
- partial-data warning
- manual refresh
- safe scheduled refresh
- stale-data visibility
- recovery from failed or interrupted syncs

**Recommended level:** 3X.

**Evidence:** `js/connection-health.js` records sync attempts and successful saves/loads, shows stale/error/reauthentication/pending-local states, supports manual refresh, and schedules authenticated browser refreshes. `js/data-adapter.js` emits sync lifecycle events without changing financial data contracts. `index.html` and `css/utility-cards.css` expose the health panel. No database, authentication, RLS, provider credential, or financial calculation changes were made.

## Milestone 9 — Complete financial truth

**Status:** Complete — repository-only derived financial truth is implemented and verified. Live normalized provider/database integration remains a later protected milestone.

**Issue:** #121

Build trusted outputs from normalized source data:

- combined net worth
- transaction history
- recurring income and bills
- Monthly Flow
- combined investment allocation
- contributions versus gains
- HSA and 401(k) contribution tracking
- realized and unrealized gains
- dividends and interest
- liability payoff tracking

Every derived number must remain traceable to source records and covered by representative tests.

**Recommended level:** 3X for contained calculations; 4X when defining portfolio-performance or retirement methodology.

**Evidence:** `js/financial-truth-engine.js` computes deterministic net worth,
cash flow, transactions, portfolio allocation, contributions/gains, account-type
contributions, and liability payoff outputs from normalized source data.
`js/financial-engine-pipeline.js` returns those outputs and
`scripts/test-financial-truth.mjs` verifies representative cases. No database,
authentication, RLS, provider credential, or deployment changes were made.

## Milestone 10 — Planning toward age 55

**Status:** Complete — repository-only, assumption-driven planning outputs are implemented and verified. Live normalized provider data, tax methodology, and deployment remain outside this milestone.

**Issue:** #122

After source data and calculations are trustworthy, add:

- retirement projections
- part-time income scenarios
- contribution scenarios
- healthcare and HSA projections
- mortgage payoff scenarios
- required monthly cash flow
- assumptions, confidence ranges, and explainable results

**Recommended level:** 4X for methodology, followed by 3X implementation phases.

**Evidence:** `js/retirement-planning-engine.js` computes deterministic age-55
projections, low/base/high return ranges, part-time-income and mortgage-paid-off
scenarios, HSA and healthcare projections, required monthly cash flow, explicit
assumptions, confidence metadata, and plain-English explanations.
`scripts/test-retirement-planning.mjs` covers representative synthetic cases;
`docs/RETIREMENT_PLANNING.md` records the methodology and boundaries. No
database, authentication, RLS, provider credential, or deployment changes were
made.

## Milestone 11 — Surface financial truth and age-55 planning in the dashboard

**Status:** Complete — repository-only dashboard integration is implemented and verified. Live normalized provider/database integration remains outside this milestone.

Wire the completed repository-only engines into visible, owner-facing dashboard sections without changing provider connections or live database schema.

Add:

- financial-truth summary cards for net worth, cash after bills, recurring flow, debt, and portfolio total
- age-55 planning cards for base projection, required monthly cash flow, part-time scenario, mortgage-paid scenario, HSA projection, and assumptions
- clear labels that outputs are derived, assumption-based, and only as fresh as the current source records
- empty, stale, and missing-data states
- representative UI or DOM tests where practical

This milestone should use existing source data paths only. Do not add Plaid, provider credentials, live Supabase migrations, Auth/RLS changes, paid services, or new financial recommendations.

**Recommended level:** 3X for contained UI integration; 4X only if methodology or security boundaries change.

**Evidence:** `js/financial-truth-dashboard.js` renders financial-truth summary cards and age-55 planning scenario cards from the existing source-data path, with explicit missing-assumption and source-freshness messaging. `scripts/test-dashboard-integration.mjs` verifies representative derived values and required dashboard hooks. No provider, database, authentication, RLS, or financial-methodology changes were made.

## Milestone 12 — Add manual source records for assets, liabilities, and planning assumptions

**Status:** Complete — repository-only manual source entry and snapshot compatibility are implemented; live normalized persistence remains separately protected.

Create a practical manual-entry source-data path for records that may not sync automatically yet.

Add:

- manual home and vehicle asset records
- manual mortgage, loan, and liability records
- manual planning assumptions for age, target age, annual contributions, healthcare cost, part-time income, and mortgage payment
- validation and safe defaults
- clear provenance labels showing manually entered versus synced data
- snapshot compatibility so manual records survive save/load

Manual data is fallback source data, not a replacement for automatic syncing. Do not store secrets, account numbers, or provider tokens. Do not execute live database migrations without explicit approval.

**Recommended level:** 3X.

**Evidence:** `index.html` and `js/app.js` provide validated manual asset, liability,
and age-55 assumption forms with provenance labels. `js/data-adapter.js` preserves
liabilities and planning assumptions across local and existing cloud snapshots.
`js/financial-engine-pipeline.js` consumes saved assumptions, and
`scripts/test-manual-source-records.mjs` verifies representative source-to-derived
behavior. No live database, authentication, RLS, provider credential, or production
financial data change was made.

## Milestone 13 — Build normalized source-data fixtures and reconciliation tests

**Status:** Complete — repository-only synthetic normalized fixtures and reconciliation tests are implemented. No real financial records, provider calls, credentials, production identifiers, database, authentication, RLS, or deployment changes were made.

Create representative normalized source-data fixtures that exercise the full BDFA model without using Chris's private account data.

Add synthetic fixtures for:

- checking and savings accounts
- credit cards
- mortgage and vehicle debt
- brokerage, 401(k), and HSA holdings
- investment transactions, dividends, interest, contributions, and gains
- recurring income and bills
- manual assets and liabilities
- stale, partial, duplicate, and missing provider data

Use these fixtures to verify source-to-derived reconciliation across financial truth, connection health, and age-55 planning. No real financial records, provider calls, credentials, or production identifiers may be added.

**Recommended level:** 3X.

**Evidence:** `scripts/fixtures/normalized-source-fixtures.mjs` provides complete, stale/partial, duplicate, and missing-data normalized snapshots covering cash, debt, investments, recurring items, assets, liabilities, and investment activity. `scripts/test-normalized-source-reconciliation.mjs` verifies deterministic financial truth, age-55 planning, source counts, connection-health metadata, duplicate visibility, and insufficient-data behavior. `scripts/ci.sh` runs the reconciliation suite.

## Milestone 14 — Add import, export, and recovery controls for source data

**Status:** Complete — repository-only export, import validation, merge analysis, and local recovery controls are implemented and verified.

Improve Chris's ability to back up, move, and recover BDFA source data while normalized provider syncing is still protected.

Add:

- export of redacted source-data snapshots
- import validation before replacing or merging source data
- duplicate and stale-record warnings
- recovery from a bad local or cloud snapshot
- visible backup timestamp and source count summary
- tests proving derived outputs are regenerated from source records after import

Exports must not include secrets, provider access tokens, account numbers, or sensitive logs. Any live provider or Supabase schema changes remain blocked without explicit approval.

**Recommended level:** 3X, with 4X review if export scope changes to include sensitive records.

**Evidence:** `js/data-adapter.js` now creates redacted versioned source exports,
validates export envelopes, reports duplicate and stale-record warnings, merges
validated snapshots by record ID, and stores a local recovery backup. `index.html`
and `js/app.js` expose validation-before-replace import behavior, export download,
backup timestamp/source summary, and recovery restore controls. `scripts/test-source-recovery.mjs`
verifies redaction, merge/recovery behavior, and regeneration of derived outputs
from imported source records. No database, authentication, RLS, provider
credential, or financial formula changes were made.

## Milestone 15 — Prepare normalized Supabase schema and RLS migration drafts

**Status:** Complete — repository-only SQL drafts, rollback notes, verification runbook, and static safety checks are prepared. No SQL was executed against Supabase.

Prepare repository-only SQL and runbooks for the normalized BDFA data model without applying them to the live Supabase project.

Add drafts for:

- owner-scoped normalized tables
- RLS policies for one approved owner
- connection metadata and sync run records
- account, balance, transaction, holding, investment transaction, liability, recurring item, manual asset, and valuation records
- indexes and uniqueness constraints for reconciliation
- rollback notes and verification steps

This milestone must not execute SQL against the live project. It should produce reviewable migration files, tests or static checks where practical, and a clear approval checklist for live execution.

**Recommended level:** 4X.

**Evidence:** `supabase/migrations/20260715_normalized_financial_schema.sql` defines 16 owner-scoped normalized tables, reconciliation constraints, indexes, and approved-owner RLS policies. `supabase/migrations/20260715_normalized_financial_schema.rollback.sql` records the destructive rollback draft. `docs/NORMALIZED_SCHEMA_MIGRATION_RUNBOOK.md` records prerequisites, verification, recovery, and approval gates. `scripts/check-normalized-schema-draft.py` runs through `scripts/ci.sh`.

**Boundary:** Live catalog inspection, owner bootstrap, migration execution, RLS/Auth changes, and destructive rollback remain blocked pending explicit approval and the Milestone 2 security foundation.

## Milestone 16 — Build provider-adapter contract and sandbox stubs

**Status:** Complete — repository-only provider-neutral contract, deterministic sandbox scenarios, normalization, and redaction tests are implemented. Real provider APIs, SDKs, credentials, backend secrets, database, Auth/RLS, and deployment remain outside this milestone.

**Evidence:** `js/provider-adapter-contract.js` defines the required datasets,
health states, sandbox-only adapter boundary, source-model normalization, and
redaction helper. `scripts/test-provider-adapter-contract.mjs` verifies healthy,
stale, partial, reauthentication, duplicate, and disconnected scenarios plus
unsupported datasets and redacted events. `docs/PROVIDER_ADAPTER_CONTRACT.md`
records the contract and future provider implementation gates. `bash scripts/ci.sh`
passes with the new contract suite included.

**Recommended level:** 3X for the next contained adapter implementation; 4X
review remains required if token handling or protected persistence is introduced.

Create the provider-neutral adapter contract that Plaid and any secondary provider must satisfy before live integration.

Add:

- adapter interfaces for institutions, accounts, balances, transactions, holdings, investment activity, liabilities, and connection health
- sandbox stub adapters with deterministic fake responses
- normalization tests that convert adapter output into the BDFA source model
- error, stale, partial, reauthentication, duplicate, and disconnected states
- redaction rules for logs and UI events

Do not call real provider APIs, add provider SDKs, store credentials, or create backend secrets in this milestone.

**Recommended level:** 3X, with 4X review if the adapter boundary affects token handling.

## Milestone 17 — Create protected-live execution runbooks

**Status:** Pending

Create the exact approval checklists and rollback plans for the blocked protected milestones so live work can be done deliberately when Chris approves it.

Cover:

- single-owner Supabase/Auth/RLS execution
- secure backend runtime selection
- provider secret storage
- Plaid Sandbox credential setup
- first live institution connection
- HealthEquity or secondary-provider evaluation
- live migration verification
- token deletion and account disconnection
- backup and rollback before each protected change

This is documentation and verification planning only. Do not perform live Supabase, Auth, provider, billing, or credential actions.

**Recommended level:** 4X.

## Milestone 18 — Add portfolio analytics depth

**Status:** Pending

Expand investment analytics after the basic financial truth engine is visible and tested.

Add derived outputs for:

- allocation by asset class and account type
- concentration risk
- overlapping holdings where source symbols are available
- dividends and interest totals
- contribution versus gain breakdown by account
- HSA and 401(k) contribution progress
- realized and unrealized gain placeholders with clear missing-data states

All outputs must remain derived from source records and clearly label missing or partial investment data. Do not infer performance from balances alone.

**Recommended level:** 3X for contained calculations; 4X for performance methodology.

## Milestone 19 — Add Monthly Flow and bill intelligence

**Status:** Pending

Make BDFA better at explaining monthly cash movement from source records.

Add:

- Monthly Flow summary from recurring income, recurring bills, and transactions
- upcoming bills and income timeline
- bill-change detection from source records where available
- subscription and recurring charge grouping
- available cash after near-term obligations
- stale or incomplete transaction warnings

Do not classify ambiguous transactions silently. Missing or partial source data must be visible in the output.

**Recommended level:** 3X.

## Milestone 20 — Add freshness, confidence, and audit explanations across the app

**Status:** Pending

Make every major number explain what it is based on, how fresh it is, and how confident BDFA is in the source data.

Add:

- source-count and last-updated explanations on major dashboard numbers
- confidence labels for complete, partial, stale, manual-only, and missing data
- drill-down audit text for net worth, Monthly Flow, portfolio allocation, and age-55 planning
- warnings when snapshot data is older than expected
- no-data and degraded-data states that are obvious without being noisy

This milestone should not change provider connectivity or financial methodology. It should make trust and freshness visible.

**Recommended level:** 3X.

## Deprioritized unless direction changes

- public onboarding
- subscriptions and billing
- public marketing
- multi-user households
- organizations and tenant administration
- public community features
- broad commercial scaling
- public App Store launch work
