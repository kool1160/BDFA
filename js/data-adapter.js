(function () {
  'use strict';

  window.BDFA = window.BDFA || {};

  const notWiredMessage = 'BDFA data adapter is not wired yet.';

  function notWired() {
    throw new Error(notWiredMessage);
  }

  /*
   * BDFA source-data adapter scaffold.
   *
   * This file defines the future persistence seam only. It is intentionally
   * not loaded by the app yet and must not change current runtime behavior.
   * Future wiring should move persistence behind this adapter without placing
   * localStorage, backend, auth, or API details directly in UI handlers.
   *
   * getSourceData should eventually return the complete source-data snapshot:
   *
   * - accounts
   * - bills
   * - allocations
   * - investments
   * - recurringIncome
   * - assets
   *
   * Consumers should receive a complete source-data snapshot, not partial
   * records or one collection at a time.
   *
   * Future adapter wiring must preserve the current public runtime contracts:
   *
   * - window.BDFA.getSourceData()
   * - bdfa:source-data-updated
   * - event.detail is the direct source snapshot
   *
   * The update event detail must remain event.detail, not
   * event.detail.sourceData.
   */
  const dataAdapter = {
    getSourceData: notWired,
    saveAccount: notWired,
    deleteAccount: notWired,
    saveBill: notWired,
    deleteBill: notWired,
    saveRecurringIncome: notWired,
    deleteRecurringIncome: notWired,
    saveInvestment: notWired,
    deleteInvestment: notWired,
    saveAsset: notWired,
    deleteAsset: notWired,
    saveAllocation: notWired,
    deleteAllocation: notWired,
    importData: notWired,
    exportData: notWired
  };

  window.BDFA.dataAdapter = window.BDFA.dataAdapter || dataAdapter;
}());
