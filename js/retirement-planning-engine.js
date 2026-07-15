/**
 * Deterministic planning outputs for the age-55 milestone.
 *
 * This is an educational scenario calculator, not a prediction or investment
 * recommendation. Source data remains authoritative; assumptions are passed
 * explicitly and are returned with every result so the output is auditable.
 * The engine has no I/O, storage, DOM, or provider dependencies.
 */

const DEFAULTS = Object.freeze({
  targetAge: 55,
  annualReturn: 0.05,
  inflationRate: 0.025,
  lowReturn: 0.03,
  highReturn: 0.07,
  healthcareInflationRate: 0.05,
  planningYears: 30,
});

export function calculateRetirementProjection(financialModel = {}, input = {}) {
  const assumptions = normalizeAssumptions(financialModel, input);
  const currentInvestments = sumRows(financialModel.investments, row => amount(row));
  // Investment transactions may be historical or partial; never silently
  // reinterpret their total as a recurring annual contribution.
  const annualContributions = number(input.annualContributions ?? 0);
  const annualSpending = number(input.annualSpending ?? monthlyBills(financialModel) * 12);
  const currentHsaBalance = sumRows(financialModel.investments, row => isHsa(row) ? amount(row) : 0);
  const annualHsaContributions = number(input.annualHsaContributions ?? 0);
  const years = Math.max(0, assumptions.targetAge - assumptions.currentAge);
  const partTimeIncome = number(input.partTimeAnnualIncome ?? 0);
  const mortgage = calculateMortgageScenario(financialModel, input);
  const scenarios = {
    low: projectBalance(currentInvestments, annualContributions, years, assumptions.lowReturn),
    base: projectBalance(currentInvestments, annualContributions, years, assumptions.annualReturn),
    high: projectBalance(currentInvestments, annualContributions, years, assumptions.highReturn),
  };
  const spendingAtTarget = inflate(annualSpending, assumptions.inflationRate, years);
  const healthcareAtTarget = inflate(
    number(input.annualHealthcareCost ?? 0),
    assumptions.healthcareInflationRate,
    years,
  );
  const hsaAtTarget = projectBalance(
    currentHsaBalance,
    annualHsaContributions,
    years,
    assumptions.annualReturn,
  );
  const annualNeed = Math.max(spendingAtTarget + healthcareAtTarget - partTimeIncome - mortgage.annualPaymentReduction, 0);
  const requiredMonthlyCashFlow = annualNeed / 12;

  return {
    status: assumptions.currentAge == null ? 'insufficient-data' : 'illustrative',
    targetAge: assumptions.targetAge,
    years,
    scenarios,
    targetSpending: {
      annualSpending: spendingAtTarget,
      annualHealthcare: healthcareAtTarget,
      partTimeAnnualIncome: partTimeIncome,
      mortgageAnnualPaymentReduction: mortgage.annualPaymentReduction,
      requiredMonthlyCashFlow,
    },
    hsa: {
      currentBalance: currentHsaBalance,
      projectedBalance: hsaAtTarget,
      annualContributions: annualHsaContributions,
    },
    mortgage,
    assumptions: {
      ...assumptions,
      annualContributions,
      annualSpending,
      annualHealthcareCost: number(input.annualHealthcareCost ?? 0),
    },
    confidence: {
      label: 'illustrative-range',
      explanation: 'The range varies only the annual return assumption. Actual results depend on returns, taxes, spending, contributions, inflation, and timing.',
    },
    explanation: [
      'Projected balances compound current investable assets and end-of-year annual contributions.',
      'Target spending and healthcare costs are inflated to the target age.',
      'Part-time income and mortgage payment reduction lower the annual cash-flow need; they do not change the investment balance projection.',
    ],
  };
}

export function calculatePlanningScenarios(financialModel = {}, input = {}) {
  const base = calculateRetirementProjection(financialModel, input);
  const scenarios = [
    { id: 'baseline', label: 'Baseline', partTimeAnnualIncome: 0 },
    { id: 'part-time', label: 'Part-time income', partTimeAnnualIncome: number(input.partTimeAnnualIncome ?? 0) },
    { id: 'mortgage-paid', label: 'Mortgage paid off', partTimeAnnualIncome: 0, mortgagePaidOff: true },
  ];
  return scenarios.map(scenario => {
    const scenarioInput = { ...input, partTimeAnnualIncome: scenario.partTimeAnnualIncome };
    if (scenario.mortgagePaidOff) {
      scenarioInput.mortgageBalance = 0;
      scenarioInput.mortgagePaidOff = true;
    }
    const result = calculateRetirementProjection(financialModel, scenarioInput);
    return { ...scenario, requiredMonthlyCashFlow: result.targetSpending.requiredMonthlyCashFlow, projectedBaseBalance: result.scenarios.base };
  });
}

function calculateMortgageScenario(model, input) {
  const liability = (Array.isArray(model.liabilities) ? model.liabilities : []).find(row => /mortgage/i.test(`${row.name || ''} ${row.type || ''}`));
  const payment = Math.max(0, number(input.mortgageMonthlyPayment ?? liability?.monthlyPayment));
  const balance = Math.max(0, number(input.mortgageBalance ?? liability?.amount));
  if (input.mortgagePaidOff) return { status: 'modeled', currentBalance: balance, annualPaymentReduction: payment * 12, payoffMonths: 0 };
  if (!balance || !payment) return { status: 'not-modeled', currentBalance: balance, annualPaymentReduction: 0, payoffMonths: null };
  const rate = Math.max(0, number(input.mortgageAnnualRate ?? liability?.annualRate)) / 12;
  let remaining = balance;
  let months = 0;
  while (remaining > 0.01 && months < 1200) {
    remaining = Math.max(0, remaining + remaining * rate - payment);
    months += 1;
  }
  return { status: 'modeled', currentBalance: balance, annualPaymentReduction: 0, potentialAnnualPaymentReduction: payment * 12, payoffMonths: months };
}

function normalizeAssumptions(model, input) {
  const preferences = model.userPreferences || {};
  const currentAge = numberOrNull(input.currentAge ?? preferences.currentAge);
  return {
    currentAge,
    targetAge: number(input.targetAge ?? preferences.targetAge ?? DEFAULTS.targetAge),
    annualReturn: number(input.annualReturn ?? DEFAULTS.annualReturn),
    inflationRate: number(input.inflationRate ?? DEFAULTS.inflationRate),
    lowReturn: number(input.lowReturn ?? DEFAULTS.lowReturn),
    highReturn: number(input.highReturn ?? DEFAULTS.highReturn),
    healthcareInflationRate: number(input.healthcareInflationRate ?? DEFAULTS.healthcareInflationRate),
  };
}

function projectBalance(start, contribution, years, annualReturn) {
  if (!years) return start;
  const growth = (1 + annualReturn) ** years;
  return annualReturn === 0 ? start + contribution * years : start * growth + contribution * ((growth - 1) / annualReturn);
}

function inflate(value, rate, years) { return value * ((1 + rate) ** years); }
function monthlyBills(model) { return sumRows(model.recurringBills, row => number(row.amount) * frequencyMultiplier(row.frequency)); }
function frequencyMultiplier(frequency) { return { weekly: 52 / 12, biweekly: 26 / 12, semimonthly: 2, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12, annual: 1 / 12 }[String(frequency || 'monthly').toLowerCase()] || 1; }
function sumRows(rows, mapper) { return Array.isArray(rows) ? rows.reduce((sum, row) => sum + mapper(row), 0) : 0; }
function amount(row) { return number(row.amount ?? row.balance ?? row.value); }
function number(value) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function numberOrNull(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function isHsa(row) { return /hsa/i.test(`${row.name || ''} ${row.accountType || ''} ${row.type || ''}`); }
