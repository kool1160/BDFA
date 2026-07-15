/**
 * Synthetic normalized source snapshots for reconciliation tests.
 *
 * These records are intentionally generic and contain no owner, institution,
 * provider, or account identifiers from a real financial system.
 */

const sourceMetadata = {
  source: 'synthetic-fixture',
  sourceTimestamp: '2026-01-15T12:00:00.000Z',
  syncedAt: '2026-01-15T12:05:00.000Z',
};

export const completeNormalizedSource = {
  accounts: [
    { id: 'account-checking', name: 'Primary Checking', type: 'Cash', amount: 12000 },
    { id: 'account-savings', name: 'Emergency Savings', type: 'Cash', amount: 8000 },
    { id: 'account-card', name: 'Daily Credit Card', type: 'Credit Card', amount: -750 },
  ],
  transactions: [
    { id: 'transaction-pay', type: 'income', amount: 5000 },
    { id: 'transaction-rent', type: 'expense', amount: -1800 },
    { id: 'transaction-dividend', type: 'dividend', amount: 40 },
  ],
  recurringIncome: [
    { id: 'income-pay', name: 'Salary', amount: 5000, frequency: 'monthly' },
  ],
  recurringBills: [
    { id: 'bill-housing', name: 'Housing', amount: 1800, frequency: 'monthly' },
    { id: 'bill-insurance', name: 'Insurance', amount: 600, frequency: 'quarterly' },
  ],
  investments: [
    { id: 'investment-brokerage', name: 'Broad Market Fund', accountType: 'Brokerage', assetClass: 'Equity', amount: 30000, contributionAmount: 0 },
    { id: 'investment-retirement', name: 'Workplace Retirement', accountType: '401(k)', assetClass: 'Equity', amount: 70000, contributionAmount: 18000 },
    { id: 'investment-hsa', name: 'Health Savings', accountType: 'HSA', assetClass: 'Cash', amount: 10000, contributionAmount: 4000 },
  ],
  investmentTransactions: [
    { id: 'investment-contribution', accountId: 'investment-retirement', type: 'contribution', amount: 18000 },
    { id: 'investment-hsa-contribution', accountId: 'investment-hsa', type: 'contribution', amount: 4000 },
    { id: 'investment-dividend', accountId: 'investment-brokerage', type: 'dividend', amount: 40 },
    { id: 'investment-gain', accountId: 'investment-brokerage', type: 'gain', amount: 2500 },
  ],
  assets: [
    { id: 'asset-home', name: 'Home', type: 'Home', value: 300000 },
    { id: 'asset-vehicle', name: 'Vehicle', type: 'Vehicle', value: 25000 },
  ],
  liabilities: [
    { id: 'liability-mortgage', name: 'Mortgage', type: 'Mortgage', amount: 220000, originalAmount: 250000, monthlyPayment: 1800, annualRate: 0.04 },
    { id: 'liability-vehicle', name: 'Vehicle Loan', type: 'Vehicle', amount: 15000, originalAmount: 20000 },
  ],
  allocations: [{ id: 'allocation-reserve', name: 'Reserve', amount: 1000 }],
  userPreferences: { currentAge: 40, targetAge: 55 },
  metadata: {
    ...sourceMetadata,
    connectionHealth: {
      status: 'healthy',
      lastAttemptedAt: sourceMetadata.syncedAt,
      lastSuccessfulAt: sourceMetadata.syncedAt,
      sourceTimestamp: sourceMetadata.sourceTimestamp,
    },
  },
};

export const stalePartialSource = {
  ...completeNormalizedSource,
  accounts: completeNormalizedSource.accounts.slice(0, 2),
  investments: completeNormalizedSource.investments.slice(0, 1),
  liabilities: [],
  metadata: {
    ...sourceMetadata,
    sourceTimestamp: '2025-12-01T12:00:00.000Z',
    syncedAt: '2025-12-01T12:05:00.000Z',
    quality: 'partial',
    connectionHealth: {
      status: 'stale',
      lastAttemptedAt: sourceMetadata.syncedAt,
      lastSuccessfulAt: '2025-12-01T12:05:00.000Z',
      sourceTimestamp: '2025-12-01T12:00:00.000Z',
    },
  },
};

export const duplicateSource = {
  ...completeNormalizedSource,
  transactions: [
    ...completeNormalizedSource.transactions,
    { ...completeNormalizedSource.transactions[0] },
  ],
  metadata: {
    ...sourceMetadata,
    quality: 'duplicate-records',
    connectionHealth: { status: 'error', lastAttemptedAt: sourceMetadata.syncedAt, lastSuccessfulAt: null },
  },
};

export const missingDataSource = {
  accounts: [],
  transactions: [],
  recurringIncome: [],
  recurringBills: [],
  investments: [],
  investmentTransactions: [],
  assets: [],
  liabilities: [],
  allocations: [],
  userPreferences: {},
  metadata: {
    source: 'synthetic-fixture',
    quality: 'missing-data',
    connectionHealth: { status: 'reauthentication-required', lastAttemptedAt: null, lastSuccessfulAt: null },
  },
};
