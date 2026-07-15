import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runFinancialPipeline } from '../js/financial-engine-pipeline.js';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const adapter = fs.readFileSync('js/data-adapter.js', 'utf8');

for (const hook of ['liabilityForm', 'liabilitiesList', 'planningAssumptionsForm', 'planningCurrentAge']) {
  assert.match(html, new RegExp(`id="${hook}"`));
}
assert.match(app, /source: 'manual'/);
assert.match(adapter, /planningAssumptions/);

const result = runFinancialPipeline({
  accounts: [{ id: 'cash', name: 'Cash', type: 'Cash', amount: 10000 }],
  bills: [],
  allocations: [],
  investments: [{ id: '401k', name: '401\(k\)', detail: 'Retirement', amount: 50000 }],
  assets: [{ id: 'home', name: 'Home', type: 'Home', value: 300000, source: 'manual' }],
  liabilities: [{ id: 'mortgage', name: 'Mortgage', type: 'Mortgage', amount: 200000, monthlyPayment: 1500, source: 'manual' }],
  recurringIncome: [],
  planningAssumptions: { currentAge: 45, targetAge: 55, annualContributions: 12000, mortgageMonthlyPayment: 1500 },
});

assert.equal(result.financialTruth.sourceCounts.liabilities, 1);
assert.equal(result.forecastOutputs.retirementProjection.status, 'illustrative');
assert.equal(result.forecastOutputs.retirementProjection.assumptions.annualContributions, 12000);
assert.equal(result.forecastOutputs.retirementProjection.mortgage.currentBalance, 200000);
console.log('Manual source record representative checks passed.');
