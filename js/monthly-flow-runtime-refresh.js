/**
 * BDFA Monthly Flow runtime scaffold.
 *
 * Monthly Flow remains visually static for now. This file only establishes the
 * refresh path that future Monthly Flow rendering can use when source data
 * changes.
 */
window.BDFA = window.BDFA || {};

let monthlyFlowSourceData;

function getMonthlyFlowSourceData(event) {
  if (event && event.detail) {
    return structuredClone(event.detail);
  }

  if (typeof window.BDFA.getSourceData === 'function') {
    return window.BDFA.getSourceData();
  }

  return null;
}

function renderMonthlyFlow(sourceData) {
  void sourceData;
}

function refreshMonthlyFlow(event) {
  const sourceData = getMonthlyFlowSourceData(event);

  if (!sourceData) {
    return;
  }

  monthlyFlowSourceData = sourceData;
  renderMonthlyFlow(monthlyFlowSourceData);
}

window.BDFA.refreshMonthlyFlow = refreshMonthlyFlow;
window.addEventListener('bdfa:source-data-updated', refreshMonthlyFlow);
refreshMonthlyFlow();
