import assert from 'node:assert/strict';
import { calculateMonthlyFlowIntelligence } from '../js/monthly-flow-intelligence.js';

const result = calculateMonthlyFlowIntelligence({
  accounts: [{ type: 'Cash', amount: 5000 }],
  bills: [{ id: 'rent', name: 'Rent', amount: 1500, frequency: 'monthly', dueDay: 20 }],
  recurringIncome: [{ name: 'Paycheck', amount: 3000, frequency: 'monthly', nextPayDay: 15 }],
  transactions: [
    { id: 'one', name: 'Streaming', merchantName: 'Stream Co', amount: -15, type: 'expense' },
    { id: 'two', name: 'Streaming', merchantName: 'Stream Co', amount: -18, type: 'expense' },
    { id: 'rent-one', name: 'Rent', merchantName: 'Rent', amount: -1550, type: 'expense' },
    { id: 'rent-two', name: 'Rent', merchantName: 'Rent', amount: -1600, type: 'expense' },
    { id: 'future-bill', name: 'Car payment', amount: -400, type: 'expense', date: '2026-07-25' },
    { id: 'unclear', name: 'Unclear item', amount: 12, type: 'other', date: '2026-07-26' },
  ],
  metadata: { quality: 'partial', connectionHealth: { status: 'stale' } },
}, { now: new Date('2026-07-10T12:00:00Z') });

assert.equal(result.recurring.monthlyFlow, 1500);
assert.equal(result.upcomingEvents.length, 3);
assert.equal(result.nearTerm.availableCashAfterObligations, 6100);
assert.equal(result.recurringCharges[0].occurrences, 2);
assert.equal(result.recurringCharges[0].averageAmount, 16.5);
assert.equal(result.billChanges[0].direction, 'increased');
assert.equal(result.billChanges[0].difference, 100);
assert.equal(result.ambiguousTransactions[0].name, 'Unclear item');
assert.ok(result.warnings.some(warning => warning.includes('incomplete')));
assert.ok(result.warnings.some(warning => warning.includes('stale')));
assert.ok(result.warnings.some(warning => warning.includes('ambiguous')));

console.log('Monthly Flow intelligence representative checks passed.');
