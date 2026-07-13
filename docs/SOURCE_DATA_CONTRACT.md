# BDFA Source Data Contract

## 1. Purpose

This document defines BDFA source-data shapes, naming conventions, ownership expectations, and derived-data boundaries.

The contract exists to protect future backend, adapter, import/export, and migration work from accidentally turning temporary frontend quirks into permanent database design. It should be used before adding persistence, adapters, imports, exports, migrations, or backend-owned financial records.

The complete normalized relational design is defined in
`docs/NORMALIZED_FINANCIAL_MODEL.md`. This document remains the compatibility
contract for the current frontend snapshot and event seams.

## 2. Core Rule

Source data is stored.

Derived data is computed.

Source data should represent user-owned financial facts. Derived data should be recalculated from source data whenever it is needed.

Store the inputs. Compute the outputs.

## 3. Runtime Source Snapshot Shape

The current public runtime source-data contract is:

```js
window.BDFA.getSourceData()
```

The returned source snapshot currently includes these collections:

- `accounts`
- `bills`
- `allocations`
- `investments`
- `recurringIncome`
- `assets`

Future backend work should preserve this public snapshot shape unless a separately scoped migration changes it.

Consumers should receive a complete source-data snapshot, not partial records. A consumer should be able to respond to the snapshot without requesting each collection separately.

## 4. Source Update Event Contract

The current source-data update event is:

```js
bdfa:source-data-updated
```

`event.detail` must be the direct source snapshot.

Correct:

```js
event.detail
```

Incorrect:

```js
event.detail.sourceData
```

Future adapter and backend work must preserve this event shape so Monthly Flow and other consumers can keep responding to source-data changes safely.

## 5. Money Field Naming

Current frontend reality:

- `accounts` use `amount`
- `bills` use `amount`
- `allocations` use `amount`
- `investments` use `amount`
- `recurringIncome` uses `amount`
- `assets` currently use `value`

Recommended backend direction:

- Backend and database money fields should standardize on `amount` where possible.
- Frontend assets may continue using `value` until a scoped adapter or runtime migration maps `value` to `amount`.
- Do not rename frontend runtime fields in this documentation task.

Any future field rename must be done in a scoped migration with import/export compatibility.

## 6. Accounts Contract

The `accounts` collection stores user-owned account records.

Minimum conceptual fields:

- `id`
- `name`
- `type`
- `amount`
- `detail`, if present

Accounts currently represent balances or debt-like records depending on `type`.

Known account type concepts include:

- `Cash`
- `Credit Card`
- `Debt`

Accounts are source data.

Account totals, cash totals, debt totals, and net worth contributions are derived from account records.

## 7. Bills Contract

The `bills` collection stores user-owned recurring or scheduled bill records.

Minimum conceptual fields:

- `id`
- `name`
- `detail`
- `amount`
- `frequency`
- `dueDay`, if present

Known frequency concepts may include:

- `monthly`
- `quarterly`
- `six-months`
- `yearly`

Bills are source data.

Monthly bill totals, remaining bills, bill timelines, due pressure, and Monthly Flow bill projections are derived from bills.

## 8. Allocations Contract

The `allocations` collection stores user-owned reserved-money or planned-allocation records.

Minimum conceptual fields:

- `id`
- `name`
- `detail`
- `amount`
- `targetAmount`, if present

Allocations are source data.

Allocation progress, available-to-allocate, and allocation analytics are derived from allocation records and related source data.

## 9. Investments Contract

The `investments` collection stores user-owned investment records.

Minimum conceptual fields:

- `id`
- `name`
- `detail`
- `amount`

Investments are source data.

Investment totals and investment analytics are derived from investment records.

## 10. Recurring Income Contract

The `recurringIncome` collection stores user-owned recurring income records.

Minimum conceptual fields:

- `id`
- `name`
- `amount`
- `frequency`
- `nextPayDay` or the current frontend pay-timing field

Known frequency concepts may include:

- `weekly`
- `biweekly`
- `semimonthly`
- `monthly`

Known issue:

`recurringIncome.nextPayDay` is currently ambiguous and should be clarified before durable backend persistence.

Recommended future backend direction:

- Split pay timing into explicit fields such as `next_pay_date` and `next_pay_day_of_month`.
- Or use a typed discriminator field.
- Do not permanently store ambiguous pay timing in the backend without a scoped migration decision.

Recurring income is source data.

Income timelines, upcoming income, and Monthly Flow income projections are derived from recurring income records.

## 11. Assets Contract

The `assets` collection stores user-owned asset records.

Minimum conceptual fields:

- `id`
- `name`
- `type`
- `value`
- `notes`

Known asset types should include:

- `Home`
- `Vehicle`
- `Equipment`
- `Personal Property`
- `Other`

Assets are source data.

Assets currently use `value` in the frontend. The backend may map this to `amount` later, but that mapping should happen through a scoped adapter or migration task.

Asset totals, home equity, vehicle equity, and net worth contributions are derived from asset records and related debt or liability records.

## 12. Future Liabilities Contract

`liabilities` may become a future source-data collection.

Current debt may be represented through account records. Future liabilities may support fields such as:

- `id`
- `name`
- `type`
- `amount`
- `linkedAssetId`
- `interestRate`
- `term`
- `paymentAmount`
- `notes`

This table is not required yet.

Liabilities should only be added when a scoped task defines how they interact with accounts, debts, assets, and net worth.

## 13. Derived Data Boundary

These values should not be stored as source truth:

- net worth
- cash available
- cash status
- home equity
- vehicle equity
- total assets
- total debts
- available-to-allocate
- Monthly Flow projections
- lowest projected cash
- remaining bills
- upcoming bills
- upcoming income
- analytics totals
- allocation progress
- bill timing pressure

Store the inputs.

Compute the outputs.

Examples:

- Home equity should be computed from home asset value minus related mortgage debt.
- Vehicle equity should be computed from vehicle asset value minus related vehicle loan debt.
- Net worth should be computed from accounts plus investments plus assets minus liabilities or debt.

## 14. Import Export Compatibility

Source-data shape changes must preserve import/export safety.

Future migrations should:

- remain backward-compatible where possible
- safely default missing optional collections
- avoid breaking older exported JSON
- avoid silently deleting user-entered data
- include explicit migration notes when field names change

## 15. Backend Adapter Expectations

Future backend work should use a data adapter layer rather than scattering backend calls through UI handlers.

Future adapter concepts may include:

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

The adapter should preserve the current snapshot and event contracts.

## 16. Do-Not-Change-In-This-Task

This documentation task must not change:

- HTML
- CSS
- JavaScript
- localStorage behavior
- import/export behavior
- reset behavior
- Monthly Flow
- Analytics
- mobile navigation
- dashboard calculations
- source-data event dispatching
- backend/auth/database setup

## 17. Open Questions

1. Should the backend standardize all money fields as `amount`?
2. Should frontend assets continue using `value` while backend stores `amount`?
3. Should liabilities remain represented as Debt accounts in Phase 1?
4. Should a separate liabilities collection be introduced later?
5. How should `recurringIncome.nextPayDay` be migrated into explicit backend fields?
6. Should linked assets and linked liabilities be supported later for equity summaries?
7. Should panel UI state remain local-only or eventually become synced preferences?
