import { runFinancialPipeline } from './financial-engine-pipeline.js';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const summaryCards = [
  ['netWorth', 'Net worth', 'Total owned value after liabilities.'],
  ['cashAfterBills', 'Cash after bills', 'Tracked cash less recurring monthly bills.'],
  ['cashFlow', 'Recurring monthly flow', 'Monthly recurring income less recurring bills.'],
  ['debt', 'Debt', 'Credit and liability balances currently tracked.'],
  ['portfolio', 'Portfolio total', 'Investment balances across tracked accounts.'],
];

const planningCards = [
  ['baseProjection', 'Base projection', 'Projected investable balance at age 55.'],
  ['requiredMonthlyCashFlow', 'Required monthly cash flow', 'Estimated monthly need at the target age.'],
  ['partTime', 'Part-time scenario', 'Required monthly cash flow with part-time income.'],
  ['mortgagePaid', 'Mortgage-paid scenario', 'Required monthly cash flow after modeled payoff.'],
  ['hsaProjection', 'HSA projection', 'Projected HSA balance at the target age.'],
];

function render() {
  const sourceData = typeof window.BDFA?.getSourceData === 'function' ? window.BDFA.getSourceData() : null;
  const summary = document.getElementById('financialTruthSummary');
  const planning = document.getElementById('planningOutputSummary');

  if (!sourceData || !summary || !planning) return;

  const pipeline = runFinancialPipeline(sourceData);
  const truth = pipeline.financialTruth;
  const projection = pipeline.forecastOutputs.retirementProjection;
  const scenarios = pipeline.forecastOutputs.scenarios;

  summary.innerHTML = summaryCards.map(([id, label, detail]) => cardMarkup(
    label,
    detail,
    formatSummaryValue(id, truth),
  )).join('');

  planning.innerHTML = planningCards.map(([id, label, detail]) => cardMarkup(
    label,
    detail,
    formatPlanningValue(id, projection, scenarios),
  )).join('');

  setText('financialTruthStatus', `Derived · ${Object.values(truth.sourceCounts).reduce((sum, count) => sum + count, 0)} source records`);
  setText('planningOutputStatus', projection.status === 'illustrative' ? 'Assumption-based' : 'Missing planning assumptions');
  setText('planningOutputNote', projection.status === 'illustrative'
    ? `${projection.confidence.explanation} Source data is only as fresh as the latest saved snapshot.`
    : 'Add a current age to the planning source data before age-55 projections can be calculated. Source data is only as fresh as the latest saved snapshot.');
}

function formatSummaryValue(id, truth) {
  const values = {
    netWorth: truth.netWorth,
    cashAfterBills: truth.cash.availableAfterBills,
    cashFlow: truth.recurring.cashFlow,
    debt: -truth.debt,
    portfolio: truth.portfolio.total,
  };
  return money.format(values[id] || 0);
}

function formatPlanningValue(id, projection, scenarios) {
  if (projection.status !== 'illustrative') return 'Needs age';
  const values = {
    baseProjection: projection.scenarios.base,
    requiredMonthlyCashFlow: projection.targetSpending.requiredMonthlyCashFlow,
    partTime: scenarios.find(scenario => scenario.id === 'part-time')?.requiredMonthlyCashFlow,
    mortgagePaid: scenarios.find(scenario => scenario.id === 'mortgage-paid')?.requiredMonthlyCashFlow,
    hsaProjection: projection.hsa.projectedBalance,
  };
  return money.format(values[id] || 0);
}

function cardMarkup(label, detail, value) {
  return `<article class="financial-truth-card"><span class="label">${label}</span><strong>${value}</strong><p>${detail}</p></article>`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

window.addEventListener('bdfa:source-data-updated', render);
render();
