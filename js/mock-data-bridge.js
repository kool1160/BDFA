import { buildUnifiedFinancialModel } from './unified-model-builder.js';

/**
 * BDFA Mock Data Bridge
 *
 * This module is a temporary architectural seam between the current local mock
 * dashboard data and Planning Engine work.
 *
 * Its purpose is to translate the existing mock app data shape into the Unified
 * Financial Model so Planning, Forecast, and Decision engines can be developed
 * against one shared model before real provider or manual data flows are
 * introduced.
 *
 * Current implementation scope:
 * - Source-data mapping only.
 * - No derived values.
 * - No calculations.
 * - No mock data duplication.
 * - No DOM access.
 * - No application wiring.
 * - No backend, authentication, API, Plaid, or bank integration logic.
 */

/**
 * Build a Unified Financial Model from current local mock dashboard data.
 *
 * @param {object} mockData - Current mock dashboard data input.
 * @returns {object} Unified Financial Model populated with source-data sections.
 */
export function buildUnifiedModelFromMockData(mockData = {}) {
  return buildUnifiedFinancialModel({
    accounts: mapMockAccounts(mockData.accounts),
    recurringBills: mapMockBills(mockData.bills),
    recurringIncome: mapMockIncome(mockData.recurringIncome || mockData.income),
    investments: mapMockInvestments(mockData.investments),
    investmentTransactions: toArray(mockData.investmentTransactions),
    liabilities: toArray(mockData.liabilities),
    allocations: mapMockAllocations(mockData.allocations),
    assets: toArray(mockData.assets),
    transactions: toArray(mockData.transactions),
    userPreferences: mockData.planningAssumptions || {},
  });
}

/**
 * Map current mock account records into the Unified Financial Model source shape.
 *
 * @param {Array<object>} mockAccounts - Current mock account records.
 * @returns {Array<object>} Normalized account source records.
 */
export function mapMockAccounts(mockAccounts = []) {
  return toArray(mockAccounts).map(account => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.amount,
    source: 'mock-dashboard',
  }));
}

/**
 * Map current mock bill records into the Unified Financial Model source shape.
 *
 * @param {Array<object>} mockBills - Current mock bill records.
 * @returns {Array<object>} Normalized recurring bill source records.
 */
export function mapMockBills(mockBills = []) {
  return toArray(mockBills).map(bill => ({
    id: bill.id,
    name: bill.name,
    detail: bill.detail,
    amount: bill.amount,
    frequency: bill.frequency,
    source: 'mock-dashboard',
  }));
}

/**
 * Map current mock income records into the Unified Financial Model source shape.
 *
 * The current dashboard data does not yet include an income collection, so this
 * returns an empty section unless future mock income data is provided.
 *
 * @param {Array<object>} mockIncome - Current mock income records.
 * @returns {Array<object>} Normalized recurring income source records.
 */
export function mapMockIncome(mockIncome = []) {
  return toArray(mockIncome).map(income => ({
    id: income.id,
    name: income.name,
    detail: income.detail,
    amount: income.amount,
    frequency: income.frequency,
    source: 'mock-dashboard',
  }));
}

/**
 * Map current mock allocation records into the Unified Financial Model source shape.
 *
 * @param {Array<object>} mockAllocations - Current mock allocation records.
 * @returns {Array<object>} Normalized allocation source records.
 */
export function mapMockAllocations(mockAllocations = []) {
  return toArray(mockAllocations).map(allocation => ({
    id: allocation.id,
    name: allocation.name,
    detail: allocation.detail,
    amount: allocation.amount,
    targetAmount: allocation.targetAmount,
    source: 'mock-dashboard',
  }));
}

/**
 * Map current mock investment records into the Unified Financial Model source shape.
 *
 * @param {Array<object>} mockInvestments - Current mock investment records.
 * @returns {Array<object>} Normalized investment source records.
 */
export function mapMockInvestments(mockInvestments = []) {
  return toArray(mockInvestments).map(investment => ({
    id: investment.id,
    name: investment.name,
    detail: investment.detail,
    balance: investment.amount,
    marketValue: investment.marketValue,
    symbol: investment.symbol || investment.ticker,
    ticker: investment.ticker,
    accountId: investment.accountId,
    accountType: investment.accountType,
    assetClass: investment.assetClass,
    contributionAmount: investment.contributionAmount,
    annualContributionTarget: investment.annualContributionTarget,
    contributionTarget: investment.contributionTarget,
    realizedGain: investment.realizedGain,
    unrealizedGain: investment.unrealizedGain,
    source: 'mock-dashboard',
  }));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}
