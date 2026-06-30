/**
 * BDFA Derived Output Contracts
 *
 * Derived outputs are computed values produced by Planning, Forecast, and
 * Decision engines. They are not stored source data and should be recomputed
 * from the Unified Financial Model whenever possible.
 *
 * This module defines placeholder contract shapes only. It intentionally contains
 * no calculations, mock data, DOM access, imports, or application wiring.
 */

/**
 * Planning Outputs
 *
 * Future outputs produced by the Planning Engine after source data has been
 * normalized into the Unified Financial Model.
 */
export const PlanningOutputs = {
  /** Future computed amount available to assign across bills, goals, and plans. */
  availableToAllocate: undefined,

  /** Future computed monthly cash flow summary. */
  monthlyCashFlow: undefined,

  /** Future computed progress signals for goals. */
  goalProgress: undefined,
};

/**
 * Forecast Outputs
 *
 * Future outputs produced by the Forecast Engine to represent cash timing,
 * running balances, and balance projections.
 */
export const ForecastOutputs = {
  /** Future computed daily or period-based running balance timeline. */
  runningBalances: undefined,

  /** Future computed forecasted balances across the selected planning horizon. */
  forecastBalances: undefined,

  /** Future computed confidence signal for the current cash flow plan. */
  cashFlowConfidence: undefined,
};

/**
 * Decision Outputs
 *
 * Future outputs produced by the Decision Engine to convert planning and forecast
 * results into user-facing guidance.
 */
export const DecisionOutputs = {
  /** Future computed safe-to-spend guidance. */
  safeToSpend: undefined,

  /** Future computed safe-to-invest guidance. */
  safeToInvest: undefined,
};
