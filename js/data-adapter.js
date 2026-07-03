(function () {
  'use strict';

  window.BDFA = window.BDFA || {};

  const storageKeys = {
    accounts: 'bdfa.mockAccounts',
    bills: 'bdfa.mockBills',
    allocations: 'bdfa.mockAllocations',
    investments: 'bdfa.mockInvestments',
    assets: 'bdfa.mockAssets',
    recurringIncome: 'bdfa.mockRecurringIncome'
  };

  const sourceCollections = Object.keys(storageKeys);
  let currentSourceData = null;
  let cloudSavePromise = Promise.resolve();

  function clone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function getStoredRows(collection) {
    const storageKey = storageKeys[collection];
    const savedRows = localStorage.getItem(storageKey);

    if (!savedRows) {
      return null;
    }

    try {
      const parsedRows = JSON.parse(savedRows);

      if (Array.isArray(parsedRows)) {
        return parsedRows;
      }
    } catch {
      localStorage.removeItem(storageKey);
    }

    return null;
  }

  function saveRows(collection, rows) {
    localStorage.setItem(storageKeys[collection], JSON.stringify(clone(rows)));
  }

  function readStoredSourceData() {
    return sourceCollections.reduce((sourceData, collection) => {
      const storedRows = getStoredRows(collection);

      if (storedRows) {
        sourceData[collection] = clone(storedRows);
      }

      return sourceData;
    }, {});
  }

  function getSourceData() {
    return currentSourceData ? clone(currentSourceData) : readStoredSourceData();
  }

  function dispatchSourceDataUpdated(sourceData) {
    window.dispatchEvent(new CustomEvent('bdfa:source-data-updated', {
      detail: clone(sourceData)
    }));
  }

  function getSupabaseClient() {
    return window.BDFA.supabaseClient || null;
  }

  function saveCloudSnapshot(sourceData) {
    const supabaseClient = getSupabaseClient();

    if (!supabaseClient || !supabaseClient.isConfigured()) {
      return Promise.resolve({ status: 'local' });
    }

    cloudSavePromise = cloudSavePromise
      .catch(() => undefined)
      .then(() => supabaseClient.saveSnapshot(clone(sourceData)));

    return cloudSavePromise;
  }

  function loadSourceData(defaultSourceData) {
    const sourceData = clone(defaultSourceData);
    const storedSourceData = readStoredSourceData();

    sourceCollections.forEach(collection => {
      if (Array.isArray(storedSourceData[collection])) {
        sourceData[collection] = storedSourceData[collection];
      }
    });

    currentSourceData = clone(sourceData);

    return getSourceData();
  }

  function saveSourceData(sourceData) {
    currentSourceData = clone(sourceData);

    sourceCollections.forEach(collection => {
      if (Array.isArray(sourceData[collection])) {
        saveRows(collection, sourceData[collection]);
      }
    });

    saveCloudSnapshot(currentSourceData);

    return getSourceData();
  }

  function importData(sourceData) {
    const importSnapshot = clone(sourceData);

    sourceCollections.forEach(collection => {
      if (!Array.isArray(importSnapshot[collection])) {
        importSnapshot[collection] = [];
      }
    });

    return saveSourceData(importSnapshot);
  }

  function exportData(sourceData) {
    if (sourceData) {
      return clone(sourceData);
    }

    return getSourceData();
  }

  function resetToDemoData(demoData) {
    sourceCollections.forEach(collection => {
      localStorage.removeItem(storageKeys[collection]);
    });

    currentSourceData = clone(demoData);
    saveCloudSnapshot(currentSourceData);

    return getSourceData();
  }

  async function loadCloudSnapshot() {
    const supabaseClient = getSupabaseClient();

    if (!supabaseClient || !supabaseClient.isConfigured()) {
      return { status: 'local', data: getSourceData() };
    }

    const result = await supabaseClient.loadSnapshot();

    if (result.data) {
      saveSourceData(result.data);
      dispatchSourceDataUpdated(currentSourceData);
      return { status: result.status, data: getSourceData() };
    }

    if (result.status === 'missing') {
      await saveCloudSnapshot(getSourceData());
    }

    return { status: result.status, data: getSourceData(), error: result.error };
  }

  window.BDFA.dataAdapter = window.BDFA.dataAdapter || {
    getSourceData,
    loadSourceData,
    saveSourceData,
    importData,
    exportData,
    resetToDemoData,
    loadCloudSnapshot
  };
}());
