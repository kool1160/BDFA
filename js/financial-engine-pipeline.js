import { buildUnifiedModelFromMockData } from './mock-data-bridge.js';
import { calculatePlanningSummary } from './planning-engine.js';
import { calculateFinancialTruth } from './financial-truth-engine.js';
import { calculatePlanningScenarios, calculateRetirementProjection } from './retirement-planning-engine.js';

/**
 * BDFA Financial Engine Pipeline
 *
 * This module coordinates BDFA's reusable financial engines from one
 * deterministic execution flow.
 *
 * Pipeline execution should remain deterministic and side-effect free: given the
 * same input data, it should return the same Planning State-compatible object
 * without mutating source data, touching the DOM, performing network calls, or
 * writing to storage.
 *
 * Current implementation scope:
 * - Build a Unified Financial Model from supplied mock data.
 * - Return Planning Engine summary outputs plus age-55 planning forecast
 *   outputs and an empty decision output container.
 * - Planning Engine summary calculations only.
 * - Forecasting is limited to explicit, illustrative age-55 scenarios.
 * - No decision calculations.
 * - No DOM access.
 * - No application wiring.
 */

/**
 * Intended future engine execution flow:
 *
 * 1. Build Unified Financial Model.
 * 2. Validate Model.
 * 3. Execute Planning Engine.
 * 4. Execute Forecast Engine.
 * 5. Execute Decision Engine.
 * 6. Return derived outputs.
 */

/**
 * Run the financial engine pipeline against supplied mock data.
 *
 * @param {object} mockData - Current mock dashboard data input.
 * @returns {object} Planning State-compatible output.
 */
export function runFinancialPipeline(mockData = {}) {
  const financialModel = buildUnifiedModelFromMockData(mockData);
  const planningOutputs = runPlanningEngine(financialModel);
  const forecastOutputs = runForecastEngine(financialModel, financialModel.userPreferences);
  const decisionOutputs = runDecisionEngine(planningOutputs, forecastOutputs);
  const financialTruth = calculateFinancialTruth(financialModel);

  return {
    financialModel,
    planningOutputs,
    forecastOutputs,
    decisionOutputs,
    financialTruth,
    metadata: {
      source: 'mock-dashboard',
      pipelineVersion: 'phase-3-financial-truth',
    },
  };
}

/**
 * Run the Planning Engine step.
 *
 * @param {object} unifiedModel - Unified Financial Model input.
 * @returns {object} Planning Engine summary outputs.
 */
export function runPlanningEngine(unifiedModel) {
  return calculatePlanningSummary(unifiedModel);
}

/**
 * Run the Forecast Engine step.
 *
 * @param {object} planningOutputs - Planning Engine outputs.
 * @returns {object} Illustrative age-55 forecast outputs.
 */
export function runForecastEngine(financialModel = {}, assumptions = {}) {
  return {
    retirementProjection: calculateRetirementProjection(financialModel, assumptions),
    scenarios: calculatePlanningScenarios(financialModel, assumptions),
  };
}

/**
 * Run the Decision Engine step.
 *
 * @param {object} planningOutputs - Planning Engine outputs.
 * @param {object} forecastOutputs - Forecast Engine outputs.
 * @returns {object} Empty decision output container.
 */
export function runDecisionEngine(planningOutputs, forecastOutputs) {
  void planningOutputs;
  void forecastOutputs;

  return {};
}
