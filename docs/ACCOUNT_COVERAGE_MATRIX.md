# BDFA Account Coverage Matrix

**Status:** Prepared for owner confirmation

This is a private planning record for the one approved BDFA owner. It contains no
account numbers, masks, balances, credentials, tokens, or other personal account
identifiers. The repository does not yet contain a confirmed institution inventory,
so institution-level provider coverage is intentionally marked as unverified.

## Coverage matrix

| Account or asset group | Institution | Data required | Plaid support result | Secondary-provider need | Desired refresh | Fallback if no reliable connection |
| --- | --- | --- | --- | --- | --- | --- |
| Primary checking and savings | Owner confirmation required | Balance, balance history, transactions, institution, account metadata | Verify per institution in Plaid Sandbox and the official institution directory; no live test performed | Only if Plaid cannot reliably provide required account or transaction data | Login/open refresh where supported; scheduled daily sync | CSV/OFX import, then manual balance entry |
| Credit card account(s) | Owner confirmation required | Current balance, available credit where available, transactions, payment activity | Verify per institution; no live test performed | Only for an institution or data field Plaid cannot reliably cover | Daily; refresh before cash-planning review where supported | Statement/CSV import, then manual balance entry |
| Mortgage and other loans | Owner confirmation required | Current liability balance, minimum payment, transactions or payment activity, rate and maturity when available | Verify loan-servicer support and liability fields; no live test performed | Needed if the servicer or required liability fields are missing | Daily or weekly depending on provider freshness | Servicer statement import/manual balance and payment terms |
| Brokerage account(s) | Owner confirmation required | Balance, holdings, prices, transactions, investment activity, contributions, gains | Verify investment coverage, holdings freshness, and investment-transaction support; no live test performed | Needed if holdings or investment activity are incomplete | Daily; show provider source timestamp | Brokerage export/import; manual holdings only as a last resort |
| Employer 401(k) and other retirement accounts | Owner confirmation required | Balance, holdings, contributions, employer contributions, investment activity | Verify retirement-account and contribution support; no live test performed | Likely if the plan recordkeeper is unsupported or omits contributions | Daily or weekly based on provider freshness | Recordkeeper export and manual contribution updates |
| HSA | **HealthEquity — required test case** | Cash balance, invested balance, holdings, transactions, contributions, distributions | Must be tested explicitly; do not assume Plaid coverage for HealthEquity | Required if Plaid is unsupported or omits HSA investment/contribution data; choose only after the gap is proven | Daily or weekly based on provider freshness | HealthEquity export/statement import plus manual values |
| Home, vehicles, and other manual assets | Owner confirmation required | Current value, valuation date, notes, related liability reference | Not applicable; these are not provider-connected accounts | Not applicable | Monthly or when the value materially changes | Manual valuation with dated source note |

## Owner confirmation checklist

Before provider selection or live connection work begins, confirm one row for each
real account or asset:

- Institution and account type
- Whether BDFA needs balances, transactions, liabilities, holdings, investment activity, and/or contributions
- Desired freshness and acceptable stale-data window
- Whether the account is active, closed, or intentionally excluded
- Preferred fallback export or manual-entry method

Do not put account numbers, masks, login details, credentials, access tokens, or
production provider identifiers in this repository. Provider support must be tested
with sandbox data first and recorded as evidence rather than inferred from a generic
institution list.

## Current decision gates

- **Plaid:** No institution-level coverage is approved yet. Milestone 6 should test the confirmed institutions in Sandbox before any live connection.
- **HealthEquity:** Required test case. Treat coverage as unknown until tested; do not select a secondary provider in advance.
- **Secondary provider:** Select only from gaps demonstrated by the Plaid tests and normalize the result into BDFA’s provider-independent model.
- **Live credentials:** None are needed for this matrix. Do not handle production credentials during this milestone.
