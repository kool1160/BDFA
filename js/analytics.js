function getAnalyticsBarWidth(value, maxValue) {
  if (!maxValue || maxValue <= 0) {
    return 0;
  }

  return Math.max((value / maxValue) * 100, value > 0 ? 6 : 0);
}

function getAnalyticsBarRow(label, amount, maxValue, className) {
  return `
    <div class="analytics-bar-row">
      <div class="analytics-bar-meta">
        <span>${label}</span>
        <strong>${money.format(amount)}</strong>
      </div>
      <div class="analytics-bar-track" aria-hidden="true">
        <span class="${className}" style="width: ${getAnalyticsBarWidth(amount, maxValue)}%"></span>
      </div>
    </div>
  `;
}

function renderAnalyticsBars(targetId, rows) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const maxValue = Math.max(...rows.map(row => row.amount), 0);

  target.innerHTML = rows.map(row => getAnalyticsBarRow(row.label, row.amount, maxValue, row.className)).join('');
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

  target.innerHTML = targetedAllocations.map(allocation => {
    const percent = Math.min(Math.max((allocation.amount / allocation.targetAmount) * 100, 0), 100);

    return `
      <div class="analytics-bar-row">
        <div class="analytics-bar-meta">
          <span>${allocation.name}</span>
          <strong>${Math.round(percent)}%</strong>
        </div>
        <div class="analytics-bar-track" aria-hidden="true">
          <span class="${percent >= 100 ? 'analytics-positive' : 'analytics-caution'}" style="width: ${Math.max(percent, 6)}%"></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderAnalytics() {
  const totals = getDashboardTotals();
  const bills = getMonthlyBillsTotal();
  const allocations = total(data.allocations);

  renderAnalyticsBars('moneyMixChart', [
    { label: 'Cash', amount: totals.cash, className: 'analytics-positive' },
    { label: 'Investments', amount: totals.investments, className: 'analytics-growth' },
    { label: 'Debt', amount: totals.debt, className: 'analytics-debt' }
  ]);

  renderAnalyticsBars('monthlyFlowChart', [
    { label: 'Bills', amount: bills, className: 'analytics-caution' },
    { label: 'Allocations', amount: allocations, className: 'analytics-caution' },
    { label: 'Available', amount: Math.max(totals.availableToAllocate, 0), className: 'analytics-positive' }
  ]);

  renderAllocationTargetOverview();
}

const baseRenderDashboardTotalsForAnalytics = renderDashboardTotals;

renderDashboardTotals = function renderDashboardTotalsWithAnalytics() {
  baseRenderDashboardTotalsForAnalytics();
  renderAnalytics();
};

renderAnalytics();
