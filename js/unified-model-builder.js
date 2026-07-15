import { UnifiedFinancialModel } from './unified-financial-model.js';

/**
 * BDFA Unified Model Builder
 *
 * This module is the orchestration layer responsible for constructing a complete
 * Unified Financial Model from normalized source data.
 *
 * Current implementation scope:
 * - Merge normalized source-data sections only.
 * - Initialize empty derived-state containers only.
 * - No financial calculations.
 * - No forecasting.
 * - No DOM access.
 * - No application wiring.
 */

/**
 * Intended build sequence:
 *
 * 1. Receive normalized source data.
 * 2. Validate source data.
 * 3. Build the Unified Financial Model.
 * 4. Initialize derived state containers.
 * 5. Return the complete model.
 */

const SOURCE_SECTION_DEFAULTS = {
  accounts: [],
  transactions: [],
  recurringIncome: [],
  recurringBills: [],
  investments: [],
  investmentTransactions: [],
  assets: [],
  liabilities: [],
  goals: [],
  allocations: [],
  userPreferences: {},
  metadata: {},
};

/**
 * Build a complete Unified Financial Model from normalized source data.
 *
 * @param {object} normalizedSourceData - Normalized source data input.
 * @returns {object} Unified Financial Model with source sections and empty derived containers.
 */
export function buildUnifiedFinancialModel(normalizedSourceData = {}) {
  const sourceModel = mergeSourceData(normalizedSourceData);

  return initializeDerivedState(sourceModel);
}

/**
 * Merge normalized source data sections into the Unified Financial Model shape.
 *
 * @param {object} normalizedSourceData - Normalized source data input.
 * @returns {object} Unified Financial Model source-data shape.
 */
export function mergeSourceData(normalizedSourceData = {}) {
  return {
    ...UnifiedFinancialModel,
    accounts: cloneArraySection(normalizedSourceData.accounts),
    transactions: cloneArraySection(normalizedSourceData.transactions),
    recurringIncome: cloneArraySection(normalizedSourceData.recurringIncome),
    recurringBills: cloneArraySection(normalizedSourceData.recurringBills),
    investments: cloneArraySection(normalizedSourceData.investments),
    investmentTransactions: cloneArraySection(normalizedSourceData.investmentTransactions),
    assets: cloneArraySection(normalizedSourceData.assets),
    liabilities: cloneArraySection(normalizedSourceData.liabilities),
    goals: cloneArraySection(normalizedSourceData.goals),
    allocations: cloneArraySection(normalizedSourceData.allocations),
    userPreferences: cloneObjectSection(normalizedSourceData.userPreferences),
    metadata: cloneObjectSection(normalizedSourceData.metadata),
  };
}

/**
 * Initialize derived state containers without calculating derived values.
 *
 * @param {object} unifiedModel - Unified Financial Model source-data shape.
 * @returns {object} Unified Financial Model with empty derived containers.
 */
export function initializeDerivedState(unifiedModel = {}) {
  return {
    ...unifiedModel,
    derived: {
      planningOutputs: {},
      forecastOutputs: {},
      decisionOutputs: {},
    },
  };
}

function cloneArraySection(section) {
  return Array.isArray(section)
    ? section.map(item => ({ ...item }))
    : [...SOURCE_SECTION_DEFAULTS.accounts];
}

function cloneObjectSection(section) {
  return section && typeof section === 'object' && !Array.isArray(section)
    ? { ...section }
    : {};
}
