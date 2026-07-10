# Chris Financial Institution And Account Coverage Matrix

## Purpose and scope

This document is the Task 179 planning inventory for Chris's real financial-institution and account coverage. It is a documentation gate only.

This task does not implement Plaid, select a secondary provider, change runtime behavior, remove features, change calculations, or change source-data contracts.

After Chris review, the matrix will determine which accounts Plaid must be tested against, which institutions remain uncovered, whether a second provider is actually required, which data is required from each account, where manual fallback is acceptable, and which accounts are highest priority for automatic syncing.

## Controlled status values

Every controlled-status column must use only the values listed here.

- Plaid coverage status: `Not researched`, `Listed as supported`, `Partially supported`, `Unsupported`, `Real connection verified`, `Real connection failed`, `Needs Chris confirmation`, `Unknown pending real provider testing`.
- Plaid test status: `Not tested`, `Sandbox only`, `Real connection pending`, `Real balance verified`, `Real transactions verified`, `Real holdings verified`, `Partial data`, `Failed`, `Reauthentication required`.
- Secondary-provider test required: `No`, `Possibly`, `Yes`, `Unknown pending testing`.
- Manual fallback acceptable: `Yes temporarily`, `Yes permanently`, `Emergency only`, `No`, `Possibly`, `Needs Chris confirmation`.
- Sync priority: `Critical`, `High`, `Medium`, `Low`, `Needs Chris confirmation`.
- Inventory status: `Confirmed`, `Unconfirmed from mock/demo data`, `Placeholder`, `Not applicable`.

## Inventory status definitions

- `Confirmed`: Repository evidence or Chris confirmation proves the institution/account is part of Chris's real inventory.
- `Unconfirmed from mock/demo data`: Existing mock/demo data names the institution or account candidate, but it is not confirmed as a real Chris account and must not be counted as confirmed inventory.
- `Placeholder`: The row exists to prevent silent omission while Chris confirmation is pending. It must not be counted as a confirmed real account.
- `Not applicable`: The row is not an account inventory row, such as a manually valued asset row.

Task 179 cannot be completed until Chris confirms every actual institution and account. Until then, unconfirmed mock/demo rows and placeholder rows remain planning prompts, not authoritative real-account inventory.

## Security limits

Use safe identifiers only. Do not record full account numbers, passwords, usernames, access tokens, security answers, routing numbers unless explicitly approved, or complete financial balances.

## Decision gates

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

## Account freshness requirements

Every automatically connected account must eventually expose three separate timestamps:

1. Provider balance timestamp: when the institution or provider says the balance was current.
2. BDFA sync timestamp: when BDFA retrieved and normalized the data.
3. Last successful refresh: the last time the full account refresh completed successfully.

BDFA must also track last refresh attempt, refresh status, reauthentication required, partial-data warning, and stale-data warning. These fields must not be collapsed into one generic updated value.

For rows that do not retrieve a balance, `Balance timestamp required` must be `No`; transaction, contribution, or distribution freshness must be represented through the relevant event timestamps and BDFA sync metadata instead.

## Coverage matrix

### A. Cash accounts

| Inventory status | Institution | Account display name | Category | Subtype | Ownership | Safe identifier | Current connection | Auto sync | Balance | Balance timestamp | Transactions | History depth | Holdings | Investment transactions | Cost basis | Contributions | Liability details | Interest rate | Minimum payment | Plaid coverage | Plaid data expected | Plaid test | Secondary-provider test | Manual fallback | Fallback method | Priority | Known issue | Reauthentication | Notes | Chris confirmation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Unconfirmed — from mock/demo data: Chase | Chase Checking | Cash | Checking | Chris | `checking` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | No | Possibly | No | Not researched | Balances, transactions, identity, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual balance and transaction import during outage | Critical | None documented | Unknown | Candidate primary checking account. | Needs Chris confirmation |
| Unconfirmed from mock/demo data | Unconfirmed — from mock/demo data: Huntington | Huntington Savings | Cash | Savings | Chris | `savings` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | No | Yes | No | Not researched | Balances, transactions, identity, timestamps, connection health | Not tested | Unknown pending testing | Yes temporarily | Manual balance update plus approved CSV fallback | Critical | None documented | Unknown | Candidate primary savings account. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Additional cash account | Cash | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes | Yes | Needs Chris confirmation | Needs Chris confirmation | No | No | No | Needs Chris confirmation | No | Possibly | No | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Prevents silent omission. | Needs Chris confirmation |

### B. Credit accounts

| Inventory status | Institution | Account display name | Category | Subtype | Ownership | Safe identifier | Current connection | Auto sync | Balance | Balance timestamp | Transactions | History depth | Holdings | Investment transactions | Cost basis | Contributions | Liability details | Interest rate | Minimum payment | Plaid coverage | Plaid data expected | Plaid test | Secondary-provider test | Manual fallback | Fallback method | Priority | Known issue | Reauthentication | Notes | Chris confirmation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Unconfirmed — from mock/demo data: Capital One | Capital One credit card | Credit | Credit card | Chris | `capital-one` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Not researched | Balances, transactions, payment metadata, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual balance and statement/CSV import during outage | Critical | None documented | Unknown | Candidate major credit card. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Additional credit card or line of credit | Credit | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Prevents silent omission. | Needs Chris confirmation |

### C. Liabilities

| Inventory status | Institution | Account display name | Category | Subtype | Ownership | Safe identifier | Current connection | Auto sync | Balance | Balance timestamp | Transactions | History depth | Holdings | Investment transactions | Cost basis | Contributions | Liability details | Interest rate | Minimum payment | Plaid coverage | Plaid data expected | Plaid test | Secondary-provider test | Manual fallback | Fallback method | Priority | Known issue | Reauthentication | Notes | Chris confirmation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Needs Chris confirmation | Mortgage | Liability | Mortgage | Chris | `mortgage` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Balance, payment due, rate, escrow if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual liability update plus statement fallback | Critical | Servicer not documented | Unknown | Material to net worth and cash flow. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Vehicle loan | Liability | Vehicle loan | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Balance, payment due, rate, maturity, timestamps, connection health | Not tested | Unknown pending testing | Needs Chris confirmation | Manual statement fallback if approved | High | Needs Chris confirmation | Unknown | Include only if an active loan exists. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Personal loan or other debt | Liability | Other debt | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Balance, payment due, rate, maturity, timestamps, connection health | Not tested | Unknown pending testing | Needs Chris confirmation | Manual statement fallback if approved | High | Needs Chris confirmation | Unknown | Include only if active debt exists. | Needs Chris confirmation |

### D. Investments

| Inventory status | Institution | Account display name | Category | Subtype | Ownership | Safe identifier | Current connection | Auto sync | Balance | Balance timestamp | Transactions | History depth | Holdings | Investment transactions | Cost basis | Contributions | Liability details | Interest rate | Minimum payment | Plaid coverage | Plaid data expected | Plaid test | Secondary-provider test | Manual fallback | Fallback method | Priority | Known issue | Reauthentication | Notes | Chris confirmation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Needs Chris confirmation | 401(k) | Investment | 401(k) | Chris | `401k` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history | Yes | Yes | Yes if available | Yes | No | No | No | Needs Chris confirmation | Balances, holdings, transactions, employee and employer contributions, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual holdings and contribution import if automation fails | Critical | Institution not documented | Unknown | Main retirement and contribution-tracking candidate. | Needs Chris confirmation |
| Placeholder | HealthEquity | HSA investment account structure | Investment | HSA investments | Chris | `hsa-investments` | Needs Chris confirmation | Yes | Yes | Yes | Yes | Full available HSA history | Yes | Yes | Yes if available | Yes | No | No | No | Unknown pending real provider testing | Balances, holdings, transactions, contributions, distributions, dividends, interest, cost basis, timestamps, health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import only if real testing proves necessary | Critical | Requires real provider testing | Unknown | Exact account structure remains unconfirmed. | Needs Chris confirmation |
| Unconfirmed from mock/demo data | Needs Chris confirmation | Roth IRA | Investment | Roth IRA | Chris | `roth-ira` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history | Yes | Yes | Yes if available | Yes | No | No | No | Needs Chris confirmation | Balances, holdings, transactions, contributions, timestamps, connection health | Not tested | Unknown pending testing | Possibly | Manual holdings and contribution import if automation fails | High | Institution not documented | Unknown | Candidate retirement account. | Needs Chris confirmation |
| Unconfirmed from mock/demo data | Needs Chris confirmation | Brokerage | Investment | Taxable brokerage | Chris | `brokerage` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history | Yes | Yes | Yes | Needs Chris confirmation | No | No | No | Needs Chris confirmation | Balances, holdings, transactions, cost basis, dividends, interest, gain inputs, timestamps, connection health | Not tested | Unknown pending testing | Possibly | Manual holdings/import fallback if automation fails | Critical | Institution not documented | Unknown | Candidate portfolio analytics source. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Additional investment or retirement account | Investment | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes | Yes | Needs Chris confirmation | Full available history | Yes | Yes | Yes if available | Needs Chris confirmation | No | No | No | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Prevents silent omission. | Needs Chris confirmation |

### E. Health Savings Account

| Inventory status | Institution | Account display name | Category | Subtype | Ownership | Safe identifier | Current connection | Auto sync | Balance | Balance timestamp | Transactions | History depth | Holdings | Investment transactions | Cost basis | Contributions | Liability details | Interest rate | Minimum payment | Plaid coverage | Plaid data expected | Plaid test | Secondary-provider test | Manual fallback | Fallback method | Priority | Known issue | Reauthentication | Notes | Chris confirmation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Placeholder | HealthEquity | HSA cash account structure | HSA | HSA cash | Chris | `hsa-cash` | Needs Chris confirmation | Yes | Yes | Yes | Yes | Full available HSA history | No | No | No | Yes | No | Possibly | No | Unknown pending real provider testing | Cash balance, contributions, distributions, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import only if real testing proves necessary | Critical | Requires real provider testing | Unknown | Exact account structure remains unconfirmed. | Needs Chris confirmation |
| Placeholder | HealthEquity | HSA contribution data structure | HSA | HSA contributions | Chris | `hsa-contribution` | Needs Chris confirmation | Yes | No | No | Yes | Full contribution history | No | No | No | Yes | No | No | No | Unknown pending real provider testing | Employer and employee contributions, dates, tax-year classification, event timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual export/import or payroll/statement entry if automation fails | Critical | Requires real provider testing | Unknown | No balance is fetched for this tracking-only row. | Needs Chris confirmation |
| Placeholder | HealthEquity | HSA distributions | HSA | HSA distributions | Chris | `hsa-distributions` | Needs Chris confirmation | Yes | No | No | Yes | Full distribution history | No | No | No | Yes | No | No | No | Unknown pending real provider testing | Distribution dates, amounts, categories, event timestamps, connection health | Not tested | Unknown pending testing | Yes temporarily | Manual export/import or statement entry if low volume | High | Requires real provider testing | Unknown | No balance is fetched for this tracking-only row. | Needs Chris confirmation |

## HealthEquity Coverage Gate

BDFA requires HealthEquity testing for HSA cash balance, contribution history, employer and employee contributions, distributions, investment holdings, investment transactions, cost basis if available, dividends and interest, provider timestamps, and connection health.

Provider coverage status for HealthEquity is `Unknown pending real provider testing`. No secondary provider may be selected merely because HealthEquity is suspected to be unsupported. Actual coverage testing is required.

## Manually valued assets

Manually valued assets are separate from provider-connected financial accounts. A home estimate, vehicle estimate, or user-entered value is not a connected financial balance.

| Asset | Valuation source | Valuation date | Estimate status | Override method | Update frequency | Stale threshold |
|---|---|---|---|---|---|---|
| Primary residence | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | User-entered override with notes and value history | Monthly or when materially changed | Warn when older than 90 days unless Chris approves otherwise |
| Vehicles | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | User-entered override with notes and value history | Quarterly or when materially changed | Warn when older than 180 days unless Chris approves otherwise |
| Other manually valued assets | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | User-entered override with notes and value history | Needs Chris confirmation | Needs Chris confirmation |

Each manually valued asset must eventually support asset name, category, current value, valuation source, valuation date, estimate status, user override, notes, stale-value warning, and value history.

## Portfolio-performance definition gate

Do not implement portfolio-performance reporting until an approved specification defines treatment of contributions, employer contributions, withdrawals, internal and external transfers, dividends, interest, fees, taxes if available, realized and unrealized gains, reinvested distributions, incomplete history, missing cost basis, accounts opened mid-period, manually entered holdings, and unsupported investment transactions.

## Raw provider payload retention

Raw provider payloads may be retained only for audit, debugging, replay, normalization traceability, or provider dispute investigation. Future storage must include sensitive-data redaction, retention limits, restricted access, no browser exposure, safe logging, deletion procedures, and linkage to normalized records where needed. Raw payload storage must not become BDFA's permanent source model.

## Coverage summary

Known inventory as of the current project record, separated by evidence status:

- Confirmed institutions: 1. HealthEquity is explicitly identified as a required coverage test case, but exact account inventory remains pending Chris confirmation.
- Confirmed accounts: 0.
- Unconfirmed named institutions from mock/demo data: 3 (`Chase`, `Huntington`, `Capital One`).
- Unconfirmed account candidates from mock/demo data: 7 rows.
- Placeholder account rows: 9 rows.
- Accounts requiring Chris confirmation: all 16 account matrix rows.
- Accounts requiring real Plaid testing: 0 confirmed accounts yet; after confirmation, each active account requiring automatic sync must be tested where practical.
- Accounts potentially requiring a secondary provider: `Unknown pending testing`.
- Manual fallback decisions remain planning-only until Chris confirms the inventory.

Do not present unconfirmed mock/demo rows, placeholders, or planning counts as final real-account inventory.
