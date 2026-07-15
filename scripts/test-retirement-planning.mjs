import assert from 'node:assert/strict';
import { calculatePlanningScenarios, calculateRetirementProjection } from '../js/retirement-planning-engine.js';
import { runFinancialPipeline } from '../js/financial-engine-pipeline.js';

function assertAlmostEqual(actual, expected, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

const model = {
  userPreferences: { currentAge: 45 },
  investments: [
    { name: '401(k)', accountType: '401(k)', amount: 100000 },
    { name: 'HSA', accountType: 'HSA', amount: 10000 },
  ],
  recurringBills: [{ amount: 4000, frequency: 'monthly' }],
  liabilities: [{ name: 'Mortgage', amount: 200000, monthlyPayment: 1500, annualRate: 0.06 }],
};

const projection = calculateRetirementProjection(model, {
  annualContributions: 12000,
  annualHsaContributions: 4000,
  annualHealthcareCost: 6000,
  partTimeAnnualIncome: 18000,
});

assert.equal(projection.status, 'illustrative');
assert.equal(projection.years, 10);
assertAlmostEqual(projection.scenarios.base, 330113.1193721047);
assertAlmostEqual(projection.targetSpending.annualSpending, 61444.05812142512);
assertAlmostEqual(projection.targetSpending.annualHealthcare, 9773.367760664652);
assertAlmostEqual(projection.targetSpending.requiredMonthlyCashFlow, 4434.785490174148);
assertAlmostEqual(projection.hsa.projectedBalance, 66600.51640996977);
assert.equal(projection.mortgage.status, 'modeled');
assert.equal(projection.mortgage.annualPaymentReduction, 0);
assert.equal(projection.mortgage.potentialAnnualPaymentReduction, 18000);
assert.ok(projection.confidence.explanation.includes('annual return assumption'));

const scenarios = calculatePlanningScenarios(model, { annualContributions: 12000, partTimeAnnualIncome: 18000 });
assert.deepEqual(scenarios.map(row => row.id), ['baseline', 'part-time', 'mortgage-paid']);
assert.ok(scenarios[1].requiredMonthlyCashFlow < scenarios[0].requiredMonthlyCashFlow);
assert.ok(scenarios[2].requiredMonthlyCashFlow < scenarios[0].requiredMonthlyCashFlow);

const pipeline = runFinancialPipeline({ accounts: [], investments: [], recurringBills: [] });
assert.ok(pipeline.forecastOutputs.retirementProjection);
assert.equal(pipeline.forecastOutputs.retirementProjection.status, 'insufficient-data');

console.log('Retirement planning representative checks passed.');
