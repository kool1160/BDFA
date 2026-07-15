/**
 * Deterministic derived outputs for the complete financial picture.
 *
 * Source records remain the authority. This module only computes outputs and
 * never mutates input data, performs I/O, or renders UI.
 */

const FREQUENCY_MULTIPLIERS = Object.freeze({
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  'six-months': 1 / 6,
  yearly: 1 / 12,
  annual: 1 / 12,
});

export function calculateFinancialTruth(financialModel = {}) {
  const accounts = rows(financialModel.accounts);
  const investments = rows(financialModel.investments);
  const assets = rows(financialModel.assets);
  const liabilities = rows(financialModel.liabilities);
  const bills = rows(financialModel.recurringBills);
  const income = rows(financialModel.recurringIncome);
  const transactions = rows(financialModel.transactions);
  const investmentTransactions = rows(financialModel.investmentTransactions);
  const cash = sum(accounts.filter(account => accountType(account) === 'cash'), accountAmount);
  const accountNet = sum(accounts, accountAmount);
  const investmentTotal = sum(investments, investmentAmount);
  const assetTotal = sum(assets, row => number(row.value ?? row.amount));
  const liabilityTotal = sum(liabilities, row => Math.abs(number(row.amount ?? row.balance)));
  const accountDebt = Math.abs(sum(accounts.filter(account => accountAmount(account) < 0), accountAmount));
  const debt = liabilityTotal + accountDebt;
  const monthlyIncome = sumMonthly(income);
  const monthlyBills = sumMonthly(bills);
  const allocationTotal = sum(financialModel.allocations, row => number(row.amount));

  return {
    netWorth: accountNet + investmentTotal + assetTotal - liabilityTotal,
    cash: { total: cash, availableAfterBills: cash - monthlyBills },
    liabilities: calculateLiabilityPayoff(liabilities, accounts),
    recurring: { income: monthlyIncome, bills: monthlyBills, cashFlow: monthlyIncome - monthlyBills },
    allocations: { total: allocationTotal, availableToAllocate: cash - monthlyBills - allocationTotal },
    transactions: summarizeTransactions(transactions),
    portfolio: calculatePortfolio(investments, investmentTransactions),
    contributions: calculateContributions(investmentTransactions, investments),
    debt,
    sourceCounts: {
      accounts: accounts.length,
      investments: investments.length,
      assets: assets.length,
      liabilities: liabilities.length,
      transactions: transactions.length,
    },
  };
}

function calculatePortfolio(investments, investmentTransactions) {
  const byGroup = new Map();
  investments.forEach(row => {
    const label = row.assetClass || row.accountType || row.detail || row.name || 'Uncategorized';
    byGroup.set(label, (byGroup.get(label) || 0) + investmentAmount(row));
  });
  return {
    total: sum(investments, investmentAmount),
    allocation: [...byGroup].map(([label, amount]) => ({ label, amount })),
    investmentTransactions: investmentTransactions.map(row => ({ ...row })),
  };
}

function calculateContributions(investmentTransactions, investments) {
  const rowsByAccount = new Map();
  investmentTransactions.forEach(row => {
    if (!isContribution(row)) return;
    const key = row.accountId || row.account || row.accountType || 'Unassigned';
    rowsByAccount.set(key, (rowsByAccount.get(key) || 0) + Math.abs(number(row.amount)));
  });
  const contributions = sum([...rowsByAccount.values()], value => value);
  const gains = sum(investmentTransactions.filter(row => isGain(row)), row => number(row.amount));
  const byAccountType = investments.reduce((result, row) => {
    const label = row.accountType || row.type || row.name || 'Uncategorized';
    const isTracked = /hsa|401\s*\(?k\)?/i.test(label);
    if (isTracked) result[label] = (result[label] || 0) + Math.abs(number(row.contributionAmount));
    return result;
  }, {});
  return { total: contributions, gains, byAccount: Object.fromEntries(rowsByAccount), byAccountType };
}

function calculateLiabilityPayoff(liabilities, accounts) {
  const rowsToTrack = liabilities.length ? liabilities : accounts.filter(row => accountAmount(row) < 0).map(row => ({
    ...row, amount: Math.abs(accountAmount(row)), originalAmount: row.originalAmount,
  }));
  return rowsToTrack.map(row => {
    const current = Math.abs(number(row.amount ?? row.balance));
    const original = Math.abs(number(row.originalAmount ?? row.originalBalance));
    return { id: row.id, name: row.name, currentBalance: current, originalBalance: original || null, paidDown: original ? Math.max(original - current, 0) : null };
  });
}

function summarizeTransactions(transactions) {
  const totals = transactions.reduce((result, row) => {
    const amount = number(row.amount);
    const key = String(row.type || 'other').toLowerCase();
    result[key] = (result[key] || 0) + amount;
    return result;
  }, {});
  return { count: transactions.length, totals, net: sum(transactions, row => number(row.amount)), rows: transactions.map(row => ({ ...row })) };
}

function sum(rowsValue, mapper) { return rows(rowsValue).reduce((totalValue, row) => totalValue + mapper(row), 0); }
function sumMonthly(rowsValue) { return sum(rowsValue, row => number(row.amount) * (FREQUENCY_MULTIPLIERS[String(row.frequency || 'monthly').toLowerCase()] || 1)); }
function rows(value) { return Array.isArray(value) ? value : []; }
function number(value) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function accountAmount(row) { return number(row.amount ?? row.balance); }
function investmentAmount(row) { return number(row.amount ?? row.balance ?? row.value); }
function accountType(row) { return String(row.type || '').toLowerCase(); }
function isContribution(row) { return /contribution|deposit|buy/i.test(String(row.type || row.subtype || '')); }
function isGain(row) { return /gain|dividend|interest/i.test(String(row.type || row.subtype || '')); }
