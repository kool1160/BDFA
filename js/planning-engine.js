/**
 * BDFA Planning Engine Foundation
 *
 * This module is the home for BDFA's reusable planning architecture.
 *
 * Current implementation scope:
 * - First deterministic Planning Engine calculation only.
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

function getNumericAmount(row, amountKey) {
  const amount = row?.[amountKey];

  return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
}
