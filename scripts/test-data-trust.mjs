import assert from 'node:assert/strict';
import { evaluateDataTrust, metricAudit } from '../js/data-trust.js';

const now = Date.parse('2026-07-15T12:00:00.000Z');
const complete = evaluateDataTrust({
  accounts: [{ id: 'cash', updatedAt: '2026-07-15T11:30:00.000Z' }],
  investments: [{ id: 'investments' }],
  bills: [{ id: 'bill' }],
}, { sourceTimestamp: '2026-07-15T11:30:00.000Z' }, now);

assert.equal(complete.confidence, 'complete');
assert.equal(complete.totalRecords, 3);
assert.match(complete.freshness, /last hour/i);
assert.match(metricAudit('Net worth', ['accounts', 'investments'], complete), /1 accounts, 1 investments/);

const stale = evaluateDataTrust({
  accounts: [{ id: 'cash' }],
}, { sourceTimestamp: '2026-07-12T12:00:00.000Z' }, now);
assert.equal(stale.confidence, 'stale');
assert.match(stale.warning, /Refresh/);

const manual = evaluateDataTrust({
  accounts: [{ id: 'cash', source: 'manual' }],
}, {}, now);
assert.equal(manual.confidence, 'manual-only');

const missing = evaluateDataTrust({}, {}, now);
assert.equal(missing.confidence, 'missing');
assert.match(missing.warning, /No source records/);

console.log('Data trust representative checks passed.');
