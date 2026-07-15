import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { runFinancialPipeline } from '../js/financial-engine-pipeline.js';

const values = new Map();
const context = {
  window: {},
  structuredClone: value => structuredClone(value),
  CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } },
  localStorage: {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  }
};
context.window = { BDFA: {}, dispatchEvent() {} };
vm.runInNewContext(fs.readFileSync('js/data-adapter.js', 'utf8'), context);
const adapter = context.window.BDFA.dataAdapter;
const source = {
  accounts: [{ id: 'cash', name: 'Checking', type: 'Cash', amount: 1000, accountNumber: 'never-export' }],
  bills: [], allocations: [], investments: [], recurringIncome: [], assets: [], liabilities: [], transactions: [],
  planningAssumptions: { currentAge: 40 }
};

const exported = adapter.createSourceExport(source);
assert.equal(exported.format, 'bdfa-source-export');
assert.equal(exported.sourceData.accounts[0].accountNumber, undefined);
assert.equal(adapter.analyzeSourceImport(exported, source).valid, true);
assert.equal(adapter.mergeSourceSnapshots(source, exported).accounts.length, 1);
const importedSource = adapter.unwrapSourceImport(exported).sourceData;
const derived = runFinancialPipeline(importedSource);
assert.equal(derived.financialTruth.netWorth, 1000);
assert.equal(derived.financialTruth.sourceCounts.accounts, 1);
assert.equal(adapter.createRecoveryBackup(source), true);
assert.equal(adapter.readRecoveryBackup().valid, true);
adapter.clearRecoveryBackup();
assert.equal(adapter.readRecoveryBackup().valid, false);
console.log('Source import/export recovery representative checks passed.');
