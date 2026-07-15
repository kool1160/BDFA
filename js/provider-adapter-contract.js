/**
 * Provider-neutral adapter contract and deterministic sandbox adapters.
 *
 * This module deliberately contains no provider SDK, credentials, network
 * access, persistence, or DOM behavior. Provider implementations must return
 * this contract before their records can enter BDFA's source model.
 */

export const ADAPTER_DATASETS = Object.freeze([
  'institutions',
  'accounts',
  'balances',
  'transactions',
  'holdings',
  'investmentActivity',
  'liabilities',
  'connectionHealth',
]);

export const ADAPTER_STATES = Object.freeze([
  'healthy',
  'stale',
  'partial',
  'reauthentication-required',
  'duplicate-records',
  'disconnected',
  'error',
]);

const sensitiveKey = /(?:access|refresh)[_-]?token|client[_-]?secret|password|credential|authorization|cookie|account[_-]?number/i;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array`);
  }
}

function redactValue(value) {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value).reduce((redacted, [key, child]) => {
    redacted[key] = sensitiveKey.test(key) ? '[REDACTED]' : redactValue(child);
    return redacted;
  }, {});
}

export function redactAdapterEvent(event) {
  assertObject(event, 'Adapter event');
  return redactValue(event);
}

export function createProviderAdapter(definition) {
  assertObject(definition, 'Adapter definition');
  const { providerName, environment = 'sandbox', fetchDataset } = definition;

  if (typeof providerName !== 'string' || !providerName.trim()) {
    throw new TypeError('Adapter providerName is required');
  }
  if (environment !== 'sandbox') {
    throw new Error('This repository-only contract only permits sandbox adapters');
  }
  if (typeof fetchDataset !== 'function') {
    throw new TypeError('Adapter fetchDataset function is required');
  }

  const adapter = {
    providerName: providerName.trim(),
    environment,
    async fetchDataset(dataset) {
      if (!ADAPTER_DATASETS.includes(dataset)) {
        throw new Error(`Unsupported adapter dataset: ${dataset}`);
      }
      const result = await fetchDataset(dataset);
      assertArray(result, `Adapter dataset ${dataset}`);
      return clone(result);
    },
    async fetchSnapshot() {
      const snapshot = {};
      for (const dataset of ADAPTER_DATASETS) {
        snapshot[dataset] = await this.fetchDataset(dataset);
      }
      return snapshot;
    },
  };

  return Object.freeze(adapter);
}

function getConnectionHealth(snapshot) {
  const health = snapshot.connectionHealth[0] || {};
  const status = ADAPTER_STATES.includes(health.status) ? health.status : 'error';
  return {
    status,
    lastAttemptedAt: health.lastAttemptedAt || null,
    lastSuccessfulAt: health.lastSuccessfulAt || null,
    sourceTimestamp: health.sourceTimestamp || null,
    errorCode: health.errorCode || null,
    errorMessage: health.errorMessage || null,
    requiresReauthentication: Boolean(health.requiresReauthentication),
    partial: Boolean(health.partial),
  };
}

export function normalizeAdapterSnapshot(snapshot, { providerName = 'unknown' } = {}) {
  assertObject(snapshot, 'Adapter snapshot');
  for (const dataset of ADAPTER_DATASETS) assertArray(snapshot[dataset], `Adapter snapshot ${dataset}`);

  const health = getConnectionHealth(snapshot);
  const accountBalances = new Map(snapshot.balances.map(balance => [balance.accountId, balance.amount]));
  const accounts = snapshot.accounts.map(account => ({
    id: account.id,
    name: account.name,
    type: account.type,
    amount: Number(accountBalances.get(account.id) ?? account.amount ?? 0),
    source: 'provider',
    providerName,
    sourceConnectionId: account.connectionId || null,
    sourceRecordId: account.id,
  }));

  const investments = snapshot.holdings.map(holding => ({
    id: holding.id,
    name: holding.name,
    accountId: holding.accountId,
    accountType: holding.accountType || 'Investment',
    assetClass: holding.assetClass || 'Unknown',
    amount: Number(holding.marketValue || 0),
    contributionAmount: 0,
    source: 'provider',
    providerName,
  }));

  return {
    accounts,
    transactions: snapshot.transactions.map(transaction => ({ ...transaction, source: 'provider', providerName })),
    recurringIncome: [],
    recurringBills: [],
    investments,
    investmentTransactions: snapshot.investmentActivity.map(activity => ({ ...activity, source: 'provider', providerName })),
    assets: [],
    liabilities: snapshot.liabilities.map(liability => ({ ...liability, source: 'provider', providerName })),
    allocations: [],
    userPreferences: {},
    metadata: {
      source: 'provider-adapter',
      providerName,
      quality: health.status === 'healthy' ? 'complete' : health.status,
      connectionHealth: health,
      counts: {
        institutions: snapshot.institutions.length,
        accounts: accounts.length,
        transactions: snapshot.transactions.length,
        holdings: snapshot.holdings.length,
        investmentActivity: snapshot.investmentActivity.length,
        liabilities: snapshot.liabilities.length,
      },
    },
  };
}

const baseData = Object.freeze({
  institutions: [{ id: 'sandbox-institution', name: 'Sandbox Institution' }],
  accounts: [
    { id: 'sandbox-checking', connectionId: 'sandbox-connection', name: 'Sandbox Checking', type: 'Cash' },
    { id: 'sandbox-brokerage', connectionId: 'sandbox-connection', name: 'Sandbox Brokerage', type: 'Investment' },
  ],
  balances: [
    { accountId: 'sandbox-checking', amount: 12000, asOf: '2026-01-15T12:00:00.000Z' },
    { accountId: 'sandbox-brokerage', amount: 30000, asOf: '2026-01-15T12:00:00.000Z' },
  ],
  transactions: [{ id: 'sandbox-transaction', accountId: 'sandbox-checking', type: 'income', amount: 5000 }],
  holdings: [{ id: 'sandbox-holding', accountId: 'sandbox-brokerage', name: 'Sandbox Index Fund', accountType: 'Brokerage', assetClass: 'Equity', marketValue: 30000 }],
  investmentActivity: [{ id: 'sandbox-contribution', accountId: 'sandbox-brokerage', type: 'contribution', amount: 1000 }],
  liabilities: [{ id: 'sandbox-loan', name: 'Sandbox Loan', type: 'Loan', amount: 10000, monthlyPayment: 250 }],
});

export function createSandboxAdapter(scenario = 'healthy') {
  if (!['healthy', 'stale', 'partial', 'reauthentication-required', 'duplicate-records', 'disconnected'].includes(scenario)) {
    throw new Error(`Unsupported sandbox scenario: ${scenario}`);
  }

  const data = clone(baseData);
  if (scenario === 'partial') data.holdings = [];
  if (scenario === 'duplicate-records') data.transactions.push({ ...data.transactions[0] });
  if (scenario === 'disconnected') {
    for (const dataset of Object.keys(data)) data[dataset] = [];
  }
  data.connectionHealth = [{
    status: scenario,
    lastAttemptedAt: '2026-01-15T12:05:00.000Z',
    lastSuccessfulAt: scenario === 'reauthentication-required' || scenario === 'disconnected' ? null : '2026-01-15T12:05:00.000Z',
    sourceTimestamp: scenario === 'stale' ? '2025-12-01T12:00:00.000Z' : '2026-01-15T12:00:00.000Z',
    requiresReauthentication: scenario === 'reauthentication-required',
    partial: scenario === 'partial',
  }];

  return createProviderAdapter({ providerName: 'sandbox', fetchDataset: dataset => data[dataset] });
}
