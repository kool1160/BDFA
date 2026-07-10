# BDFA Roadmap

## Governing product direction

BDFA is a secure, private, single-user financial command center for Chris.

BDFA is not currently being built as a public SaaS product. The product should optimize for Chris's real accounts, planning decisions, privacy, and low-maintenance operations before any broader distribution is reconsidered.

## Active priorities

The active BDFA priorities are:

- Automatic account syncing for Chris's real institutions and accounts.
- Complete net-worth tracking across cash, liabilities, investments, retirement, HSA, and manually valued property.
- Account freshness and connection health.
- Normalized transactions, balances, liabilities, and holdings.
- Portfolio analytics.
- Contribution tracking.
- Retirement and part-time-work planning.
- Mobile usability.
- Strong security.
- Low maintenance.

## Explicitly deprioritized work

The following are deprioritized unless Chris explicitly reopens them in a future approved roadmap change:

- Public registration.
- Public SaaS onboarding.
- Organizations.
- Unrelated users.
- Household administration.
- Subscription tiers.
- Stripe billing.
- Marketing pages.
- Public support systems.
- Broad institution compatibility unrelated to Chris.
- Public App Store distribution.
- Enterprise scaling.

## Governing architecture rules

### Approved-user model

BDFA should prefer a protected database allowlist table, such as `approved_users`, over hard-coding the owner UUID throughout database policies.

The approved-user record should eventually support at minimum:

- Authenticated user UUID.
- Approved email.
- Enabled status.
- Created timestamp.
- Optional notes or audit metadata.

This roadmap documents the preferred future authorization model only. The `approved_users` table is not implemented by this task.

### Account freshness

Every automatically connected account must eventually expose three separate timestamps:

1. Provider balance timestamp: when the institution or provider says the balance was current.
2. BDFA sync timestamp: when BDFA retrieved and normalized the data.
3. Last successful refresh: the last time the full account refresh completed successfully.

BDFA must also track:

- Last refresh attempt.
- Refresh status.
- Reauthentication required.
- Partial-data warning.
- Stale-data warning.

Do not collapse these fields into one generic `updated` value.

### Secondary-provider gate

Do not select, contract with, or implement a second financial-data provider until:

- HealthEquity has been tested against real provider coverage.
- Every other uncovered institution has been tested.
- The missing data types are documented.
- Plaid coverage limitations are proven.
- Manual fallback limitations are documented.

### Raw provider payload retention

Raw provider payloads may be retained only when needed for:

- Audit.
- Debugging.
- Replay.
- Normalization traceability.
- Provider dispute investigation.

Future raw-payload design must include:

- Sensitive-data redaction.
- Retention limits.
- Restricted access.
- No browser exposure.
- Safe logging.
- Deletion procedures.
- Linkage to normalized records where needed.

Raw provider payload storage must not become the permanent source model. BDFA's normalized source records remain the application model.

### Portfolio-performance definition gate

Do not implement portfolio-performance reporting until the calculation methodology defines treatment of:

- Contributions.
- Employer contributions.
- Withdrawals.
- Internal transfers.
- External transfers.
- Dividends.
- Interest.
- Fees.
- Taxes if available.
- Realized gains.
- Unrealized gains.
- Reinvested distributions.
- Incomplete historical data.
- Missing cost basis.
- Account opening mid-period.
- Manually entered holdings.
- Unsupported investment transactions.

Performance calculations require a separate approved specification before implementation.

### Manually valued assets

Home, vehicles, and other manually valued property must remain separate from financially connected accounts.

Each manually valued asset must eventually support:

- Asset name.
- Asset category.
- Current value.
- Valuation source.
- Valuation date.
- Estimate status.
- User override value.
- Optional notes.
- Stale-value warning.
- Value history.

Do not treat a Zillow estimate, vehicle estimate, or user-entered value as a connected financial balance.

## Provider-selection decision gate

No secondary provider may be selected until:

- Every known institution has a matrix row.
- Every known account has required data types documented.
- Plaid has been tested where practical.
- HealthEquity coverage has been tested.
- All uncovered institutions are listed.
- Missing data types are identified.
- Manual fallback acceptability is decided.
- Provider cost and maintenance implications are compared.
- Chris approves the coverage findings.

No Plaid implementation work begins until Task 179 is approved. Research and sandbox planning may follow Task 179, but production integration remains a separate task.

## Current implementation phases

### Phase 1 — Static prototype

- Build responsive HTML/CSS/JS prototype.
- Use mock data.
- Create Home dashboard.
- Create expandable Accounts, Bills, Allocations, Investments sections.
- Add AI assistant placeholder.

### Phase 2 — Local data

- Add local storage.
- Add editable accounts.
- Add editable bills.
- Add recurring bill schedule logic.
- Calculate Available to Allocate dynamically.

### Phase 3 — Chris account-sync planning and implementation

- Complete Task 179 and obtain Chris approval of the account coverage matrix.
- Research and sandbox-plan Plaid only after Task 179 documentation is approved.
- Keep production Plaid integration blocked until a separate implementation task is approved.
- Add backend and auth only through scoped tasks that preserve the approved-user model.
- Add financial aggregators only after coverage, freshness, retention, and manual fallback requirements are approved.
- Add manual CSV/import and statement upload fallbacks where approved by account.

### Phase 4 — Intelligence

- Add AI assistant.
- Ask questions about affordability, savings, investments, and allocation.
- Explain why Available to Allocate changed.

## Current engine wiring status

The reusable financial engine files are ES modules that exist as architecture foundations, but they are not currently loaded by the static dashboard. Future wiring should use `type="module"` or an equivalent module-aware approach when a scoped engine-integration task connects them.
