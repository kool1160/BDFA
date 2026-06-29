function getAnalyticsBarWidth(value, maxValue) {
  if (!maxValue || maxValue <= 0) {
    return 0;
  }

  return Math.max((value / maxValue) * 100, value > 0 ? 6 : 0);
}

function getAnalyticsShare(value, totalValue) {
  if (!totalValue || totalValue <= 0) {
    return '0%';
  }

  return `${Math.round((value / totalValue) * 100)}%`;
}

function getAnalyticsLegendItem(label, className) {
  return `<span><i class="${className}" aria-hidden="true"></i>${label}</span>`;
}

function getAnalyticsLegend(rows) {
  return `<div class="analytics-legend">${rows.map(row => getAnalyticsLegendItem(row.label, row.className)).join('')}</div>`;
}

function getAnalyticsBarRow(label, amount, maxValue, className, shareText = '') {
  return `
    <div class="analytics-bar-row">
      <div class="analytics-bar-meta">
        <span>${label}</span>
        <strong>${money.format(amount)}${shareText ? `<em>${shareText}</em>` : ''}</strong>
      </div>
      <div class="analytics-bar-track" aria-hidden="true">
        <span class="${className}" style="width: ${getAnalyticsBarWidth(amount, maxValue)}%"></span>
      </div>
    </div>
  `;
}

function renderAnalyticsBars(targetId, rows, contextText = '') {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const maxValue = Math.max(...rows.map(row => row.amount), 0);
  const totalValue = rows.reduce((sum, row) => sum + row.amount, 0);
  const bars = rows.map(row => getAnalyticsBarRow(
    row.label,
    row.amount,
    maxValue,
    row.className,
    row.shareText || getAnalyticsShare(row.amount, totalValue)
  )).join('');
  const context = contextText ? `<div class="analytics-context">${contextText}</div>` : '';

  target.innerHTML = `${getAnalyticsLegend(rows)}<div class="analytics-bar-list">${bars}</div>${context}`;
}

function renderDistributionChart(totals) {
  const target = document.getElementById('distributionChart');

  if (!target) {
    return;
  }

  const rows = [
    { label: 'Cash', amount: totals.cash, className: 'analytics-positive' },
    { label: 'Investments', amount: totals.investments, className: 'analytics-growth' },
    { label: 'Debt', amount: totals.debt, className: 'analytics-debt' }
  ];
  const totalValue = rows.reduce((sum, row) => sum + row.amount, 0);
  const segments = rows.map(row => `
    <span class="${row.className}" style="width: ${getAnalyticsShare(row.amount, totalValue)}" title="${row.label}: ${getAnalyticsShare(row.amount, totalValue)}"></span>
  `).join('');
  const details = rows.map(row => `
    <div class="distribution-detail">
      <span>${row.label}</span>
      <strong>${getAnalyticsShare(row.amount, totalValue)}</strong>
    </div>
  `).join('');

  target.innerHTML = `
    ${getAnalyticsLegend(rows)}
    <div class="distribution-bar" aria-hidden="true">${segments}</div>
    <div class="distribution-details">${details}</div>
    <div class="analytics-context">A stacked view of the same money mix for quicker comparison.</div>
  `;
}

function renderAllocationTargetOverview() {
  const target = document.getElementById('allocationProgressChart');

  if (!target) {
    return;
  }

  const targetedAllocations = data.allocations.filter(hasAllocationTarget);

  if (!targetedAllocations.length) {
    target.innerHTML = '<div class="analytics-empty">Add allocation targets to see progress here.</div>';
    return;
  }

  const completedCount = targetedAllocations.filter(allocation => allocation.amount >= allocation.targetAmount).length;
  const rows = targetedAllocations.map(allocation => {
    const percent = Math.min(Math.max((allocation.amount / allocation.targetAmount) * 100, 0), 100);
    const remaining = Math.max(allocation.targetAmount - allocation.amount, 0);
    const detailText = percent >= 100 ? 'Complete' : `${money.format(remaining)} left`;

    return `
      <div class="analytics-bar-row">
        <div class="analytics-bar-meta">
          <span>${allocation.name}</span>
          <strong>${Math.round(percent)}%<em>${detailText}</em></strong>
        </div>
        <div class="analytics-bar-track" aria-hidden="true">
          <span class="${percent >= 100 ? 'analytics-positive' : 'analytics-caution'}" style="width: ${Math.max(percent, 6)}%"></span>
        </div>
      </div>
    `;
  }).join('');

  target.innerHTML = `
    <div class="analytics-legend">
      ${getAnalyticsLegendItem('In progress', 'analytics-caution')}
      ${getAnalyticsLegendItem('Complete', 'analytics-positive')}
    </div>
    <div class="analytics-bar-list">${rows}</div>
    <div class="analytics-context">${completedCount} of ${targetedAllocations.length} targeted allocations complete.</div>
  `;
}

function renderAnalytics() {
  const totals = getDashboardTotals();
  const bills = getMonthlyBillsTotal();
  const allocations = total(data.allocations);
  const available = Math.max(totals.availableToAllocate, 0);

  renderAnalyticsBars('moneyMixChart', [
    { label: 'Cash', amount: totals.cash, className: 'analytics-positive' },
    { label: 'Investments', amount: totals.investments, className: 'analytics-growth' },
    { label: 'Debt', amount: totals.debt, className: 'analytics-debt' }
  ], `Debt is shown as ${money.format(totals.debt)} for visual comparison.`);

  renderAnalyticsBars('monthlyFlowChart', [
    { label: 'Bills', amount: bills, className: 'analytics-caution' },
    { label: 'Allocations', amount: allocations, className: 'analytics-caution' },
    { label: 'Available', amount: available, className: 'analytics-positive' }
  ], `${money.format(available)} remains available after current bills and allocations.`);

  renderAllocationTargetOverview();
  renderDistributionChart(totals);
}

const baseRenderDashboardTotalsForAnalytics = renderDashboardTotals;

renderDashboardTotals = function renderDashboardTotalsWithAnalytics() {
  baseRenderDashboardTotalsForAnalytics();
  renderAnalytics();
};

renderAnalytics();
