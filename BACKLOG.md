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

**Status:** Pending

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

## Milestone 5 — Build the secure provider backend

**Status:** Pending

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

## Milestone 6 — Prove Plaid coverage

**Status:** Pending

**Issue:** #118

- Implement Plaid Sandbox first.
- Connect Chris's real institutions gradually only after security foundations are verified.
- Record balances, transactions, liabilities, holdings, refresh behavior, reauthentication behavior, and missing data for each institution.
- Do not assume Plaid covers every account.

**Recommended level:** 3X.

## Milestone 7 — Add the minimum required secondary connector

**Status:** Pending

**Issue:** #119

Choose a second provider only from the gaps proven during Milestone 6, with HealthEquity treated as a required case.

The second provider must normalize into the same BDFA data model. The interface should not depend on which provider supplied an account.

**Recommended level:** 3X, with a 4X review for credential storage or major security boundaries.

## Milestone 8 — Connection health and automatic sync

**Status:** Pending

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

## Milestone 9 — Complete financial truth

**Status:** Pending

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

## Milestone 10 — Planning toward age 55

**Status:** Pending

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

## Deprioritized unless direction changes

- public onboarding
- subscriptions and billing
- public marketing
- multi-user households
- organizations and tenant administration
- public community features
- broad commercial scaling
- public App Store launch work