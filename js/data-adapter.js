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

    return getSourceData();
  }

  window.BDFA.dataAdapter = window.BDFA.dataAdapter || {
    getSourceData,
    loadSourceData,
    saveSourceData,
    importData,
    exportData,
    resetToDemoData
  };
}());
