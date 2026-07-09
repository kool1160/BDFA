function getAnalyticsEscapedText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getAnalyticsSafeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function getAnalyticsSafeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

function getAnalyticsBarWidth(value, maxValue) {
  if (!maxValue || maxValue <= 0) {
    return 0;
  }

  return Math.max((value / maxValue) * 100, value > 0 ? 6 : 0);
}

function getAnalyticsRatio(value, totalValue) {
  if (!totalValue || totalValue <= 0) {
    return 0;
  }

  return Math.max((value / totalValue) * 100, 0);
}

function getAnalyticsShare(value, totalValue) {
  return `${Math.round(getAnalyticsRatio(value, totalValue))}%`;
}

function getAnalyticsPercentText(value, totalValue) {
  if (!totalValue || totalValue <= 0) {
    return 'Add data';
  }

  return `${Math.round(getAnalyticsRatio(value, totalValue))}%`;
}

function getAnalyticsMonthlyIncomeAmount(income) {
  const amount = getAnalyticsSafeAmount(income.amount);

  if (income.frequency === 'weekly') {
    return amount * 52 / 12;
  }

  if (income.frequency === 'biweekly') {
    return amount * 26 / 12;
  }

  if (income.frequency === 'semimonthly') {
    return amount * 2;
  }

  return amount;
}

function getAnalyticsMonthlyIncomeTotal() {
  return getAnalyticsSafeRows(data.recurringIncome).reduce((sum, income) => sum + getAnalyticsMonthlyIncomeAmount(income), 0);
}

function getAnalyticsLargestByAmount(rows, amountKey = 'amount') {
  return getAnalyticsSafeRows(rows).reduce((largest, row) => {
    const amount = Math.abs(getAnalyticsSafeAmount(row[amountKey]));
    return amount > largest.amount ? { row, amount } : largest;
  }, { row: null, amount: 0 });
}

function getAnalyticsLargestMonthlyBill() {
  return getAnalyticsSafeRows(data.bills).reduce((largest, bill) => {
    const amount = getAnalyticsSafeAmount(getMonthlyBillAmount(bill));
    return amount > largest.amount ? { row: bill, amount } : largest;
  }, { row: null, amount: 0 });
}

function getAnalyticsHealthMetrics() {
  const totals = getDashboardTotals();
  const monthlyBills = getMonthlyBillsTotal();
  const monthlyIncome = getAnalyticsMonthlyIncomeTotal();
  const monthlySurplus = monthlyIncome - monthlyBills;
  const positiveNetWorth = Math.max(totals.netWorth, 0);

  return {
    ...totals,
    monthlyBills,
    monthlyIncome,
    monthlySurplus,
    billsToIncomeRatio: monthlyIncome > 0 ? monthlyBills / monthlyIncome : null,
    emergencyMonths: monthlyBills > 0 ? totals.cash / monthlyBills : null,
    investmentShare: positiveNetWorth > 0 ? totals.investments / positiveNetWorth : null,
    assetShare: positiveNetWorth > 0 ? totals.assets / positiveNetWorth : null
  };
}

function getAnalyticsLegendItem(label, className) {
  return `<span><i class="${className}" aria-hidden="true"></i>${getAnalyticsEscapedText(label)}</span>`;
}

function getAnalyticsLegend(rows) {
  return `<div class="analytics-legend">${rows.map(row => getAnalyticsLegendItem(row.label, row.className)).join('')}</div>`;
}

function getAnalyticsBarRow(label, amount, maxValue, className, shareText = '') {
  return `
    <div class="analytics-bar-row">
      <div class="analytics-bar-meta">
        <span>${getAnalyticsEscapedText(label)}</span>
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

  const safeRows = rows.map(row => ({ ...row, amount: getAnalyticsSafeAmount(row.amount) }));
  const maxValue = Math.max(...safeRows.map(row => row.amount), 0);
  const totalValue = safeRows.reduce((sum, row) => sum + row.amount, 0);
  const bars = safeRows.map(row => getAnalyticsBarRow(
    row.label,
    row.amount,
    maxValue,
    row.className,
    row.shareText || getAnalyticsShare(row.amount, totalValue)
  )).join('');
  const context = contextText ? `<div class="analytics-context">${contextText}</div>` : '';

  target.innerHTML = `${getAnalyticsLegend(safeRows)}<div class="analytics-bar-list">${bars}</div>${context}`;
}

function renderAnalyticsSnapshot(metrics) {
  const target = document.getElementById('analyticsSnapshotGrid');

  if (!target) {
    return;
  }

  const cards = [
    { label: 'Net Worth', value: money.format(metrics.netWorth), detail: 'Cash + investments + assets minus debt.', tone: 'aurora' },
    { label: 'Liquid Cash', value: money.format(metrics.cash), detail: 'Tracked cash accounts available for planning.', tone: 'mint' },
    { label: 'Monthly Income', value: metrics.monthlyIncome ? money.format(metrics.monthlyIncome) : 'Add income', detail: 'Recurring income converted to monthly impact.', tone: 'blue' },
    { label: 'Monthly Bills', value: metrics.monthlyBills ? money.format(metrics.monthlyBills) : 'Add bills', detail: 'Recurring bills normalized to monthly pressure.', tone: 'gold' },
    { label: 'Monthly Surplus / Shortfall', value: metrics.monthlyIncome ? money.format(metrics.monthlySurplus) : 'Add income', detail: metrics.monthlyIncome ? 'Income minus recurring bills.' : 'Add recurring income for this insight.', tone: metrics.monthlySurplus >= 0 ? 'mint' : 'coral' },
    { label: 'Bills-to-Income Ratio', value: metrics.billsToIncomeRatio === null ? 'Add income' : `${Math.round(metrics.billsToIncomeRatio * 100)}%`, detail: metrics.billsToIncomeRatio === null ? 'Add income to compare bill pressure.' : 'Lower means more room for goals.', tone: 'purple' },
    { label: 'Emergency Fund Coverage', value: metrics.emergencyMonths === null ? 'Add bills' : `${metrics.emergencyMonths.toFixed(1)} mo`, detail: metrics.emergencyMonths === null ? 'Add bills to measure cash runway.' : 'Liquid cash divided by monthly bills.', tone: 'teal' },
    { label: 'Investment Share', value: metrics.investmentShare === null ? 'Add net worth' : `${Math.round(metrics.investmentShare * 100)}%`, detail: 'Investments as a share of tracked net worth.', tone: 'blue' },
    { label: 'Asset Share', value: metrics.assetShare === null ? 'Add assets' : `${Math.round(metrics.assetShare * 100)}%`, detail: metrics.assets ? 'Manual assets as a share of net worth.' : 'Add assets to make net worth more complete.', tone: 'violet' }
  ];

  target.innerHTML = cards.map(card => `
    <article class="analytics-snapshot-card ${card.tone}">
      <span>${card.label}</span>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
    </article>
  `).join('');
}

function renderAnalyticsInsights(metrics) {
  const target = document.getElementById('analyticsInsightGrid');

  if (!target) {
    return;
  }

  const largestBill = getAnalyticsLargestMonthlyBill();
  const highestAccount = getAnalyticsLargestByAmount(data.accounts);
  const insights = [
    metrics.emergencyMonths === null ? 'Add recurring bills to see how many months your cash could cover.' : `You have enough liquid cash to cover ${metrics.emergencyMonths.toFixed(1)} months of recurring bills.`,
    metrics.billsToIncomeRatio === null ? 'Add recurring income to understand how much of income bills use.' : `Bills currently use ${Math.round(metrics.billsToIncomeRatio * 100)}% of recurring monthly income.`,
    metrics.investmentShare === null ? 'Add positive net worth data to see your investment share.' : `Investments represent ${Math.round(metrics.investmentShare * 100)}% of tracked net worth.`,
    largestBill.row ? `Your largest recurring bill is ${getAnalyticsEscapedText(largestBill.row.name || 'Unnamed bill')} at ${money.format(largestBill.amount)}/mo.` : 'Add bills to identify your largest recurring commitment.',
    highestAccount.row ? `Your highest-value account is ${getAnalyticsEscapedText(highestAccount.row.name || 'Unnamed account')} at ${money.format(highestAccount.amount)}.` : 'Add accounts to identify where your largest cash or debt balance sits.',
    metrics.assetShare === null || !metrics.assets ? 'Add assets such as a home or vehicle to improve net worth tracking.' : `Tracked assets make up ${Math.round(metrics.assetShare * 100)}% of total net worth.`
  ];

  target.innerHTML = insights.map((insight, index) => `
    <article class="analytics-insight-card">
      <span>Insight ${index + 1}</span>
      <p>${insight}</p>
    </article>
  `).join('');
}

function getAnalyticsBreakdownRows(kind) {
  if (kind === 'accounts') {
    return getAnalyticsSafeRows(data.accounts).map(account => ({ label: account.name || 'Account', detail: account.type || 'Account', amount: Math.abs(getAnalyticsSafeAmount(account.amount)), className: account.amount < 0 ? 'analytics-debt' : 'analytics-positive' }));
  }

  if (kind === 'bills') {
    return getAnalyticsSafeRows(data.bills).map(bill => ({ label: bill.name || 'Bill', detail: 'Monthly impact', amount: getMonthlyBillAmount(bill), className: 'analytics-caution' }));
  }

  if (kind === 'income') {
    return getAnalyticsSafeRows(data.recurringIncome).map(income => ({ label: income.name || 'Income', detail: getRecurringIncomeFrequencyLabel(income.frequency), amount: getAnalyticsMonthlyIncomeAmount(income), className: 'analytics-positive' }));
  }

  if (kind === 'assets') {
    return getAnalyticsSafeRows(data.assets).map(asset => ({ label: asset.name || 'Asset', detail: asset.type || 'Asset', amount: getAnalyticsSafeAmount(asset.value), className: 'analytics-growth' }));
  }

  return getAnalyticsSafeRows(data.investments).map(investment => ({ label: investment.name || 'Investment', detail: investment.detail || 'Investment', amount: getAnalyticsSafeAmount(investment.amount), className: 'analytics-growth' }));
}

function getAnalyticsBreakdownCard(title, emptyTitle, emptyCopy, rows) {
  const safeRows = rows.filter(row => row.amount > 0);

  if (!safeRows.length) {
    return `
      <article class="analytics-breakdown-card">
        <strong>${title}</strong>
        <div class="analytics-empty"><b>${emptyTitle}</b><br>${emptyCopy}</div>
      </article>
    `;
  }

  const totalValue = safeRows.reduce((sum, row) => sum + row.amount, 0);
  const maxValue = Math.max(...safeRows.map(row => row.amount), 0);
  const strips = safeRows.map(row => `<span class="${row.className}" style="width: ${getAnalyticsShare(row.amount, totalValue)}"></span>`).join('');
  const list = safeRows.map(row => `
    <div class="analytics-mini-row">
      <div>
        <span>${getAnalyticsEscapedText(row.label)}</span>
        <small>${getAnalyticsEscapedText(row.detail)}</small>
      </div>
      <strong>${money.format(row.amount)}</strong>
      <div class="analytics-bar-track" aria-hidden="true"><span class="${row.className}" style="width: ${getAnalyticsBarWidth(row.amount, maxValue)}%"></span></div>
    </div>
  `).join('');

  return `
    <article class="analytics-breakdown-card">
      <div class="analytics-breakdown-heading"><strong>${title}</strong><span>${money.format(totalValue)}</span></div>
      <div class="analytics-strip" aria-hidden="true">${strips}</div>
      <div class="analytics-mini-list">${list}</div>
    </article>
  `;
}

function renderAnalyticsBreakdowns() {
  const target = document.getElementById('analyticsBreakdownGrid');

  if (!target) {
    return;
  }

  target.innerHTML = [
    getAnalyticsBreakdownCard('Cash/accounts breakdown', 'No accounts yet', 'Add accounts to see where cash and balances live.', getAnalyticsBreakdownRows('accounts')),
    getAnalyticsBreakdownCard('Bills breakdown', 'No bills yet', 'Add bills to understand recurring monthly pressure.', getAnalyticsBreakdownRows('bills')),
    getAnalyticsBreakdownCard('Income breakdown', 'No income yet', 'Add recurring income for surplus and ratio insights.', getAnalyticsBreakdownRows('income')),
    getAnalyticsBreakdownCard('Assets breakdown', 'No assets yet', 'Assets can make net worth tracking more complete.', getAnalyticsBreakdownRows('assets')),
    getAnalyticsBreakdownCard('Investments breakdown', 'No investments yet', 'Add investments to see how they support tracked net worth.', getAnalyticsBreakdownRows('investments'))
  ].join('');
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
      <span>${getAnalyticsEscapedText(row.label)}</span>
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

function getBillTimingBuckets() {
  return [
    { label: 'Week 1', detail: 'Days 1–7', min: 1, max: 7, amount: 0 },
    { label: 'Week 2', detail: 'Days 8–14', min: 8, max: 14, amount: 0 },
    { label: 'Week 3', detail: 'Days 15–21', min: 15, max: 21, amount: 0 },
    { label: 'Week 4+', detail: 'Days 22–31', min: 22, max: 31, amount: 0 }
  ];
}

function renderBillTimingPressureChart() {
  const target = document.getElementById('billTimingPressureChart');

  if (!target) {
    return;
  }

  const buckets = getBillTimingBuckets();
  const datedBills = data.bills.filter(hasBillDueDay);

  if (!datedBills.length) {
    target.innerHTML = '<div class="analytics-empty">Add bill due days to see monthly timing pressure.</div>';
    return;
  }

  datedBills.forEach(bill => {
    const bucket = buckets.find(item => bill.dueDay >= item.min && bill.dueDay <= item.max);

    if (bucket) {
      bucket.amount += getMonthlyBillAmount(bill);
    }
  });

  const maxValue = Math.max(...buckets.map(bucket => bucket.amount), 0);
  const rows = buckets.map(bucket => `
    <div class="timing-pressure-column">
      <div class="timing-pressure-track" aria-hidden="true">
        <span style="height: ${getAnalyticsBarWidth(bucket.amount, maxValue)}%"></span>
      </div>
      <strong>${bucket.label}</strong>
      <small>${bucket.detail}</small>
      <em>${money.format(bucket.amount)}</em>
    </div>
  `).join('');

  target.innerHTML = `
    <div class="analytics-legend">
      ${getAnalyticsLegendItem('Monthly bill pressure', 'analytics-caution')}
    </div>
    <div class="timing-pressure-grid">${rows}</div>
    <div class="analytics-context">Only bills with due days are included in this timing view.</div>
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
          <span>${getAnalyticsEscapedText(allocation.name)}</span>
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
  const metrics = getAnalyticsHealthMetrics();
  const bills = getMonthlyBillsTotal();
  const allocations = total(data.allocations);
  const available = Math.max(totals.availableToAllocate, 0);

  renderAnalyticsSnapshot(metrics);
  renderAnalyticsInsights(metrics);
  renderAnalyticsBreakdowns();

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
  renderBillTimingPressureChart();
}

const baseRenderDashboardTotalsForAnalytics = renderDashboardTotals;

renderDashboardTotals = function renderDashboardTotalsWithAnalytics() {
  baseRenderDashboardTotalsForAnalytics();
  renderAnalytics();
};

renderAnalytics();
