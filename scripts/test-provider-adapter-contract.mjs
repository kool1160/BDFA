import assert from 'node:assert/strict';
import {
  ADAPTER_DATASETS,
  createProviderAdapter,
  createSandboxAdapter,
  normalizeAdapterSnapshot,
  redactAdapterEvent,
} from '../js/provider-adapter-contract.js';

const adapter = createSandboxAdapter();
const snapshot = await adapter.fetchSnapshot();
assert.deepEqual(Object.keys(snapshot), ADAPTER_DATASETS);
assert.equal(snapshot.accounts.length, 2);
assert.equal(normalizeAdapterSnapshot(snapshot, { providerName: 'sandbox' }).accounts[0].amount, 12000);
assert.equal(normalizeAdapterSnapshot(snapshot, { providerName: 'sandbox' }).metadata.connectionHealth.status, 'healthy');

for (const scenario of ['stale', 'partial', 'reauthentication-required', 'duplicate-records', 'disconnected']) {
  const scenarioSnapshot = await createSandboxAdapter(scenario).fetchSnapshot();
  const normalized = normalizeAdapterSnapshot(scenarioSnapshot, { providerName: 'sandbox' });
  assert.equal(normalized.metadata.connectionHealth.status, scenario);
}

const redacted = redactAdapterEvent({
  type: 'sync-failed',
  access_token: 'secret',
  nested: { clientSecret: 'secret', safe: 'visible' },
});
assert.equal(redacted.access_token, '[REDACTED]');
assert.equal(redacted.nested.clientSecret, '[REDACTED]');
assert.equal(redacted.nested.safe, 'visible');

await assert.rejects(() => adapter.fetchDataset('unsupported'), /Unsupported adapter dataset/);
assert.throws(() => createProviderAdapter({ providerName: 'real', environment: 'production', fetchDataset: () => [] }), /sandbox adapters/);

console.log('Provider adapter contract and sandbox checks passed.');
