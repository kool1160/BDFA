import assert from 'node:assert/strict';
import { calculatePortfolioAnalytics } from '../js/portfolio-analytics.js';

const analytics = calculatePortfolioAnalytics([
  { id: 'a', accountId: 'brokerage', accountType: 'Brokerage', symbol: 'INDEX', assetClass: 'Equity', marketValue: 6000 },
  { id: 'b', accountId: 'retirement', accountType: '401(k)', symbol: 'INDEX', assetClass: 'Equity', marketValue: 4000, contributionAmount: 3000, annualContributionTarget: 6000 },
  { id: 'c', accountId: 'hsa', accountType: 'HSA', assetClass: 'Cash', marketValue: 2000, contributionAmount: 1000, annualContributionTarget: 2000 },
], [
  { accountId: 'brokerage', type: 'dividend', amount: 40 },
  { accountId: 'brokerage', type: 'interest', amount: 5 },
  { accountId: 'retirement', type: 'contribution', amount: 1000 },
  { accountId: 'retirement', type: 'realizedGain', amount: 125 },
]);

assert.deepEqual(analytics.allocationByAssetClass, [{ label: 'Equity', amount: 10000 }, { label: 'Cash', amount: 2000 }]);
assert.deepEqual(analytics.allocationByAccountType, [{ label: 'Brokerage', amount: 6000 }, { label: '401(k)', amount: 4000 }, { label: 'HSA', amount: 2000 }]);
assert.equal(analytics.overlappingHoldings[0].symbol, 'INDEX');
assert.equal(analytics.income.total, 45);
assert.equal(analytics.performance.realizedGains.value, 125);
assert.equal(analytics.performance.unrealizedGains.status, 'missing');
assert.equal(analytics.contributionProgress.find(row => row.accountType === '401(k)').progress, 4 / 6);
assert.equal(analytics.contributionProgress.find(row => row.accountType === 'HSA').progress, 0.5);
assert.equal(analytics.byAccount.find(row => row.label === 'retirement').contributions, 4000);

const missing = calculatePortfolioAnalytics([{ name: 'Unlabeled', amount: 100 }], []);
assert.equal(missing.dataQuality.status, 'partial');
assert.equal(missing.performance.realizedGains.status, 'missing');
assert.ok(missing.dataQuality.missing.includes('security symbols'));
console.log('Portfolio analytics representative checks passed.');
