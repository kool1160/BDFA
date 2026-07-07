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

  const requiredSourceCollections = ['accounts', 'bills', 'allocations', 'investments'];
  const optionalSourceCollections = ['assets', 'recurringIncome'];
  const sourceCollections = [...requiredSourceCollections, ...optionalSourceCollections];
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

    for (const collection of requiredSourceCollections) {
      if (!Array.isArray(snapshot[collection])) {
        return { valid: false, data: null };
      }

      sourceData[collection] = clone(snapshot[collection]);
    }

    for (const collection of optionalSourceCollections) {
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

  function dispatchCloudStatus(message, tone = 'neutral') {
    window.dispatchEvent(new CustomEvent('bdfa:supabase-status-changed', {
      detail: { message, tone }
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
    return readPreCloudRestoreBackup().valid;
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

      const validation = validateSourceSnapshot(backup.sourceData);

      if (!validation.valid) {
        return { valid: false, data: null, createdAt: null };
      }

      return { valid: true, data: validation.data, createdAt: backup.createdAt || null };
    } catch {
      return { valid: false, data: null, createdAt: null };
    }
  }

  function getPreCloudRestoreBackupCreatedAt() {
    const backup = readPreCloudRestoreBackup();
    return backup.valid ? backup.createdAt : null;
  }

  function getRowsTotal(rows) {
    return rows.reduce((sum, row) => {
      const amount = Number(row && row.amount);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  }

  function summarizeSourceSnapshot(snapshot) {
    const validation = validateSourceSnapshot(snapshot);

    if (!validation.valid) {
      return { valid: false, summary: null };
    }

    const sourceData = validation.data;

    return {
      valid: true,
      summary: {
        accountCount: sourceData.accounts.length,
        billCount: sourceData.bills.length,
        allocationCount: sourceData.allocations.length,
        investmentCount: sourceData.investments.length,
        recurringIncomeCount: sourceData.recurringIncome.length,
        assetCount: sourceData.assets.length,
        accountsAmount: getRowsTotal(sourceData.accounts)
      }
    };
  }

  function compareSourceSnapshots(localSnapshot, cloudSnapshot) {
    const localValidation = validateSourceSnapshot(localSnapshot);
    const cloudValidation = validateSourceSnapshot(cloudSnapshot);

    if (!localValidation.valid || !cloudValidation.valid) {
      return { valid: false, comparison: null };
    }

    const localSummaryResult = summarizeSourceSnapshot(localValidation.data);
    const cloudSummaryResult = summarizeSourceSnapshot(cloudValidation.data);

    if (!localSummaryResult.valid || !cloudSummaryResult.valid) {
      return { valid: false, comparison: null };
    }

    const localSummary = localSummaryResult.summary;
    const cloudSummary = cloudSummaryResult.summary;

    return {
      valid: true,
      comparison: {
        accountCount: cloudSummary.accountCount - localSummary.accountCount,
        billCount: cloudSummary.billCount - localSummary.billCount,
        allocationCount: cloudSummary.allocationCount - localSummary.allocationCount,
        investmentCount: cloudSummary.investmentCount - localSummary.investmentCount,
        recurringIncomeCount: cloudSummary.recurringIncomeCount - localSummary.recurringIncomeCount,
        assetCount: cloudSummary.assetCount - localSummary.assetCount,
        accountsAmount: cloudSummary.accountsAmount - localSummary.accountsAmount
      }
    };
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
        dispatchCloudStatus('Cloud snapshot is invalid. Local data was kept.', 'error');
        return { status: 'invalid', data: getSourceData(), error: null };
      }

      const cloudSourceData = validation.data;

      if (!applySnapshot) {
        return { status: result.status, data: cloudSourceData, updatedAt: result.updatedAt || null, error: null };
      }

      if (!createPreCloudRestoreBackup({ preserveExistingValidBackup: true })) {
        return { status: 'backup-failed', data: getSourceData(), error: null };
      }

      if (!saveLocalSourceData(cloudSourceData)) {
        dispatchCloudStatus('Cloud snapshot is invalid. Local data was kept.', 'error');
        return { status: 'invalid', data: getSourceData(), error: null };
      }

      dispatchSourceDataUpdated(currentSourceData);
      return { status: result.status, data: getSourceData(), updatedAt: result.updatedAt || null, error: null };
    }

    if (result.status === 'missing' && saveMissingSnapshot) {
      const saveResult = await saveCloudSnapshot(getPublicSourceData());

      if (saveResult.status === 'saved') {
        return { status: 'saved-initial', data: getSourceData(), updatedAt: saveResult.updatedAt || null, error: null };
      }

      if (saveResult.status === 'failed') {
        return { status: 'initial-save-failed', data: getSourceData(), updatedAt: saveResult.updatedAt || null, error: saveResult.error };
      }
    }

    return { status: result.status, data: getSourceData(), updatedAt: result.updatedAt || null, error: result.error };
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
    getPreCloudRestoreBackupCreatedAt,
    summarizeSourceSnapshot,
    compareSourceSnapshots,
    saveLocalSourceData,
    saveCloudSnapshot,
    loadCloudSnapshot
  };
}());
