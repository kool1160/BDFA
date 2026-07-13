# BDFA Normalized Financial Model

## 1. Purpose and status

This document defines the provider-independent source-data model for BDFA. It
is the contract between future provider adapters, manual/import adapters, the
backend persistence layer, and the frontend unified model.

This is an architecture design, not an executable migration. It does not
connect a provider, create tables, change authentication or RLS, or replace
the current local/cloud snapshot runtime.

The product model belongs to BDFA. Plaid, a future secondary provider, CSV,
and manual entry are input channels only. Provider payloads must be normalized
before they are consumed by Monthly Flow, Analytics, Planning, or any other
financial output.

## 2. Design rules

1. Every financial row is owned by the approved user through `user_id`.
2. Source facts are stored; derived values are computed.
3. Every externally sourced fact carries source and observation metadata.
4. Provider identifiers remain in provider-link records or metadata, not in
   the product's required UI contract.
5. Historical observations are append-oriented. A new balance or valuation
   does not overwrite the prior observation.
6. Idempotency and reconciliation are required before a sync is considered
   successful. A provider retry must not duplicate a transaction or holding.
7. Unknown, stale, partial, and conflicting data must remain visible to the
   sync/quality layer rather than being silently treated as current truth.
8. The current complete source snapshot remains a recovery and portability
   artifact while normalized syncing is proven.

## 3. Ownership and common metadata

All normalized tables that contain financial data use these common concepts:

| Field | Meaning |
| --- | --- |
| `id` | BDFA-generated stable UUID or equivalent opaque identifier. |
| `user_id` | Authenticated owner boundary; never inferred from browser input. |
| `created_at` | BDFA record creation timestamp. |
| `updated_at` | BDFA record metadata update timestamp. |
| `source_kind` | `provider`, `manual`, `import`, or `system`. |
| `source_connection_id` | Nullable link to the connection that supplied the fact. |
| `source_record_id` | Nullable provider/import record identifier for reconciliation. |
| `observed_at` | When the source reported or the user entered the fact. |
| `effective_at` | When the fact applies financially, when different from observation time. |
| `metadata` | Non-authoritative, provider-specific or audit-safe JSON metadata. |

`user_id` is an authorization field, not a user-editable financial field.
Future policies must enforce the approved-owner rule from the security design
in `docs/APPROVED_USER_SCHEMA_SECURITY_DESIGN.md`.

Money values should use a database exact numeric representation with an
explicit ISO currency code. The frontend adapter may continue translating its
current number-based fields until a separately scoped persistence migration.

## 4. Canonical records

The following records are the normalized source of truth. Names are logical
table/record names; implementation may use a reviewed naming convention.

### 4.1 Institutions

`institutions` identifies a financial institution without making a provider
the institution's identity.

- `id`, `user_id`
- `name`, optional `legal_name`
- `institution_type` (bank, brokerage, employer, lender, HSA, other)
- optional normalized `website` and safe display metadata
- common metadata

Provider institution IDs belong in `financial_connection` metadata or a
provider-link record, because the same institution can appear through more
than one provider.

### 4.2 Financial connections

`financial_connections` represents one provider authorization/link, not one
account.

- `id`, `user_id`, `institution_id`
- `provider_name`, `provider_connection_id` (unique per provider/user)
- `status` (active, stale, reauthentication_required, error, disconnected)
- `last_attempted_at`, `last_successful_at`, `provider_data_as_of`
- `error_code`, safe `error_message`, `requires_reauthentication`
- token reference only; never a raw access token in browser code, snapshots,
  logs, or normal source records
- common metadata

One connection may supply many accounts. An account may have multiple source
links when duplicate detection or source priority requires it.

### 4.3 Accounts and provider account links

`accounts` is the product-level record for a cash, credit, loan, brokerage,
retirement, HSA, or other financial account.

- `id`, `user_id`, `institution_id`
- `name`, `account_type`, `account_subtype`
- `currency`, `status`
- `include_in_net_worth`, `include_in_available_cash`
- `is_manual`, optional safe `mask`
- source priority and reconciliation state
- common metadata

`account_sources` links an account to one or more connections:

- `account_id`, `financial_connection_id`
- provider account identifier and safe display mask
- `is_preferred_source`, `last_seen_at`, `link_status`
- source-specific metadata

The normalized account is the deduplication unit. A provider account must not
become a second BDFA account without a reconciliation decision.

### 4.4 Balances and balance history

`account_balances` is append-oriented history, not a mutable balance column on
the account:

- `account_id`, `available_amount`, `current_amount`, `limit_amount`
- `currency`, `balance_type`
- `as_of`, `observed_at`, `source_connection_id`, `source_record_id`
- reconciliation and quality metadata

The latest usable observation may be selected for display, but historical rows
remain available for net-worth history and audit. Credit limits and available
credit are not interchangeable with current debt balances.

### 4.5 Transactions

`transactions` stores account activity as reported or entered.

- `account_id`, `transaction_date`, optional `posted_date`
- `name`, optional `merchant_name`, `amount`, `currency`
- normalized `direction` and `transaction_type`
- `category`, `subcategory`, `pending`, `status`
- `provider_transaction_id` via source metadata/linkage
- `transfer_group_id` for reviewed internal transfers
- common metadata

The provider identity plus connection/account scope is the idempotency key.
Pending-to-posted updates must reconcile to one logical transaction. Transfers
must remain traceable so cash-flow views do not count both sides as income or
spending.

### 4.6 Holdings and investment transactions

`holdings` stores position observations for an investment account:

- `account_id`, `security_id` or normalized security reference
- `quantity`, `price`, `market_value`, `currency`
- `as_of`, `observed_at`, source identifiers
- cost-basis availability and quality metadata

`investment_transactions` stores activity that explains position changes:

- `account_id`, security reference, transaction date and type
- `quantity`, `price`, `amount`, `currency`
- normalized types such as buy, sell, dividend, interest, contribution,
  withdrawal, fee, transfer, split, and adjustment
- common metadata and provider identity

Holdings are not a replacement for investment transactions. Allocation,
contributions, gains, dividends, and realized/unrealized results must be
computed only when the required source coverage and methodology are verified.

### 4.7 Liabilities

`liabilities` represents obligations independently from the account that may
report them.

- `id`, `user_id`, `institution_id`, optional `linked_asset_id`
- `name`, `liability_type`, `currency`
- `principal_amount`, optional `interest_rate`, `payment_amount`, `due_day`
- term/origination/maturity fields when known
- `status`, `include_in_net_worth`
- common metadata

`liability_observations` stores dated balance, rate, payment, and delinquency
observations. A mortgage or loan may be linked to an account source while the
liability remains the normalized obligation used for debt and equity views.

### 4.8 Recurring items

Use one normalized `recurring_items` record family with an explicit
`direction` (`income` or `expense`) rather than relying on ambiguous frontend
names.

- `id`, `user_id`, optional `account_id`
- `name`, `direction`, `amount`, `currency`
- explicit `frequency`, `next_occurrence_date`, optional day-of-month
- `active`, `category`, `confidence`, optional `source_transaction_rule`
- common metadata

This resolves the current `nextPayDay` ambiguity. The existing frontend
`bills` and `recurringIncome` collections remain compatible through an adapter.

### 4.9 Manual assets and valuations

`manual_assets` stores homes, vehicles, equipment, and personal property that
do not require a provider connection.

- `id`, `user_id`, `name`, `asset_type`, `currency`
- `include_in_net_worth`, optional `linked_liability_id`
- notes and common metadata

`asset_valuations` stores dated user-entered or imported values:

- `asset_id`, `amount`, `as_of`, `valuation_method`
- `source_kind`, optional source reference, confidence, notes
- common metadata

The latest accepted valuation is selected by the derived layer. Asset value is
not overwritten in place, preserving an auditable history.

### 4.10 Sync runs and connection events

`sync_runs` records each attempted synchronization:

- `financial_connection_id`, started/completed timestamps
- `status` (running, succeeded, partial, failed, cancelled)
- requested scopes and counts by record type
- provider cursor/checkpoint reference, safe error details
- common metadata

`connection_events` records state transitions such as connected, refreshed,
partial data, reauthentication required, error, and disconnected. Events are
append-only and should not contain credentials or raw provider payloads.

## 5. Source snapshots and audit metadata

The existing `bdfa_source_snapshots` mechanism remains a complete portable
source snapshot and recovery fallback. It is not the normalized relational
source of truth once normalized syncing is proven, and it must not be removed
as part of this milestone.

Each snapshot should retain, where already supported or later added by a
scoped migration:

- owner boundary and snapshot identifier
- schema version
- captured-at and source-data-updated timestamps
- complete current source collections
- origin (`local`, `manual`, `import`, or normalized export)
- safe audit metadata and validation status

Snapshots must not contain provider access tokens, passwords, private
credentials, or unnecessary raw provider payloads. A normalized export should
be reconstructible from source records and clearly marked as an export rather
than mistaken for a live sync.

## 6. Derived-data boundary

Do not persist these as authoritative source facts: net worth, cash available,
home equity, investment allocation, gains, contribution totals, Monthly Flow
projections, bill timing pressure, forecasts, or health signals. Compute them
from normalized records, selecting observations with explicit freshness and
quality rules. If a derived result is cached later, it must include its input
version/timestamps and remain disposable.

## 7. Adapter and migration sequence

The safe implementation order after this design is:

1. Review this contract against Chris's confirmed institution coverage.
2. Define local normalization fixtures with synthetic data only.
3. Add a versioned, non-live schema/migration artifact and validator tests.
4. Build manual/import normalization first, preserving the current snapshot
   adapter and `bdfa:source-data-updated` event contract.
5. Add provider adapters in sandbox, with idempotency and reconciliation tests.
6. Implement backend persistence and RLS only through a separately approved
   live security/database milestone.
7. Migrate or dual-read source data only after representative recovery,
   duplicate, stale-data, and rollback tests pass.

No provider is selected by this model. Provider choice remains blocked on the
coverage evidence and sandbox testing described in Milestones 3 and 6.

## 8. Explicit non-goals

This milestone does not change the frontend source shape, add tables, execute a
Supabase migration, alter RLS or authentication, add provider credentials,
implement sync, or change financial calculations.
