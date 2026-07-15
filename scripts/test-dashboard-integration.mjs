import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runFinancialPipeline } from '../js/financial-engine-pipeline.js';

const html = fs.readFileSync('index.html', 'utf8');
const dashboard = fs.readFileSync('js/financial-truth-dashboard.js', 'utf8');

for (const id of ['financialTruthSummary', 'planningOutputSummary', 'financialTruthStatus', 'planningOutputStatus']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /type="module" src="js\/financial-truth-dashboard\.js"/);
assert.match(dashboard, /bdfa:source-data-updated/);

const result = runFinancialPipeline({
  accounts: [{ id: 'cash', name: 'Checking', type: 'Cash', amount: 1000 }],
  bills: [{ id: 'bill', name: 'Rent', amount: 200, frequency: 'monthly' }],
  recurringIncome: [{ id: 'income', name: 'Pay', amount: 500, frequency: 'monthly' }],
  investments: [{ id: 'brokerage', name: 'Brokerage', amount: 4000 }],
  allocations: [],
  assets: [],
  transactions: [],
  liabilities: [],
});

assert.equal(result.financialTruth.netWorth, 5000);
assert.equal(result.financialTruth.cash.availableAfterBills, 800);
assert.equal(result.financialTruth.recurring.cashFlow, 300);
assert.equal(result.forecastOutputs.retirementProjection.status, 'insufficient-data');
console.log('Dashboard integration representative checks passed.');
