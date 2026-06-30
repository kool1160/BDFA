/**
 * BDFA Unified Financial Model
 *
 * This module defines the canonical shape every future BDFA engine should consume.
 * It is intentionally a skeleton only: no real financial data, no mock data,
 * no calculations, no DOM access, and no application wiring.
 *
 * The Unified Financial Model should become the single source of truth for
 * financial source data. Planning, forecasting, analytics, and decision systems
 * should consume this shared model rather than building screen-specific data
 * shapes.
 */

/**
 * Source Data vs Derived Data
 *
 * Source Data is stored because it represents user-entered or provider-synced
 * financial facts. Examples include accounts, transactions, recurring income,
 * recurring bills, investments, goals, allocations, assets, liabilities, and
 * preferences.
 *
 * Derived Data is computed from source data and should not be permanently stored
 * when it can be recomputed. Examples include available cash, safe to spend,
 * safe to invest, monthly cash flow, running balances, forecasts, goal progress,
 * net worth, spending trends, and financial health signals.
 */

/**
 * Placeholder Unified Financial Model shape.
 *
 * Each section is intentionally empty and exists only to establish the shared
 * architecture for future engine work.
 */
export const UnifiedFinancialModel = {
  accounts: [],
  transactions: [],
  recurringIncome: [],
  recurringBills: [],
  investments: [],
  assets: [],
  liabilities: [],
  goals: [],
  allocations: [],
  userPreferences: {},
  metadata: {},
};

/**
 * Placeholder section names for documentation and future validation work.
 *
 * These names are not used by the application yet and should not be treated as
 * implemented validation logic.
 */
export const UnifiedFinancialModelSections = Object.freeze([
  'Accounts',
  'Transactions',
  'Recurring Income',
  'Recurring Bills',
  'Investments',
  'Assets',
  'Liabilities',
  'Goals',
  'Allocations',
  'User Preferences',
  'Metadata',
]);
