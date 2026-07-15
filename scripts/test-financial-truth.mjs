import assert from 'node:assert/strict';
import { calculateFinancialTruth } from '../js/financial-truth-engine.js';
import { runFinancialPipeline } from '../js/financial-engine-pipeline.js';

const model = {
  accounts: [
    { id: 'checking', type: 'Cash', amount: 10000 },
    { id: 'card', type: 'Credit Card', amount: -500 },
  ],
  investments: [
    { id: '401k', name: '401(k)', accountType: '401(k)', amount: 20000, contributionAmount: 12000 },
    { id: 'hsa', name: 'HSA', accountType: 'HSA', amount: 5000, contributionAmount: 4000 },
  ],
  assets: [{ id: 'home', value: 250000 }],
  liabilities: [{ id: 'mortgage', name: 'Mortgage', amount: 150000, originalAmount: 175000 }],
  recurringIncome: [{ amount: 1000, frequency: 'weekly' }],
  recurringBills: [{ amount: 600, frequency: 'monthly' }, { amount: 1200, frequency: 'quarterly' }],
  allocations: [{ amount: 1000 }],
  transactions: [
    { type: 'income', amount: 1000 },
    { type: 'expense', amount: -250 },
  ],
  investmentTransactions: [
    { accountType: '401(k)', type: 'contribution', amount: 1000 },
    { accountType: '401(k)', type: 'dividend', amount: 25 },
  ],
};

const truth = calculateFinancialTruth(model);
assert.equal(truth.netWorth, 134500);
assert.equal(truth.recurring.income, 1000 * 52 / 12);
assert.equal(truth.recurring.bills, 1000);
assert.equal(truth.recurring.cashFlow, 1000 * 52 / 12 - 1000);
assert.equal(truth.allocations.availableToAllocate, 8000);
assert.deepEqual(truth.transactions.totals, { income: 1000, expense: -250 });
assert.equal(truth.contributions.total, 1000);
assert.equal(truth.contributions.gains, 25);
assert.deepEqual(truth.contributions.byAccountType, { '401(k)': 12000, HSA: 4000 });
assert.equal(truth.liabilities[0].paidDown, 25000);
assert.equal(truth.portfolio.total, 25000);

const pipelineOutput = runFinancialPipeline({ accounts: [], investments: [], bills: [] });
assert.ok(pipelineOutput.financialTruth);
assert.equal(pipelineOutput.financialTruth.netWorth, 0);

console.log('Financial truth representative checks passed.');
