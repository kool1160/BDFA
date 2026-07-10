# Chris Financial Institution And Account Coverage Matrix

## Purpose and scope

This document is the authoritative Task 179 planning inventory for Chris's real financial-institution and account coverage. It is a documentation gate only.

This task does not implement Plaid, select a secondary provider, change runtime behavior, remove features, change calculations, or change source-data contracts.

The matrix determines which accounts Plaid must be tested against, which institutions remain uncovered, whether a second provider is actually required, which data is required from each account, where manual fallback is acceptable, and which accounts are highest priority for automatic syncing.

## Controlled status values

- Plaid coverage status: `Not researched`, `Listed as supported`, `Partially supported`, `Unsupported`, `Real connection verified`, `Real connection failed`, `Needs Chris confirmation`.
- Plaid test status: `Not tested`, `Sandbox only`, `Real connection pending`, `Real balance verified`, `Real transactions verified`, `Real holdings verified`, `Partial data`, `Failed`, `Reauthentication required`.
- Secondary-provider test required: `No`, `Possibly`, `Yes`, `Unknown pending testing`.
- Manual fallback acceptable: `Yes temporarily`, `Yes permanently`, `Emergency only`, `No`.
- Sync priority: `Critical`, `High`, `Medium`, `Low`.

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

| Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Chase | Chase Checking | Cash | Checking | Chris | `checking` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | No | Possibly | No | Not researched | Balances, transactions, account identity, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual balance and transaction import only if sync unavailable | Critical | None documented | Unknown | Critical because primary checking affects Monthly Flow and cash availability. | Needs Chris confirmation |
| Huntington | Huntington Savings | Cash | Savings | Chris | `savings` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | No | Yes | No | Not researched | Balances, transactions, account identity, timestamps, connection health | Not tested | Unknown pending testing | Yes temporarily | Manual balance update plus CSV/import fallback if approved | Critical | None documented | Unknown | Critical because primary savings affects complete net worth and cash reserves. | Needs Chris confirmation |
| Needs Chris confirmation | Additional checking, savings, or cash-management accounts | Cash | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if account exists | Yes if account exists | Needs Chris confirmation | Needs Chris confirmation | No unless cash-management investments exist | No unless investments exist | No unless investments exist | Needs Chris confirmation | No | Possibly | No | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Placeholder row prevents silent omission of undocumented cash accounts. | Needs Chris confirmation |

### B. Credit accounts

| Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Capital One | Capital One | Credit accounts | Credit card | Chris | `capital-one` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Not researched | Balances, transactions, liability/payment metadata if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual balance and statement/CSV import only during outage | Critical | None documented | Unknown | Critical because major credit cards affect Monthly Flow, debt, payments, and spending analysis. | Needs Chris confirmation |
| Needs Chris confirmation | Additional credit cards or lines of credit | Credit accounts | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if account exists | Yes if account exists | Yes if active | At least 24 months where available | No | No | No | No | Yes if revolving debt exists | Yes if available | Yes if available | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Placeholder row prevents silent omission of undocumented credit accounts. | Needs Chris confirmation |

### C. Liabilities

| Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Needs Chris confirmation | Mortgage | Liabilities | Mortgage | Chris | `mortgage` | Manual/mock dataset | Yes | Yes | Yes | Yes | At least 24 months of payments where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Mortgage balance, payment due, interest rate, escrow if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual liability update plus statement fallback during outage | Critical | Servicer not documented | Unknown | Critical because mortgage materially affects net worth, home equity, and active payment planning. Institution/servicer requires Chris confirmation. | Needs Chris confirmation |
| Needs Chris confirmation | Vehicle loans | Liabilities | Vehicle loan | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if loan exists | Yes if loan exists | Yes if active | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Loan balance, payment due, interest rate, maturity if available, timestamps, connection health | Not tested | Unknown pending testing | Needs Chris confirmation | Manual liability update plus statement fallback if approved | High | Needs Chris confirmation | Unknown | High if active payments or material net-worth impact exist. | Needs Chris confirmation |
| Needs Chris confirmation | Personal loans or other debt | Liabilities | Personal loan / other debt | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if loan exists | Yes if loan exists | Yes if active | At least 24 months where available | No | No | No | No | Yes | Yes | Yes | Needs Chris confirmation | Loan balance, payment due, interest rate, maturity if available, timestamps, connection health | Not tested | Unknown pending testing | Needs Chris confirmation | Manual liability update plus statement fallback if approved | High | Needs Chris confirmation | Unknown | High if active payments or material net-worth impact exist. | Needs Chris confirmation |

### D. Investments

| Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Needs Chris confirmation | 401(k) | Investments | 401(k) | Chris | `401k` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history where practical | Yes | Yes | Yes if available | Yes | No | No | No | Needs Chris confirmation | Balances, holdings, investment transactions, contributions, employer contributions if available, cost basis if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual holdings/contribution import only if automated coverage fails | Critical | Institution not documented | Unknown | Critical because it is a main retirement account and contribution-tracking input. | Needs Chris confirmation |
| HealthEquity | HSA investment account | Investments | HSA investments | Chris | `hsa-investments` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available HSA history where practical | Yes | Yes | Yes if available | Yes | No | No | No | Unknown pending real provider testing | Balances, holdings, investment transactions, contributions, distributions, dividends, interest, cost basis if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import only if real provider testing proves automation insufficient | Critical | Unknown; requires real provider testing | Unknown | Critical because HSA investments affect net worth, healthcare planning, and contribution tracking. | Needs Chris confirmation |
| Needs Chris confirmation | Roth IRA | Investments | Roth IRA | Chris | `roth-ira` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history where practical | Yes | Yes | Yes if available | Yes | No | No | No | Needs Chris confirmation | Balances, holdings, investment transactions, contributions, cost basis if available, timestamps, connection health | Not tested | Unknown pending testing | Possibly | Manual holdings/contribution import only if automated coverage fails | High | Institution not documented | Unknown | High because it materially affects retirement planning and net worth. | Needs Chris confirmation |
| Needs Chris confirmation | Brokerage | Investments | Taxable brokerage | Chris | `brokerage` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available history where practical | Yes | Yes | Yes | No unless recurring contributions exist | No | No | No | Needs Chris confirmation | Balances, holdings, investment transactions, cost basis, dividends, interest, realized/unrealized gain inputs, timestamps, connection health | Not tested | Unknown pending testing | Possibly | Manual holdings/import fallback only if automated coverage fails | Critical | Institution not documented | Unknown | Critical because main brokerage is a required automatic-sync priority and portfolio analytics source. | Needs Chris confirmation |
| Needs Chris confirmation | Additional IRA, pension, retirement plan, or taxable investment accounts | Investments | Needs Chris confirmation | Chris | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Yes if account exists | Yes if account exists | Needs Chris confirmation | Full available history where practical | Yes if investment account exists | Yes if investment account exists | Yes if available | Needs Chris confirmation | No | No | No | Needs Chris confirmation | Needs Chris confirmation | Not tested | Unknown pending testing | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Needs Chris confirmation | Unknown | Placeholder row prevents silent omission of undocumented investment accounts. | Needs Chris confirmation |

### E. Health Savings Account

| Institution | Account display name | Account category | Account subtype | Ownership | Last four digits or safe identifier | Current connection method | Automatic sync required | Balance required | Balance timestamp required | Transactions required | Transaction history depth required | Holdings required | Investment transactions required | Cost basis required | Contribution tracking required | Liability details required | Interest rate required | Minimum payment required | Plaid coverage status | Plaid data types expected | Plaid test status | Secondary-provider test required | Manual fallback acceptable | Manual fallback method | Sync priority | Known connection issue | Reauthentication concern | Notes | Chris confirmation status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HealthEquity | HSA cash account | Health Savings Account | HSA cash | Chris | `hsa-cash` | Manual/mock dataset | Yes | Yes | Yes | Yes | Full available HSA history where practical | No | No | No | Yes | No | Possibly | No | Unknown pending real provider testing | HSA cash balance, contribution history, employer contributions, employee contributions, distributions, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import only if real provider testing proves automation insufficient | Critical | Unknown; requires real provider testing | Unknown | Critical because HSA cash affects complete net worth, healthcare planning, and contribution tracking. | Needs Chris confirmation |
| HealthEquity | HSA contribution data | Health Savings Account | HSA contributions | Chris | `hsa-contribution` | Manual/mock dataset | Yes | No | Yes | Yes | Full available HSA contribution history where practical | No | No | No | Yes | No | No | No | Unknown pending real provider testing | Employer contributions, employee contributions, contribution dates, tax year classification if available, timestamps, connection health | Not tested | Unknown pending testing | Emergency only | Manual HealthEquity export/import or payroll/statement entry if automated coverage fails | Critical | Unknown; requires real provider testing | Unknown | Critical because contribution tracking is an active priority. | Needs Chris confirmation |
| HealthEquity | HSA distributions | Health Savings Account | HSA distributions | Chris | `hsa-distributions` | Needs Chris confirmation | Yes if distributions exist | No | Yes | Yes | Full available HSA distribution history where practical | No | No | No | Yes | No | No | No | Unknown pending real provider testing | Distribution dates, amounts, categories if available, timestamps, connection health | Not tested | Unknown pending testing | Yes temporarily | Manual export/import or statement entry if low volume | High | Unknown; requires real provider testing | Unknown | High if distributions are relevant to healthcare spending and tax planning. | Needs Chris confirmation |

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

Known inventory as of the current project record:

- Total known institutions: 4 named institutions or provider-specific institutions plus confirmation-required institutions (`Chase`, `Huntington`, `Capital One`, `HealthEquity`); mortgage, 401(k), Roth IRA, brokerage, vehicle-loan, personal-loan, and any additional account institutions require Chris confirmation.
- Total known accounts: 10 known/planning rows from current repository evidence plus explicit confirmation placeholder rows. Known rows are Chase Checking, Huntington Savings, Capital One, Mortgage, 401(k), HSA investment account, Roth IRA, Brokerage, HSA cash account, and HSA contribution data. HSA distributions are included as a required conditional row if relevant.
- Accounts requiring automatic sync: All confirmed active account rows marked `Yes`; confirmation placeholders require Chris decision.
- Accounts needing balances: All financial account rows except HSA contribution/distribution tracking rows where balance is not applicable.
- Accounts needing transactions: Cash, credit, liabilities with payments, investments, HSA cash, HSA contributions, and HSA distributions where available.
- Accounts needing holdings: 401(k), HSA investment account, Roth IRA, Brokerage, and any additional investment accounts.
- Accounts needing contribution tracking: 401(k), HSA cash/contributions, Roth IRA, and any additional retirement/HSA accounts where applicable.
- Accounts needing liability details: Capital One, Mortgage, vehicle loans if any, personal loans or other debt if any, and additional credit/line-of-credit accounts if any.
- Accounts requiring Chris confirmation: Every row remains pending Chris confirmation because Task 179 cannot be complete until Chris confirms every actual account is represented.
- Accounts requiring real Plaid testing: Every active account for which automatic sync is required, with HealthEquity explicitly gated for real provider testing.
- Accounts potentially requiring a secondary provider: Unknown pending testing; no provider is selected by this document.
- Accounts where manual fallback is acceptable: Temporary or emergency fallback is documented by row; permanent fallback requires Chris confirmation.
- Accounts where manual fallback is not acceptable: None finally decided until Chris confirms; critical accounts are marked emergency-only where automation should remain the target.

Do not present these counts as final while account inventory is incomplete.
