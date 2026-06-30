/**
 * BDFA Planning Engine Foundation
 *
 * This module is the home for BDFA's reusable planning architecture.
 *
 * Current implementation scope:
 * - Deterministic Planning Engine calculations only.
 * - No mock data.
 * - No DOM access.
 * - No application wiring.
 */

/**
 * Planning Engine
 *
 * Responsibility:
 * Build a normalized planning state from source financial data and produce
 * planning outputs that downstream Forecast and Decision engines can consume.
 */
export const PlanningEngine = {
  buildPlanningState,
  calculateAvailableCash,
  calculateRunningBalance,
  calculateMonthlyCashFlow,
  calculatePlanningSummary,
};

/**
 * Forecast Engine
 *
 * Planned responsibility:
 * Project future balances and cash timing from a planning state.
 */
export const ForecastEngine = {
  forecastBalances,
};

/**
 * Decision Engine
 *
 * Planned responsibility:
 * Convert planning and forecast outputs into user-facing guidance.
 */
export const DecisionEngine = {
  calculateSafeToSpend,
  calculateSafeToInvest,
};

/**
 * Build the normalized planning state from source financial data.
 *
 * @param {object} sourceData - Future source financial data input.
 * @returns {undefined} Placeholder only.
 */
export function buildPlanningState(sourceData) {
  void sourceData;
}

/**
 * Calculate available cash from the Unified Financial Model.
 *
 * Current Phase 2 scope:
 * - Sum all account balances.
 * - Subtract all recurring bill amounts.
 * - Ignore investments, goals, forecasting, and allocations for now.
 *
 * @param {object} financialModel - Unified Financial Model input.
 * @returns {number} Available cash amount.
 */
export function calculateAvailableCash(financialModel = {}) {
  const accountTotal = sumAmounts(financialModel.accounts, 'balance');
  const recurringBillsTotal = sumAmounts(financialModel.recurringBills, 'amount');

  return accountTotal - recurringBillsTotal;
}

/**
 * Calculate the running balance after applying recurring monthly inflows and
 * outflows to a starting balance.
 *
 * Current scope:
 * - Begin with the supplied starting balance.
 * - Add recurring income amounts normalized to monthly equivalents.
 * - Subtract recurring bill amounts normalized to monthly equivalents.
 * - Treat missing collections as empty arrays.
 *
 * @param {object} financialModel - Unified Financial Model input.
 * @param {number} startingBalance - Starting balance before recurring activity.
 * @returns {number} Running balance amount.
 */
export function calculateRunningBalance(financialModel = {}, startingBalance = 0) {
  const normalizedStartingBalance = Number.isFinite(startingBalance)
    ? startingBalance
    : 0;

  return normalizedStartingBalance + calculateMonthlyCashFlow(financialModel);
}

/**
 * Calculate monthly cash flow from recurring monthly inflows and outflows.
 *
 * Current scope:
 * - Add recurring income amounts normalized to monthly equivalents.
 * - Subtract recurring bill amounts normalized to monthly equivalents.
 * - Treat missing collections as empty arrays.
 *
 * @param {object} financialModel - Unified Financial Model input.
 * @returns {number} Monthly cash flow amount.
 */
export function calculateMonthlyCashFlow(financialModel = {}) {
  const recurringIncomeTotal = sumMonthlyAmounts(financialModel.recurringIncome);
  const recurringBillsTotal = sumMonthlyAmounts(financialModel.recurringBills);

  return recurringIncomeTotal - recurringBillsTotal;
}

/**
 * Calculate the reusable Planning Engine summary from the Unified Financial
 * Model.
 *
 * @param {object} financialModel - Unified Financial Model input.
 * @returns {object} Planning summary outputs.
 */
export function calculatePlanningSummary(financialModel = {}) {
  const availableCash = calculateAvailableCash(financialModel);
  const monthlyCashFlow = calculateMonthlyCashFlow(financialModel);
  const runningBalance = calculateRunningBalance(financialModel, availableCash);

  return {
    availableCash,
    monthlyCashFlow,
    runningBalance,
  };
}

/**
 * Forecast future balances from a future planning state.
 *
 * @param {object} planningState - Future normalized planning state.
 * @returns {undefined} Placeholder only.
 */
export function forecastBalances(planningState) {
  void planningState;
}

/**
 * Calculate safe-to-spend guidance from future planning and forecast outputs.
 *
 * @param {object} planningState - Future normalized planning state.
 * @param {object} forecastState - Future forecast output.
 * @returns {undefined} Placeholder only.
 */
export function calculateSafeToSpend(planningState, forecastState) {
  void planningState;
  void forecastState;
}

/**
 * Calculate safe-to-invest guidance from future planning and forecast outputs.
 *
 * @param {object} planningState - Future normalized planning state.
 * @param {object} forecastState - Future forecast output.
 * @returns {undefined} Placeholder only.
 */
export function calculateSafeToInvest(planningState, forecastState) {
  void planningState;
  void forecastState;
}

function sumAmounts(rows, amountKey) {
  return Array.isArray(rows)
    ? rows.reduce((sum, row) => sum + getNumericAmount(row, amountKey), 0)
    : 0;
}

function sumMonthlyAmounts(rows) {
  return Array.isArray(rows)
    ? rows.reduce((sum, row) => sum + getMonthlyAmount(row), 0)
    : 0;
}

function getMonthlyAmount(row) {
  return getNumericAmount(row, 'amount')
    * getMonthlyFrequencyMultiplier(row?.frequency);
}

function getMonthlyFrequencyMultiplier(frequency) {
  const normalizedFrequency = typeof frequency === 'string'
    ? frequency.toLowerCase()
    : frequency;

  switch (normalizedFrequency) {
    case 'six-months':
      return 1 / 6;
    case 'yearly':
    case 'annual':
      return 1 / 12;
    case 'weekly':
      return 52 / 12;
    case 'biweekly':
      return 26 / 12;
    case 'monthly':
    default:
      return 1;
  }
}

function getNumericAmount(row, amountKey) {
  const amount = row?.[amountKey];

  return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
}
