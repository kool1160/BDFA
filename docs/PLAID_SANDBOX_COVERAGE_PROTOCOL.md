# Plaid Sandbox Coverage Protocol

**Milestone:** 6 — Prove Plaid coverage  
**Status:** Prepared; execution blocked at the approved sandbox/backend boundary

This protocol defines the evidence required to evaluate Plaid without putting
production credentials, personal identifiers, or provider payloads in the
repository. It is intentionally provider-adapter and runtime neutral until the
server boundary and secret-management approach are approved.

## Preconditions

Before executing a Plaid Sandbox test, obtain explicit approval for:

1. the server or serverless runtime that will call Plaid;
2. the secret-management and local credential-loading approach;
3. the test operator and non-production Plaid Sandbox credentials; and
4. the confirmed institution and account-type inventory.

The browser must receive only a short-lived Link token where Plaid permits it.
The server must perform token exchange and all data retrieval. No Sandbox
secret, access token, raw provider response, account number, or personal
identifier may be committed, logged, or returned to browser code.

## Required coverage cases

Run each confirmed institution through the applicable cases below. HealthEquity
is mandatory even if it is expected to be unsupported.

| Data class | Required evidence | Result values |
| --- | --- | --- |
| Accounts and balances | Account types, balance fields, currency, source timestamp, refresh result | `pass`, `partial`, `fail`, `unsupported` |
| Transactions | Posted and pending records, stable identifiers, pagination/cursor behavior, retry deduplication | `pass`, `partial`, `fail`, `unsupported` |
| Liabilities | Current balance, minimum payment, rate/maturity when available, freshness | `pass`, `partial`, `fail`, `unsupported` |
| Holdings | Positions, quantities, prices, market values, source timestamp | `pass`, `partial`, `fail`, `unsupported` |
| Investment activity | Contributions, buys/sells, dividends/interest, stable identifiers | `pass`, `partial`, `fail`, `unsupported` |
| Refresh and health | Manual refresh, scheduled-refresh suitability, stale state, provider error state | `pass`, `partial`, `fail`, `unsupported` |
| Reauthentication | Sandbox reauth/error path and safe user-visible state | `pass`, `fail`, `not-tested` |

## Redacted evidence record

Copy this record for each institution without adding institution names, account
masks, IDs, balances, descriptions, credentials, or raw responses. Use a stable
local label such as `institution-a`.

```text
label: institution-a
account_types: checking, savings, credit-card, loan, brokerage, retirement, hsa
test_date_utc: YYYY-MM-DD
plaid_environment: sandbox

accounts_balances: pass|partial|fail|unsupported
transactions: pass|partial|fail|unsupported
liabilities: pass|partial|fail|unsupported
holdings: pass|partial|fail|unsupported
investment_activity: pass|partial|fail|unsupported
refresh_health: pass|partial|fail|unsupported
reauthentication: pass|fail|not-tested

missing_data_classes: none|<class labels only>
stale_or_error_states_observed: yes|no
retry_deduplication_verified: yes|no|not-applicable
normalized_contract_verified: yes|no
fallback_required: yes|no
safe_notes: <no provider payloads or personal identifiers>
```

## Decision rule

Plaid coverage is approved only per institution and data class. A `partial` or
`unsupported` result must identify the missing normalized data class and define
a fallback. Do not choose a secondary provider until the gap is evidenced. Do
not connect real institutions or deploy provider code as part of this record.

## Current execution result

No Sandbox test was run. The repository has no approved backend runtime, Plaid
Sandbox credentials, or confirmed institution inventory. HealthEquity therefore
remains unverified, and no provider coverage decision is made by this document.
