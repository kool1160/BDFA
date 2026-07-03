# Backend Architecture

## 1. Executive Summary

BDFA is currently a static frontend app backed by in-memory JavaScript data and localStorage. Backend work should begin with planning, not implementation, so future auth/database work does not break the current static app, demo mode, Monthly Flow, Analytics, or source-data update contracts.

The recommended first backend direction is Supabase unless later research changes the strategy. Supabase is a strong Phase 1 fit because it provides:

- Auth
- Postgres
- user-owned rows
- row-level security
- a good relational fit for financial source data
- low complexity for a small project

This document is documentation-only. It does not add auth, database tables, APIs, dependencies, Supabase setup, Firebase setup, Plaid, Zillow, Kelley Blue Book, or any other external integration.

## 2. Current Architecture Summary

BDFA currently uses a static frontend architecture:

- `index.html`
- CSS files
- vanilla JavaScript files
- localStorage persistence
- no build step
- no backend
- no auth
- no database
- no external APIs

`js/app.js` currently owns the in-memory source data, CRUD paths, localStorage persistence, export/import flow, reset behavior, and the public source-data update seam. This makes backend readiness better than a scattered persistence model because persistence can later be moved behind a focused adapter instead of being replaced across unrelated files.

Current backend readiness findings:

1. localStorage access is centralized in `js/app.js`.
2. The current source-data seam is `window.BDFA.getSourceData()`.
3. Source-data changes dispatch `bdfa:source-data-updated`.
4. The app currently uses localStorage keys for source data and panel UI state.
5. Panel state is UI state and should likely remain local-only in Phase 1.
6. Source data should eventually move to backend storage for authenticated users.
7. Derived values should remain computed, not stored as database facts.
8. Supabase is the recommended Phase 1 backend unless later research disproves it.
9. A custom Node/Express backend is likely overkill for Phase 1.
10. Firebase is possible, but Supabase/Postgres better fits relational financial source data.

## 3. Source Data Inventory

BDFA's current data philosophy is:

- Source data is stored.
- Derived data is computed.

The current source-data collections should eventually become user-owned backend data for authenticated users:

| Collection | Current purpose | Backend direction |
|---|---|---|
| `accounts` | Cash, credit card, and debt balance records | Store as user-owned account rows. |
| `bills` | Recurring obligations | Store as user-owned bill rows. |
| `allocations` | Reserved funds and goals-like allocations | Store as user-owned allocation rows. |
| `investments` | Investment holdings summary records | Store as user-owned investment rows. |
| `recurringIncome` | Expected recurring income | Store as user-owned recurring income rows after clarifying pay timing. |
| `assets` | Manual assets such as homes, vehicles, equipment, and personal property | Store as user-owned asset rows. |

Likely future source-data collections include:

- users/profiles
- transactions
- liabilities
- goals
- preferences
- manualAdjustments

Future backend work should avoid treating derived outputs as source records. Derived outputs include net worth, home equity, vehicle equity, Monthly Flow projections, cash status, lowest projected cash, analytics totals, bill timelines, and remaining bills.

## 4. localStorage Inventory

The current localStorage usage should be treated conceptually as two categories: financial source data and local UI state.

| localStorage key | Category | Phase 1 direction |
|---|---|---|
| `bdfa.mockAccounts` | Source data | Eventually move to backend storage for authenticated users. |
| `bdfa.mockBills` | Source data | Eventually move to backend storage for authenticated users. |
| `bdfa.mockAllocations` | Source data | Eventually move to backend storage for authenticated users. |
| `bdfa.mockInvestments` | Source data | Eventually move to backend storage for authenticated users. |
| `bdfa.mockRecurringIncome` | Source data | Eventually move to backend storage for authenticated users. |
| `bdfa.mockAssets` | Source data | Eventually move to backend storage for authenticated users. |
| `bdfa.panelState` | UI state | Can remain local-only for Phase 1. |

The source-data keys should eventually move behind backend storage for signed-in users. `bdfa.panelState` is presentation state, not financial source data, and can remain local-only unless a future synced-preferences task explicitly changes that decision.

## 5. Backend Recommendation

Use Supabase for Phase 1 unless a later decision changes the backend strategy.

| Option | Strengths | Phase 1 concerns |
|---|---|---|
| Supabase | Built-in auth, Postgres database, row-level security, user-owned rows, good for relational financial data, works with a vanilla frontend, avoids building a custom server too early | Requires careful RLS setup before real user data is stored. |
| Firebase | Built-in auth and easy client SDK | Document database is less natural for relational financial source data and future reporting. |
| Custom Node/Express backend | Maximum control | Too much complexity for Phase 1; requires custom auth/session/security handling, more hosting and maintenance work, and makes accidental data leaks easier if ownership checks are missed. |

Supabase/Postgres matches the shape of BDFA's financial source data better than a document database because user-owned accounts, bills, allocations, assets, investments, and recurring income are naturally row-shaped records. A custom server can be revisited later if product needs outgrow Supabase, but Phase 1 should not start by owning avoidable backend infrastructure.

## 6. Draft Phase 1 Database Schema

This is a planning schema, not a migration. Each user-owned financial table should include `id`, `user_id`, `created_at`, `updated_at`, and `deleted_at` where useful. Monetary values should use decimal/numeric database types, not floating point.

Important schema notes:

- Use `user_id` on every user-owned financial table.
- Use decimal/numeric types for money in the database.
- Do not store derived values as source truth.
- Consider standardizing money fields as `amount` in the backend.
- Assets currently use `value` in the frontend, but the backend may standardize this as `amount` and map it at the adapter boundary.
- `recurringIncome.nextPayDay` is currently ambiguous and should be clarified before durable backend persistence.

### `profiles`

- `id` uuid primary key, references the auth user
- `display_name` text nullable
- `created_at` timestamp
- `updated_at` timestamp

### `accounts`

- `id` uuid primary key
- `user_id` uuid not null
- `name` text not null
- `type` text not null
- `amount` numeric not null
- `created_at` timestamp
- `updated_at` timestamp
- `deleted_at` timestamp nullable

### `bills`

- `id` uuid primary key
- `user_id` uuid not null
- `name` text not null
- `detail` text nullable
- `amount` numeric not null
- `frequency` text not null
- `due_day` smallint nullable
- `created_at` timestamp
- `updated_at` timestamp
- `deleted_at` timestamp nullable

### `recurring_income`

- `id` uuid primary key
- `user_id` uuid not null
- `name` text not null
- `amount` numeric not null
- `frequency` text not null
- `next_pay_date` date nullable
- `next_pay_day_of_month` smallint nullable
- `created_at` timestamp
- `updated_at` timestamp
- `deleted_at` timestamp nullable

`next_pay_date` and `next_pay_day_of_month` are a proposed replacement for the ambiguous frontend `nextPayDay` field. The preferred rule is that exactly one of these fields should be set for each recurring income row.

### `investments`

- `id` uuid primary key
- `user_id` uuid not null
- `name` text not null
- `detail` text nullable
- `amount` numeric not null
- `created_at` timestamp
- `updated_at` timestamp
- `deleted_at` timestamp nullable

### `assets`

- `id` uuid primary key
- `user_id` uuid not null
- `name` text not null
- `type` text not null
- `amount` numeric not null
- `notes` text nullable
- `created_at` timestamp
- `updated_at` timestamp
- `deleted_at` timestamp nullable

The frontend may continue using `value` for assets until a scoped adapter/runtime task maps that value to backend `amount`.

### `allocations`

- `id` uuid primary key
- `user_id` uuid not null
- `name` text not null
- `detail` text nullable
- `amount` numeric not null
- `target_amount` numeric nullable
- `created_at` timestamp
- `updated_at` timestamp
- `deleted_at` timestamp nullable

Possible future tables include:

- `liabilities`
- `transactions`
- `goals`
- `preferences`

These future tables should not be created until a scoped task defines their source-data meaning, ownership rules, and relationship to existing dashboard behavior.

## 7. Data Ownership and Security Rules

Financial data must be private by default.

Required security rules:

- users can only read their own rows
- users can only create their own rows
- users can only update their own rows
- users can only delete their own rows
- no public access to financial data
- row-level security should be required before real user data is stored

Frontend filtering is not security. A UI query that filters by the current user is useful for convenience, but backend/database rules must enforce ownership. Supabase row-level security policies should be enabled and tested before any real financial data is stored.

## 8. Backend Migration Plan

### Phase 0 — Architecture Document Only

- Create this document.
- No runtime backend code.
- No dependencies.
- No database.
- No auth.

### Phase 1 — Auth and Database Foundation

- Add Supabase project setup, auth, tables, and row-level security.
- Keep existing localStorage demo behavior working.
- Do not require all runtime data to move to the backend in the same step as auth setup.

### Phase 2 — Data Adapter Layer

- Add a data adapter layer that can read/write source data from either localStorage/demo mode or backend/authenticated mode.
- Avoid putting raw backend calls directly inside UI event handlers.
- Keep the adapter narrow and source-data focused.

### Phase 3 — Migrate Manual Source Data

Move manual source data to the backend for logged-in users:

- accounts
- bills
- recurring income
- investments
- assets
- allocations

Preserve these runtime contracts:

- `window.BDFA.getSourceData()`
- `bdfa:source-data-updated`

The event detail must remain the direct source snapshot.

Correct:

```text
event.detail
```

Incorrect:

```text
event.detail.sourceData
```

Do not recommend changing this contract unless there is a very strong documented reason.

### Phase 4 — Demo/Offline Fallback

- Decide whether localStorage remains as demo mode.
- Preserve import/export safety.
- Avoid losing user-entered local data when someone signs in.

### Phase 5 — Future Integrations

Only after auth/database/manual persistence are stable, consider:

- Plaid
- bank sync
- Zillow
- Redfin
- KBB
- VIN lookup
- property valuations
- vehicle valuations

Do not build these in early backend phases.

## 9. File Risk Map

High-risk runtime files:

| File | Risk |
|---|---|
| `js/app.js` | Owns current data, localStorage persistence, CRUD, import/export, reset behavior, dashboard totals, and source-data events. |
| `js/billDueDays.js` | Contains bill behavior that must not be casually broken during backend migration. |
| `js/monthly-flow-runtime.js` | Protected Monthly Flow logic; backend work must not alter Monthly Flow math unless explicitly scoped. |
| `js/analytics.js` | Protected Analytics logic; backend work must not alter Analytics math unless explicitly scoped. |
| `js/mobile-views.js` | Controls mobile navigation and should not be touched by backend planning. |

Backend-adjacent future files may include:

- a future data adapter file
- a possible future auth/session file
- a possible future Supabase client config file

Protected during this task:

- all HTML
- all CSS
- all JavaScript
- Monthly Flow
- Analytics
- mobile nav
- dashboard runtime logic

This task should create documentation only.

## 10. Derived Data Protection Rules

Do not permanently store these as source truth:

- net worth
- cash available
- cash status
- home equity
- vehicle equity
- Monthly Flow projections
- lowest projected cash
- remaining bills
- bill timelines
- analytics totals

Store the inputs. Compute the outputs.

Examples:

- Home equity should be computed from home asset value minus mortgage liability.
- Vehicle equity should be computed from vehicle asset value minus vehicle loan liability.
- Net worth should be computed from accounts plus investments plus assets minus liabilities/debt.

Derived data can be rendered, recalculated, or cached temporarily if a future performance task requires it, but it should not become permanent financial source truth.

## 11. Recommended Future Data Adapter Shape

A future data adapter should be documented and implemented in a separate scoped task. Do not implement it in this architecture document task.

Example future methods:

- `getSourceData`
- `saveAccount`
- `deleteAccount`
- `saveBill`
- `deleteBill`
- `saveRecurringIncome`
- `deleteRecurringIncome`
- `saveInvestment`
- `deleteInvestment`
- `saveAsset`
- `deleteAsset`
- `saveAllocation`
- `deleteAllocation`
- `importData`
- `exportData`

UI handlers should call the adapter instead of calling localStorage or Supabase directly. This keeps persistence decisions behind one layer and reduces the risk of mixing UI behavior with backend implementation details.

## 12. First Backend Code Phase Boundaries

The first backend code phase should not rewrite the whole app.

It should:

- add auth carefully
- add database schema carefully
- preserve localStorage demo mode
- preserve current runtime contracts
- avoid changing Monthly Flow and Analytics math

It should not bundle backend setup with unrelated UI rewrites, framework migrations, financial formula changes, or broad refactors.

## 13. Explicit Do-Not-Build-Yet List

- No Plaid
- No bank login
- No bank credential handling
- No Zillow
- No Redfin
- No Kelley Blue Book
- No VIN lookup
- No property lookup
- No vehicle lookup
- No scraping
- No API keys
- No backend implementation in this PR
- No auth implementation in this PR
- No database migrations in this PR
- No framework rewrite
- No React/Vue/Svelte migration
- No replacing the static app
- No changing Monthly Flow math
- No changing Analytics math
- No storing derived values as database source truth
- No AI financial advice
- No payment processing
- No multi-user household sharing
- No real-time collaboration

## 14. Open Questions

1. Should backend money fields standardize on `amount` even if some frontend records currently use `value`?
2. Should assets continue using `value` in the frontend and map to `amount` only at the adapter/database boundary?
3. Should liabilities stay represented as negative account rows in Phase 1, or become their own table later?
4. Should recurring income pay timing split into explicit fields before backend persistence?
5. Should localStorage demo mode remain permanently?
6. Should UI preferences like panel state ever sync across devices, or remain local-only?
