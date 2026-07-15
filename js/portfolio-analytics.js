/**
 * Deterministic portfolio analytics from source investment records.
 *
 * Balances describe current value only. Performance fields are reported only
 * when an investment activity record explicitly labels the activity or a
 * source holding supplies that field.
 */
export function calculatePortfolioAnalytics(investments = [], investmentTransactions = []) {
  const holdings = rows(investments);
  const activities = rows(investmentTransactions);
  const total = sum(holdings, holdingValue);
  const allocationBy = key => group(holdings, row => row[key] || 'Uncategorized', holdingValue);
  const byAccount = new Map();

  holdings.forEach(row => {
    const key = row.accountId || row.account || row.accountType || row.name || 'Unassigned';
    const entry = byAccount.get(key) || { label: key, accountType: row.accountType || 'Unknown', contributions: 0, gains: 0, dividends: 0, interest: 0, realizedGains: 0, unrealizedGains: 0 };
    entry.contributions += number(row.contributionAmount);
    entry.unrealizedGains += explicitValue(row.unrealizedGain);
    byAccount.set(key, entry);
  });

  const income = { dividends: 0, interest: 0, total: 0 };
  const overlap = new Map();
  let explicitRealized = 0;
  let explicitUnrealized = sum(holdings, row => explicitValue(row.unrealizedGain));

  activities.forEach(row => {
    const key = row.accountId || row.account || row.accountType || 'Unassigned';
    const entry = byAccount.get(key) || { label: key, accountType: row.accountType || 'Unknown', contributions: 0, gains: 0, dividends: 0, interest: 0, realizedGains: 0, unrealizedGains: 0 };
    const type = activityType(row);
    const amount = number(row.amount);
    if (type === 'contribution') entry.contributions += Math.abs(amount);
    if (type === 'dividend') { entry.dividends += amount; income.dividends += amount; }
    if (type === 'interest') { entry.interest += amount; income.interest += amount; }
    if (type === 'gain' || type === 'realizedGain') { entry.gains += amount; }
    if (type === 'realizedGain') { entry.realizedGains += amount; explicitRealized += amount; }
    if (type === 'unrealizedGain') { entry.unrealizedGains += amount; explicitUnrealized += amount; }
    byAccount.set(key, entry);
  });

  income.total = income.dividends + income.interest;
  holdings.forEach(row => {
    const symbol = String(row.symbol || row.ticker || '').trim().toUpperCase();
    if (!symbol) return;
    const entry = overlap.get(symbol) || { symbol, holdingCount: 0, accountCount: new Set(), marketValue: 0 };
    entry.holdingCount += 1;
    entry.accountCount.add(row.accountId || row.account || row.accountType || 'Unassigned');
    entry.marketValue += holdingValue(row);
    overlap.set(symbol, entry);
  });

  const concentration = concentrationRisk(holdings, total);
  const contributionProgress = contributionProgressFor(holdings, byAccount);
  const hasExplicitPerformance = activities.some(row => ['gain', 'realizedGain', 'unrealizedGain', 'dividend', 'interest'].includes(activityType(row)))
    || holdings.some(row => row.realizedGain !== undefined || row.unrealizedGain !== undefined);

  return {
    allocationByAssetClass: allocationBy('assetClass'),
    allocationByAccountType: allocationBy('accountType'),
    concentrationRisk: concentration,
    overlappingHoldings: [...overlap.values()]
      .filter(row => row.accountCount.size > 1 || row.holdingCount > 1)
      .map(row => ({ ...row, accountCount: row.accountCount.size })),
    income,
    byAccount: [...byAccount.values()],
    contributionProgress,
    performance: {
      realizedGains: performanceValue(explicitRealized, activities.some(row => activityType(row) === 'realizedGain')),
      unrealizedGains: performanceValue(explicitUnrealized, holdings.some(row => row.unrealizedGain !== undefined) || activities.some(row => activityType(row) === 'unrealizedGain')),
      note: hasExplicitPerformance ? 'Only explicitly labeled source activity is included.' : 'Performance is unavailable until source activity identifies gains.'
    },
    dataQuality: {
      status: holdings.length === 0 ? 'missing' : activities.length === 0 ? 'partial' : 'available',
      missing: [
        ...(holdings.some(row => !row.symbol && !row.ticker) ? ['security symbols'] : []),
        ...(activities.length === 0 ? ['investment activity'] : []),
        ...(!hasExplicitPerformance ? ['realized and unrealized performance data'] : []),
      ],
    },
  };
}

function contributionProgressFor(holdings, byAccount) {
  const tracked = new Map();
  holdings.forEach(row => {
    const label = row.accountType || row.type || '';
    if (!/hsa|401\s*\(?k\)?/i.test(label)) return;
    const key = /hsa/i.test(label) ? 'HSA' : '401(k)';
    const existing = tracked.get(key) || { accountType: key, contributed: 0, target: null };
    existing.contributed += number(row.contributionAmount);
    const target = row.annualContributionTarget ?? row.contributionTarget;
    if (Number.isFinite(target)) existing.target = (existing.target || 0) + target;
    tracked.set(key, existing);
  });
  return ['HSA', '401(k)'].map(accountType => {
    const row = tracked.get(accountType) || { accountType, contributed: 0, target: null };
    const transactionContributions = [...byAccount.values()]
      .filter(entry => entry.accountType === accountType)
      .reduce((total, entry) => total + entry.contributions, 0);
    row.contributed = Math.max(row.contributed, transactionContributions);
    return { ...row, progress: row.target ? row.contributed / row.target : null, status: row.target ? 'available' : 'target-missing' };
  });
}

function concentrationRisk(holdings, total) {
  if (!holdings.length || total <= 0) return { status: 'missing', largestHolding: null, largestShare: null, message: 'Add holdings with current values to assess concentration.' };
  const sorted = [...holdings].sort((a, b) => holdingValue(b) - holdingValue(a));
  const largest = sorted[0];
  return { status: 'available', largestHolding: largest.symbol || largest.ticker || largest.name || 'Unlabeled holding', largestShare: holdingValue(largest) / total, message: 'Concentration is based on current holding values; it is not a performance measure.' };
}

function performanceValue(value, available) { return { value: available ? value : null, status: available ? 'available' : 'missing' }; }
function activityType(row) { const value = String(row.type || row.subtype || row.activityType || '').replace(/[\s_-]/g, '').toLowerCase(); return value === 'realizedgain' ? 'realizedGain' : value === 'unrealizedgain' ? 'unrealizedGain' : value === 'dividend' ? 'dividend' : value === 'interest' ? 'interest' : /contribution|deposit|buy/.test(value) ? 'contribution' : /gain/.test(value) ? 'gain' : value; }
function group(items, key, mapper) { const result = new Map(); items.forEach(item => { const label = key(item); result.set(label, (result.get(label) || 0) + mapper(item)); }); return [...result].map(([label, amount]) => ({ label, amount })); }
function rows(value) { return Array.isArray(value) ? value : []; }
function number(value) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function explicitValue(value) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function holdingValue(row) { return number(row.marketValue ?? row.amount ?? row.balance ?? row.value); }
function sum(items, mapper) { return rows(items).reduce((total, item) => total + mapper(item), 0); }
