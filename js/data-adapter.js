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
  const preCloudRestoreBackupKey = 'bdfa.preCloudRestoreBackup';

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

  function validateSourceSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return { valid: false, data: null };
    }

    const sourceData = {};

    for (const collection of sourceCollections) {
      if (snapshot[collection] === undefined) {
        sourceData[collection] = [];
      } else if (Array.isArray(snapshot[collection])) {
        sourceData[collection] = clone(snapshot[collection]);
      } else {
        return { valid: false, data: null };
      }
    }

    return { valid: true, data: sourceData };
  }

  function dispatchSourceDataUpdated(sourceData) {
    window.dispatchEvent(new CustomEvent('bdfa:source-data-updated', {
      detail: clone(sourceData)
    }));
  }

  function getSupabaseClient() {
    return window.BDFA.supabaseClient || null;
  }

  function getPublicSourceData() {
    const sourceData = typeof window.BDFA.getSourceData === 'function' ? window.BDFA.getSourceData() : getSourceData();
    const snapshot = {};

    sourceCollections.forEach(collection => {
      snapshot[collection] = Array.isArray(sourceData[collection]) ? clone(sourceData[collection]) : [];
    });

    return snapshot;
  }

  function hasPreCloudRestoreBackup() {
    return Boolean(localStorage.getItem(preCloudRestoreBackupKey));
  }

  function createPreCloudRestoreBackup(options = {}) {
    const { preserveExistingValidBackup = false } = options;

    if (preserveExistingValidBackup && readPreCloudRestoreBackup().valid) {
      return true;
    }

    const validation = validateSourceSnapshot(getPublicSourceData());

    if (!validation.valid) {
      return false;
    }

    try {
      localStorage.setItem(preCloudRestoreBackupKey, JSON.stringify({
        createdAt: new Date().toISOString(),
        sourceData: validation.data
      }));
      return true;
    } catch {
      return false;
    }
  }

  function readPreCloudRestoreBackup() {
    const savedBackup = localStorage.getItem(preCloudRestoreBackupKey);

    if (!savedBackup) {
      return { valid: false, data: null };
    }

    try {
      const backup = JSON.parse(savedBackup);

      if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
        return { valid: false, data: null };
      }

      return validateSourceSnapshot(backup.sourceData);
    } catch {
      return { valid: false, data: null };
    }
  }

  function saveCloudSnapshot(sourceData) {
    const supabaseClient = getSupabaseClient();
    const validation = validateSourceSnapshot(sourceData);

    if (!validation.valid) {
      return Promise.resolve({ status: 'invalid' });
    }

    if (!supabaseClient || !supabaseClient.isConfigured()) {
      return Promise.resolve({ status: 'local' });
    }

    cloudSavePromise = cloudSavePromise
      .catch(() => undefined)
      .then(() => supabaseClient.saveSnapshot(validation.data))
      .catch(error => ({ status: 'failed', error }));

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

  function persistSourceData(sourceData, options = {}) {
    const { rejectInvalid = false, syncCloud = true } = options;
    const validation = validateSourceSnapshot(sourceData);

    if (!validation.valid) {
      if (rejectInvalid) {
        return null;
      }

      return getSourceData();
    }

    currentSourceData = clone(validation.data);

    sourceCollections.forEach(collection => {
      saveRows(collection, currentSourceData[collection]);
    });

    if (syncCloud) {
      saveCloudSnapshot(currentSourceData);
    }

    return getSourceData();
  }

  function saveSourceData(sourceData) {
    return persistSourceData(sourceData);
  }

  function saveLocalSourceData(sourceData) {
    return persistSourceData(sourceData, { rejectInvalid: true, syncCloud: false });
  }

  function importData(sourceData) {
    const validation = validateSourceSnapshot(sourceData);

    if (!validation.valid) {
      return getSourceData();
    }

    return saveSourceData(validation.data);
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

  async function loadCloudSnapshot(options = {}) {
    const { applySnapshot = true, saveMissingSnapshot = true } = options;
    const supabaseClient = getSupabaseClient();

    if (!supabaseClient || !supabaseClient.isConfigured()) {
      return { status: 'local', data: getSourceData() };
    }

    const result = await supabaseClient.loadSnapshot();

    if (result.data) {
      const validation = validateSourceSnapshot(result.data);

      if (!validation.valid) {
        return { status: 'invalid', data: getSourceData(), error: null };
      }

      const cloudSourceData = validation.data;

      if (!applySnapshot) {
        return { status: result.status, data: cloudSourceData, error: null };
      }

      if (!createPreCloudRestoreBackup({ preserveExistingValidBackup: true })) {
        return { status: 'backup-failed', data: getSourceData(), error: null };
      }

      if (!saveLocalSourceData(cloudSourceData)) {
        return { status: 'invalid', data: getSourceData(), error: null };
      }

      dispatchSourceDataUpdated(currentSourceData);
      return { status: result.status, data: getSourceData(), error: null };
    }

    if (result.status === 'missing' && saveMissingSnapshot) {
      const saveResult = await saveCloudSnapshot(getPublicSourceData());

      if (saveResult.status === 'saved') {
        return { status: 'saved-initial', data: getSourceData(), error: null };
      }

      if (saveResult.status === 'failed') {
        return { status: 'initial-save-failed', data: getSourceData(), error: saveResult.error };
      }
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
    getPublicSourceData,
    validateSourceSnapshot,
    hasPreCloudRestoreBackup,
    createPreCloudRestoreBackup,
    readPreCloudRestoreBackup,
    saveLocalSourceData,
    saveCloudSnapshot,
    loadCloudSnapshot
  };
}());
