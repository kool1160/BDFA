import assert from 'node:assert/strict';
import { calculateFinancialTruth } from '../js/financial-truth-engine.js';
import { calculateRetirementProjection } from '../js/retirement-planning-engine.js';
import {
  completeNormalizedSource,
  duplicateSource,
  missingDataSource,
  stalePartialSource,
} from './fixtures/normalized-source-fixtures.mjs';

const truth = calculateFinancialTruth(completeNormalizedSource);
assert.equal(completeNormalizedSource.metadata.connectionHealth.status, 'healthy');
assert.equal(completeNormalizedSource.metadata.connectionHealth.sourceTimestamp, completeNormalizedSource.metadata.sourceTimestamp);
assert.equal(truth.netWorth, 219250);
assert.equal(truth.cash.total, 20000);
assert.equal(truth.recurring.bills, 2000);
assert.equal(truth.recurring.cashFlow, 3000);
assert.equal(truth.portfolio.total, 110000);
assert.equal(truth.contributions.total, 22000);
assert.equal(truth.contributions.gains, 2540);
assert.deepEqual(truth.contributions.byAccountType, { '401(k)': 18000, HSA: 4000 });
assert.equal(truth.liabilities.find(row => row.id === 'liability-mortgage').paidDown, 30000);

const projection = calculateRetirementProjection(completeNormalizedSource);
assert.equal(projection.status, 'illustrative');
assert.equal(projection.targetAge, 55);
assert.equal(projection.years, 15);
assert.equal(projection.hsa.currentBalance, 10000);
assert.equal(projection.mortgage.status, 'modeled');

const staleTruth = calculateFinancialTruth(stalePartialSource);
assert.equal(stalePartialSource.metadata.quality, 'partial');
assert.equal(stalePartialSource.metadata.connectionHealth.status, 'stale');
assert.equal(staleTruth.sourceCounts.accounts, 2);
assert.equal(staleTruth.sourceCounts.investments, 1);
assert.equal(staleTruth.sourceCounts.liabilities, 0);
assert.equal(new Date(stalePartialSource.metadata.sourceTimestamp) < new Date(completeNormalizedSource.metadata.sourceTimestamp), true);

assert.equal(duplicateSource.transactions.length, completeNormalizedSource.transactions.length + 1);
assert.equal(new Set(duplicateSource.transactions.map(row => row.id)).size, completeNormalizedSource.transactions.length);
assert.equal(duplicateSource.metadata.connectionHealth.status, 'error');

const missingTruth = calculateFinancialTruth(missingDataSource);
const missingProjection = calculateRetirementProjection(missingDataSource);
assert.equal(missingTruth.netWorth, 0);
assert.equal(missingTruth.sourceCounts.accounts, 0);
assert.equal(missingProjection.status, 'insufficient-data');
assert.equal(missingDataSource.metadata.connectionHealth.status, 'reauthentication-required');

console.log('Normalized source reconciliation representative checks passed.');
