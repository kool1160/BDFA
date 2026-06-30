/**
 * BDFA Mock Data Bridge
 *
 * This module is a temporary architectural seam between the current local mock
 * dashboard data and future Planning Engine work.
 *
 * Its future purpose is to translate the existing mock app data shape into the
 * Unified Financial Model so Planning, Forecast, and Decision engines can be
 * developed against one shared model before real provider or manual data flows
 * are introduced.
 *
 * Current rules for this bridge:
 * - No implementation.
 * - No calculations.
 * - No mock data duplication.
 * - No DOM access.
 * - No imports.
 * - No application wiring.
 * - No backend, authentication, API, Plaid, or bank integration logic.
 */

/**
 * Build a future Unified Financial Model from current local mock dashboard data.
 *
 * @param {object} mockData - Future current mock dashboard data input.
 * @returns {undefined} Placeholder only.
 */
export function buildUnifiedModelFromMockData(mockData) {
  void mockData;
}

/**
 * Map current mock account records into the future Unified Financial Model shape.
 *
 * @param {Array<object>} mockAccounts - Future mock account records.
 * @returns {undefined} Placeholder only.
 */
export function mapMockAccounts(mockAccounts) {
  void mockAccounts;
}

/**
 * Map current mock bill records into the future Unified Financial Model shape.
 *
 * @param {Array<object>} mockBills - Future mock bill records.
 * @returns {undefined} Placeholder only.
 */
export function mapMockBills(mockBills) {
  void mockBills;
}

/**
 * Map current mock allocation records into the future Unified Financial Model shape.
 *
 * @param {Array<object>} mockAllocations - Future mock allocation records.
 * @returns {undefined} Placeholder only.
 */
export function mapMockAllocations(mockAllocations) {
  void mockAllocations;
}

/**
 * Map current mock investment records into the future Unified Financial Model shape.
 *
 * @param {Array<object>} mockInvestments - Future mock investment records.
 * @returns {undefined} Placeholder only.
 */
export function mapMockInvestments(mockInvestments) {
  void mockInvestments;
}
