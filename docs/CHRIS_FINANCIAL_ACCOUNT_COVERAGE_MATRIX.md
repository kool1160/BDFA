# Chris Financial Institution And Account Coverage Matrix

## Purpose and scope

This document is the Task 179 planning inventory for Chris's real financial-institution and account coverage. It is a documentation gate only.

This task does not implement Plaid, select a secondary provider, change runtime behavior, remove features, change calculations, or change source-data contracts.

After Chris review, the matrix will determine which accounts Plaid must be tested against, which institutions remain uncovered, whether a second provider is actually required, which data is required from each account, where manual fallback is acceptable, and which accounts are highest priority for automatic syncing.

## Controlled status values

- Plaid coverage status: `Not researched`, `Listed as supported`, `Partially supported`, `Unsupported`, `Real connection verified`, `Real connection failed`, `Needs Chris confirmation`.
- Plaid test status: `Not tested`, `Sandbox only`, `Real connection pending`, `Real balance verified`, `Real transactions verified`, `Real holdings verified`, `Partial data`, `Failed`, `Reauthentication required`.
- Secondary-provider test required: `No`, `Possibly`, `Yes`, `Unknown pending testing`.
- Manual fallback acceptable: `Yes temporarily`, `Yes permanently`, `Emergency only`, `No`.
- Sync priority: `Critical`, `High`, `Medium`, `Low`.

## Inventory status definitions

Every matrix row must use one of these inventory statuses:

- `Confirmed`: Repository evidence or Chris confirmation proves the institution/account is part of Chris's real inventory.
- `Unconfirmed from mock/demo data`: Existing mock/demo data names this institution or account candidate, but it is not confirmed as a real Chris account and must not be counted as confirmed inventory.
- `Placeholder`: The row exists to prevent silent omission of a category or required data area while Chris confirmation is pending. It must not be counted as a confirmed real account.
- `Not applicable`: The row is not an account inventory row, such as explanatory sections or manually valued asset rows.

Task 179 cannot be completed until Chris confirms every actual institution and account. Until then, unconfirmed mock/demo rows and placeholder rows remain planning prompts, not authoritative real-account inventory.

## Security limits

Use safe identifiers only. This document must not record full account numbers, passwords, usernames, access tokens, security answers, routing numbers unless explicitly approved, or complete financial balances.

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

## Coverage matrix

### A. Cash accounts

| Inventory status | Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Unconfirmed — from mock/demo data: Chase | Unconfirmed — from mock/demo data: Chase Checking | Cash | Checking | Chris | `checking` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | No | Possibly | No | Not researched | Balances, transactions, account identity, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual balance and transaction import only if sync unavailable | Critical | None documented | Unknown | Critical because primary checking affects Monthly Flow and cash availability. | Needs Chris confirmation |
| Unconfirmed from mock/demo data | Unconfirmed — from mock/demo data: Huntington | Unconfirmed — from mock/demo data: Huntington Savings | Cash | Savings | Chris | `savings` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | No | Yes | No | Not researched | Balances, transactions, account identity, timestamps, connection health | Not tested | Unknown pending testing | Yes temporarily | Manual balance update plus CSV/import fallback if approved | Critical | None documented | Unknown | Critical because primary savings affects complete net worth and cash reserves. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Additional checking, savings, or cash-management accounts | Cash | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if account exists | Yes if account exists | Needs Chris confirmation | Needs Chris confirmation | No unless cash-management investments exist | No unless investments exist | No unless investments exist | Needs Chris confirmation | No | Possibly | No | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Placeholder row prevents silent omission of undocumented cash accounts. | Needs Chris confirmation |

### B. Credit accounts

| Inventory status | Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Unconfirmed — from mock/demo data: Capital One | Unconfirmed — from mock/demo data: Capital One | Credit accounts | Credit card | Chris | `capital-one` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Not researched | Balances, transactions, liability/payment metadata if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual balance and statement/CSV import only during outage | Critical | None documented | Unknown | Critical because major credit cards affect Monthly Flow, debt, payments, and spending analysis. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Additional credit cards or lines of credit | Credit accounts | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if account exists | Yes if account exists | Yes if active | At least 24 months where available | No | No | No | No | Yes if revolving debt exists | Yes if available | Yes if available | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Placeholder row prevents silent omission of undocumented credit accounts. | Needs Chris confirmation |

### C. Liabilities

| Inventory status | Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Needs Chris confirmation | Unconfirmed — from mock/demo data: Mortgage | Liabilities | Mortgage | Chris | `mortgage` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months of payments where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Mortgage balance, payment due, interest rate, escrow if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual liability update plus statement fallback during outage | Critical | Servicer not documented | Unknown | Critical because mortgage materially affects net worth, home equity, and active payment planning. Institution/servicer requires Chris confirmation. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Vehicle loans | Liabilities | Vehicle loan | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if loan exists | Yes if loan exists | Yes if active | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Loan balance, payment due, interest rate, maturity if available, timestamps, connection health | Not tested | Unknown pending testing | Needs Chris confirmation | Manual liability update plus statement fallback if approved | High | Needs Chris confirmation | Unknown | High if active payments or material net-worth impact exist. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Personal loans or other debt | Liabilities | Personal loan / other debt | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if loan exists | Yes if loan exists | Yes if active | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Loan balance, payment due, interest rate, maturity if available, timestamps, connection health | Not tested | Unknown pending testing | Needs Chris confirmation | Manual liability update plus statement fallback if approved | High | Needs Chris confirmation | Unknown | High if active payments or material net-worth impact exist. | Needs Chris confirmation |

### D. Investments

| Inventory status | Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unconfirmed from mock/demo data | Needs Chris confirmation | Unconfirmed — from mock/demo data: 401(k) | Investments | 401(k) | Chris | `401k` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history where practical | Yes | Yes | Yes if available | Yes | No | No | No | Needs Chris confirmation | Balances, holdings, investment transactions, contributions, employer contributions if available, cost basis if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual holdings/contribution import only if automated coverage fails | Critical | Institution not documented | Unknown | Critical because it is a main retirement account and contribution-tracking input. | Needs Chris confirmation |
| Placeholder | HealthEquity | HSA investment account structure pending Chris confirmation | Investments | HSA investments | Chris | `hsa-investments` | Needs Chris confirmation | Yes | Yes | Yes | Yes | Full available HSA history where practical | Yes | Yes | Yes if available | Yes | No | No | No | Unknown pending real provider testing | Balances, holdings, investment transactions, contributions, distributions, dividends, interest, cost basis if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import only if real provider testing proves automation insufficient | Critical | Unknown; requires real provider testing | Unknown | Critical because HSA investments affect net worth, healthcare planning, and contribution tracking. | Needs Chris confirmation |
| Unconfirmed from mock/demo data | Needs Chris confirmation | Unconfirmed — from mock/demo data: Roth IRA | Investments | Roth IRA | Chris | `roth-ira` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history where practical | Yes | Yes | Yes if available | Yes | No | No | No | Needs Chris confirmation | Balances, holdings, investment transactions, contributions, cost basis if available, timestamps, connection health | Not tested | Unknown pending testing | Possibly | Manual holdings/contribution import only if automated coverage fails | High | Institution not documented | Unknown | High because it materially affects retirement planning and net worth. | Needs Chris confirmation |
| Unconfirmed from mock/demo data | Needs Chris confirmation | Unconfirmed — from mock/demo data: Brokerage | Investments | Taxable brokerage | Chris | `brokerage` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history where practical | Yes | Yes | Yes | No unless recurring contributions exist | No | No | No | Needs Chris confirmation | Balances, holdings, investment transactions, cost basis, dividends, interest, realized/unrealized gain inputs, timestamps, connection health | Not tested | Unknown pending testing | Possibly | Manual holdings/import fallback only if automated coverage fails | Critical | Institution not documented | Unknown | Critical because main brokerage is a required automatic-sync priority and portfolio analytics source. | Needs Chris confirmation |
| Placeholder | Needs Chris confirmation | Additional IRA, pension, retirement plan, or taxable investment accounts | Investments | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if account exists | Yes if account exists | Needs Chris confirmation | Full available history where practical | Yes if investment account exists | Yes if investment account exists | Yes if available | Needs Chris confirmation | No | No | No | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Placeholder row prevents silent omission of undocumented investment accounts. | Needs Chris confirmation |

### E. Health Savings Account

| Inventory status | Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Placeholder | HealthEquity | HSA cash account structure pending Chris confirmation | Health Savings Account | HSA cash | Chris | `hsa-cash` | Needs Chris confirmation | Yes | Yes | Yes | Yes | Full available HSA history where practical | No | No | No | Yes | No | Possibly | No | Unknown pending real provider testing | HSA cash balance, contribution history, employer contributions, employee contributions, distributions, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import only if real provider testing proves automation insufficient | Critical | Unknown; requires real provider testing | Unknown | Critical because HSA cash affects complete net worth, healthcare planning, and contribution tracking. | Needs Chris confirmation |
| Placeholder | HealthEquity | HSA contribution data structure pending Chris confirmation | Health Savings Account | HSA contributions | Chris | `hsa-contribution` | Needs Chris confirmation | Yes | No | Yes | Yes | Full available HSA contribution history where practical | No | No | No | Yes | No | No | No | Unknown pending real provider testing | Employer contributions, employee contributions, contribution dates, tax year classification if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import or payroll/statement entry if automated coverage fails | Critical | Unknown; requires real provider testing | Unknown | Critical because contribution tracking is an active priority. | Needs Chris confirmation |
| Placeholder | HealthEquity | HSA distributions pending Chris confirmation | Health Savings Account | HSA distributions | Chris | `hsa-distributions` | Needs Chris confirmation | Yes if distributions exist | No | Yes | Yes | Full available HSA distribution history where practical | No | No | No | Yes | No | No | No | Unknown pending real provider testing | Distribution dates, amounts, categories if available, timestamps, connection health | Not tested | Unknown pending testing | Yes temporarily | Manual export/import or statement entry if low volume | High | Unknown; requires real provider testing | Unknown | High if distributions are relevant to healthcare spending and tax planning. | Needs Chris confirmation |

## HealthEquity Coverage Gate

BDFA requires the following data from HealthEquity before provider coverage can be considered adequate:

- HSA cash balance.
- Contribution history.
- Employer contributions.
- Employee contributions.
- Distributions.
- Investment holdings.
- Investment transactions.
- Cost basis if available.
- Dividends and interest.
- Last-updated timestamps.
- Account connection health.

Provider coverage status for HealthEquity is `Unknown — requires real provider testing`. No secondary provider may be selected merely because HealthEquity is suspected to be unsupported. The matrix requires actual coverage testing before provider selection.

## Manually valued assets

Manually valued assets are separate from provider-connected financial accounts. A Zillow estimate, vehicle estimate, or user-entered value is not a connected financial balance.

| Asset | Valuation source | Valuation date | Estimate status | Override method | Update frequency | Stale threshold |
|---|---|---|---|---|---|---|
| Primary residence | Needs Chris confirmation; possible manual estimate or approved valuation source | Needs Chris confirmation | Needs Chris confirmation | User-entered override with notes and value history | Monthly or when materially changed | Warn when older than 90 days unless Chris approves a different threshold |
| Vehicles | Needs Chris confirmation; possible manual estimate or approved vehicle valuation source | Needs Chris confirmation | Needs Chris confirmation | User-entered override with notes and value history | Quarterly or when materially changed | Warn when older than 180 days unless Chris approves a different threshold |
| Other manually valued assets | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | User-entered override with notes and value history | Needs Chris confirmation | Needs Chris confirmation |

Each manually valued asset must eventually support asset name, asset category, current value, valuation source, valuation date, estimate status, user override value, optional notes, stale-value warning, and value history.

## Portfolio-performance definition gate

Do not implement portfolio-performance reporting until a separate approved specification defines treatment of contributions, employer contributions, withdrawals, internal transfers, external transfers, dividends, interest, fees, taxes if available, realized gains, unrealized gains, reinvested distributions, incomplete historical data, missing cost basis, account opening mid-period, manually entered holdings, and unsupported investment transactions.

## Raw provider payload retention

Raw provider payloads may be retained only for audit, debugging, replay, normalization traceability, or provider dispute investigation. Future storage must include sensitive-data redaction, retention limits, restricted access, no browser exposure, safe logging, deletion procedures, and linkage to normalized records where needed. Raw payload storage must not be designed as BDFA's permanent source model.

## Coverage summary

Known inventory as of the current project record, separated by evidence status:

- Confirmed institutions: 1. HealthEquity is explicitly identified as a required coverage test case in the product direction, but exact HealthEquity account inventory remains pending Chris confirmation.
- Confirmed accounts: 0. No repository evidence verifies a specific real account as confirmed.
- Unconfirmed named institutions from mock/demo data: 3 (`Chase`, `Huntington`, `Capital One`). These are candidates only and are not counted as confirmed real inventory.
- Unconfirmed account candidates from mock/demo data: 7 rows (Chase Checking, Huntington Savings, Capital One, Mortgage, 401(k), Roth IRA, Brokerage). These are not counted as confirmed accounts.
- Placeholder account rows: 9 rows (additional cash accounts, additional credit accounts, vehicle loans, personal loans or other debt, HealthEquity HSA investment account structure, additional investment accounts, HealthEquity HSA cash account structure, HealthEquity HSA contribution data structure, HealthEquity HSA distributions).
- Accounts requiring Chris confirmation: all 16 account matrix rows because Task 179 cannot be complete until Chris confirms every actual institution and account.
- Accounts requiring real Plaid testing: 0 confirmed accounts yet; after Chris confirmation, each active account requiring automatic sync must be tested where practical, with HealthEquity explicitly gated for real provider testing.
- Accounts potentially requiring a secondary provider: Unknown pending testing; no provider is selected by this document.
- Accounts where manual fallback is acceptable: Temporary or emergency fallback is documented by row for planning only; permanent fallback requires Chris confirmation.
- Accounts where manual fallback is not acceptable: None finally decided until Chris confirms the real account inventory.

Do not present unconfirmed mock/demo rows, placeholders, or these planning counts as final real-account inventory.
