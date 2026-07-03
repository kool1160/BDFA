# BDFA Aggregation Strategy

## 1. Core Principle

BDFA is multi-aggregator by design.

Provider data is imported into BDFA. No individual provider is the application source of truth. Plaid, Yodlee, MX, Finicity, and future providers are import pipes. BDFA owns the normalized financial model.

The normalized BDFA source-data model is the source of truth for accounts, balances, liabilities, cash availability, investments, income signals, planning inputs, analytics, and future connected financial data.

## 2. Why Single-Provider Apps Fail

Single-provider finance apps fail when the provider cannot reliably cover every institution and account type a person uses.

In practice, a user may have:

- a checking account that connects well through Plaid
- an HSA that works through Plaid but not another provider
- a 401k that only works well through Yodlee
- a mortgage that is more reliable through MX
- a brokerage account that is better supported through Finicity / Mastercard Open Banking
- payroll or income data that requires a different product than bank aggregation
- a house value, private asset, or unsupported account that must be entered manually

Investments, HSAs, retirement accounts, mortgages, loan servicers, payroll providers, and smaller financial institutions often have uneven provider support. If BDFA depended on one aggregator, users would get an incomplete financial picture and could make decisions from missing or stale data.

BDFA should make the user whole by supporting a mixed-provider financial picture over time.

## 3. Target Provider Set

BDFA should treat the following as likely first-class provider families over time:

- Plaid
- Yodlee
- MX
- Finicity / Mastercard Open Banking
- Manual or CSV fallback
- Future direct APIs where appropriate

No provider connection is implemented by this document. This strategy defines the intended direction and guardrails only.

## 4. Provider Adapter Model

Each provider should eventually have its own adapter layer. Example adapters may include:

- `plaid-adapter`
- `yodlee-adapter`
- `mx-adapter`
- `finicity-adapter`
- `csv-adapter`
- `manual-adapter`

Each adapter should be responsible for:

- connecting to the provider through the appropriate secure flow
- fetching raw provider data
- mapping provider-specific data into BDFA's normalized source-data model
- reporting sync status and errors
- isolating provider-specific data shapes from the rest of the app
- never leaking provider-specific payload shape into the UI

Provider adapters should be import boundaries, not product model boundaries. Once data crosses the adapter boundary, BDFA should work with its own normalized model.

## 5. Normalized Source Data Rule

The UI, Monthly Flow, Analytics, and Planning Engine should read normalized BDFA source data, not provider-specific payloads.

Provider-specific fields should be isolated to provider metadata. The core app should reason about account meaning, balances, inclusion rules, and planning behavior using BDFA-owned fields.

Normalized account fields may include:

- `id`
- `name`
- `institutionName`
- `accountType`
- `accountSubtype`
- `balance`
- `currency`
- `providerName`
- `providerAccountId`
- `providerConnectionId`
- `lastSyncedAt`
- `syncStatus`
- `includeInNetWorth`
- `includeInAvailableCash`
- `confidence`
- `notes`

Provider-specific fields must not become required UI contracts. If a provider-specific value is useful, it should be mapped into a normalized BDFA field or stored as provider metadata.

## 6. Provider Metadata

Provider-specific identifiers and sync details should be tracked separately from core financial meaning.

Provider metadata may include:

- provider name
- provider item id
- provider account id
- institution id
- connection status
- last successful sync
- last sync error
- token reference, not a raw token in frontend code
- source priority

Provider metadata exists to support sync, reconciliation, troubleshooting, deduplication, and source selection. It should not replace the normalized BDFA financial model.

Raw secrets, access tokens, refresh tokens, credentials, and other sensitive provider secrets must not be stored in frontend JavaScript.

## 7. Supabase Role

Supabase is the likely future private data vault for normalized BDFA source data and provider connection metadata.

Current status:

- Supabase is not wired yet.
- Supabase should store normalized BDFA data, not random provider payloads as the main app model.
- Provider secrets and tokens must not be exposed in frontend JavaScript.
- Future provider sync likely belongs in backend or serverless functions, such as Supabase Edge Functions or another secure server layer.

Supabase should support BDFA's model ownership. It should not cause the app to treat any provider's raw response as the canonical product data shape.

## 8. Account-Level Provider Choice

BDFA should eventually allow different accounts to use different providers.

Example mixed-provider financial picture:

- checking account via Plaid
- HSA via Plaid
- 401k via Yodlee
- mortgage via MX
- brokerage via Finicity
- house value manually estimated

The account is the product-level unit of truth. Provider selection should be flexible enough to pick the best available source per account rather than forcing every account through one aggregator.

## 9. Duplicate Detection

BDFA must eventually detect and prevent duplicate accounts when the same real-world account appears from more than one provider.

Possible matching signals include:

- institution name
- account name
- account mask
- account type
- similar balance
- provider metadata
- user confirmation

Duplicate detection must prevent double-counting net worth, cash, debts, investments, income, and analytics. When BDFA is uncertain, it should prefer user confirmation over silent merging.

## 10. Source Priority

Each account should eventually support a preferred source.

Examples:

- Plaid is trusted for checking
- Yodlee is trusted for 401k
- manual estimate is trusted for house value
- CSV fallback is trusted for an unsupported account

Source priority should be account-specific. A provider can be the best source for one account and the wrong source for another.

## 11. Income and Payroll Strategy

Payroll and income connections may require different providers or products than bank aggregation.

BDFA should support multiple income detection strategies over time:

- direct deposit detection from bank transactions
- recurring income rules
- payroll provider connectors if available
- paystub import
- manual fallback

No payroll integration is implemented by this document. Income strategy should follow the same normalized-source-data rule as accounts: provider details are imported and normalized before they affect Monthly Flow, Analytics, or planning behavior.

## 12. Implementation Phases

### Phase 1: Local adapter seam and source-data contract

- Define a local adapter seam.
- Define the source-data contract.
- Continue using localStorage persistence.
- Do not connect to external providers yet.

### Phase 2: Supabase normalized data schema

- Define a Supabase schema for normalized BDFA data.
- Store normalized accounts, balances, transactions, and provider metadata.
- Do not implement provider sync yet.

### Phase 3: First provider sandbox

- Add the first provider sandbox, likely Plaid.
- Use backend or serverless token exchange.
- Connect one account type first.
- Keep provider payloads behind the adapter boundary.

### Phase 4: Second provider adapter

- Add a second provider adapter, such as Yodlee, MX, or Finicity.
- Support provider selection per account.
- Preserve the same normalized BDFA model for both providers.

### Phase 5: Duplicate detection and source priority

- Add duplicate detection.
- Add source priority.
- Add sync health UI.
- Prevent double-counting across net worth, cash, debts, investments, and analytics.

### Phase 6: Scheduled sync and normalized analytics

- Add scheduled sync.
- Power analytics from normalized connected data.
- Keep provider-specific sync concerns isolated from product calculations and UI.

## 13. Explicit Non-Goals For Now

The following are not part of the current implementation:

- no provider code yet
- no Plaid Link yet
- no Yodlee integration yet
- no MX integration yet
- no Finicity integration yet
- no Supabase wiring yet
- no auth yet
- no token storage yet
- no scheduled sync yet
- no UI changes yet

This document is an architecture guardrail and planning artifact only. It does not change runtime behavior.
