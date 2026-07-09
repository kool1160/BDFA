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

  return Math.min(Math.max((value / totalValue) * 100, 0), 100);
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

function getAnalyticsBoundedPercent(value) {
  const percent = Number(value);

  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.min(Math.max(percent, 0), 100);
}

function getAnalyticsScoreStatus(score) {
  if (score === null) {
    return 'Needs more data';
  }

  if (score >= 80) {
    return 'Strong';
  }

  if (score >= 60) {
    return 'Steady';
  }

  if (score >= 40) {
    return 'Building';
  }

  return 'Getting started';
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
  const grossTrackedValue = totals.cash + totals.investments + totals.assets;
  const accounts = getAnalyticsSafeRows(data.accounts);
  const bills = getAnalyticsSafeRows(data.bills);
  const recurringIncome = getAnalyticsSafeRows(data.recurringIncome);
  const assets = getAnalyticsSafeRows(data.assets);
  const investments = getAnalyticsSafeRows(data.investments);
  const allocations = getAnalyticsSafeRows(data.allocations);

  return {
    ...totals,
    monthlyBills,
    monthlyIncome,
    monthlySurplus,
    billsToIncomeRatio: monthlyIncome > 0 ? monthlyBills / monthlyIncome : null,
    emergencyMonths: monthlyBills > 0 ? totals.cash / monthlyBills : null,
    grossTrackedValue,
    cashShare: grossTrackedValue > 0 ? totals.cash / grossTrackedValue : null,
    investmentShare: grossTrackedValue > 0 ? totals.investments / grossTrackedValue : null,
    assetShare: grossTrackedValue > 0 ? totals.assets / grossTrackedValue : null,
    counts: {
      accounts: accounts.length,
      bills: bills.length,
      recurringIncome: recurringIncome.length,
      assets: assets.length,
      investments: investments.length,
      allocations: allocations.length
    },
    billDueDayCount: bills.filter(hasBillDueDay).length
  };
}

function getAnalyticsScoreComponent(label, score, explanation, className) {
  return {
    label,
    score: score === null ? null : getAnalyticsBoundedPercent(score),
    explanation,
    className
  };
}

function getAnalyticsFinancialHealthScore(metrics) {
  const hasIncome = metrics.monthlyIncome > 0;
  const hasBills = metrics.monthlyBills > 0;
  const hasAccounts = metrics.counts.accounts > 0;
  const hasTrackedValue = metrics.grossTrackedValue > 0;
  const dataPoints = [
    hasAccounts,
    hasBills,
    hasIncome,
    metrics.counts.assets > 0,
    metrics.counts.investments > 0,
    metrics.counts.allocations > 0
  ];
  const dataCompletenessScore = Math.round((dataPoints.filter(Boolean).length / dataPoints.length) * 100);
  const cashScore = !hasBills
    ? (hasAccounts ? 50 : null)
    : Math.min((Math.max(metrics.emergencyMonths, 0) / 6) * 100, 100);
  const billPressureScore = !hasIncome
    ? null
    : Math.max(100 - (Math.max(metrics.billsToIncomeRatio, 0) * 100), 0);
  const surplusScore = !hasIncome
    ? null
    : metrics.monthlySurplus >= 0
      ? Math.min(60 + (metrics.monthlySurplus / Math.max(metrics.monthlyIncome, 1)) * 80, 100)
      : Math.max(40 + (metrics.monthlySurplus / Math.max(metrics.monthlyBills, 1)) * 40, 0);
  const investmentScore = !hasTrackedValue
    ? null
    : Math.min((Math.max(metrics.investmentShare || 0, 0) / 0.25) * 100, 100);
  const assetScore = metrics.counts.assets > 0 ? 100 : (hasTrackedValue ? 45 : null);
  const debtScore = metrics.debt <= 0
    ? 100
    : Math.max(100 - getAnalyticsRatio(metrics.debt, metrics.grossTrackedValue + metrics.debt), 0);
  const components = [
    getAnalyticsScoreComponent('Cash Coverage', cashScore, hasBills ? 'Liquid cash compared with monthly recurring bills.' : 'Add bills to measure cash runway more clearly.', 'analytics-positive'),
    getAnalyticsScoreComponent('Bill Pressure', billPressureScore, hasIncome ? 'Monthly bills compared with recurring income.' : 'Add recurring income to compare bill pressure.', 'analytics-caution'),
    getAnalyticsScoreComponent('Monthly Surplus', surplusScore, hasIncome ? 'Recurring income minus recurring bills.' : 'Add recurring income to see monthly cushion.', metrics.monthlySurplus >= 0 ? 'analytics-positive' : 'analytics-debt'),
    getAnalyticsScoreComponent('Investments', investmentScore, hasTrackedValue ? 'Investment share of gross positive tracked value.' : 'Add accounts, assets, or investments to measure participation.', 'analytics-growth'),
    getAnalyticsScoreComponent('Assets', assetScore, metrics.counts.assets ? 'Manual assets are included in tracked holdings.' : 'Add assets to improve net worth tracking.', 'analytics-growth'),
    getAnalyticsScoreComponent('Debt Pressure', debtScore, metrics.debt ? 'Debt compared with total tracked value before debt.' : 'No tracked debt pressure from accounts.', 'analytics-debt'),
    getAnalyticsScoreComponent('Data Completeness', dataCompletenessScore, 'How many source-data areas currently have entries.', 'analytics-positive')
  ];
  const scorable = components.filter(component => component.score !== null);
  const enoughData = hasIncome && hasBills && (hasAccounts || hasTrackedValue);
  const score = enoughData && scorable.length
    ? Math.round(scorable.reduce((sum, component) => sum + component.score, 0) / scorable.length)
    : null;

  return {
    score,
    status: getAnalyticsScoreStatus(score),
    components,
    summary: score === null
      ? 'Add recurring income and bills to unlock a better score.'
      : score >= 80
        ? 'Your recurring income covers bills well, and cash coverage is healthy.'
        : score >= 60
          ? 'Your money picture is taking shape, with a few areas that could be strengthened.'
          : 'Add more source data and review recurring pressure to make this view more useful.'
  };
}

function renderAnalyticsHealthScore(metrics) {
  const target = document.getElementById('analyticsHealthScore');

  if (!target) {
    return;
  }

  const health = getAnalyticsFinancialHealthScore(metrics);
  const scoreText = health.score === null ? 'Needs more data' : `${health.score} / 100`;
  const ringValue = health.score === null ? 0 : health.score;

  target.innerHTML = `
    <article class="analytics-health-card">
      <div class="analytics-score-ring" style="--score: ${ringValue}%">
        <strong>${getAnalyticsEscapedText(scoreText)}</strong>
        <span>${getAnalyticsEscapedText(health.status)}</span>
      </div>
      <div>
        <span class="analytics-kicker">Runtime Financial Health Score</span>
        <h3>${getAnalyticsEscapedText(health.status)}</h3>
        <p>${getAnalyticsEscapedText(health.summary)}</p>
        <small>This score is calculated only in the browser from current source data and is not saved.</small>
      </div>
    </article>
  `;
}

function renderAnalyticsScoreBreakdown(metrics) {
  const target = document.getElementById('analyticsScoreGrid');

  if (!target) {
    return;
  }

  const health = getAnalyticsFinancialHealthScore(metrics);

  target.innerHTML = health.components.map(component => {
    const score = component.score === null ? null : Math.round(component.score);
    const width = score === null ? 0 : score;

    return `
      <article class="analytics-score-card">
        <div class="analytics-score-card-heading">
          <span>${getAnalyticsEscapedText(component.label)}</span>
          <strong>${score === null ? 'Add data' : `${score}/100`}</strong>
        </div>
        <div class="analytics-bar-track" aria-hidden="true">
          <span class="${component.className}" style="width: ${width}%"></span>
        </div>
        <p>${getAnalyticsEscapedText(component.explanation)}</p>
      </article>
    `;
  }).join('');
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
        <strong>${money.format(amount)}${shareText ? `<em>${getAnalyticsEscapedText(shareText)}</em>` : ''}</strong>
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
  const context = contextText ? `<div class="analytics-context">${getAnalyticsEscapedText(contextText)}</div>` : '';

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
    { label: 'Investment Share', value: metrics.investmentShare === null ? 'Add data' : `${Math.round(metrics.investmentShare * 100)}%`, detail: 'Investments as a share of tracked positive value.', tone: 'blue' },
    { label: 'Asset Share', value: metrics.assetShare === null ? 'Add data' : `${Math.round(metrics.assetShare * 100)}%`, detail: metrics.assets ? 'Manual assets as a share of tracked holdings.' : 'Add assets to make tracked holdings more complete.', tone: 'violet' }
  ];

  target.innerHTML = cards.map(card => `
    <article class="analytics-snapshot-card ${card.tone}">
      <span>${getAnalyticsEscapedText(card.label)}</span>
      <strong>${getAnalyticsEscapedText(card.value)}</strong>
      <p>${getAnalyticsEscapedText(card.detail)}</p>
    </article>
  `).join('');
}

function getAnalyticsLargestCashAccount() {
  const cashAccounts = getAnalyticsSafeRows(data.accounts)
    .filter(account => account.type === 'Cash' && getAnalyticsSafeAmount(account.amount) > 0);

  return getAnalyticsLargestByAmount(cashAccounts);
}

function getAnalyticsHoldingsMix(metrics) {
  if (!metrics.grossTrackedValue) {
    return '<div class="analytics-empty">Add cash accounts, assets, or investments to see where tracked positive value lives.</div>';
  }

  const rows = [
    { label: 'Cash', amount: metrics.cash, className: 'analytics-positive' },
    { label: 'Investments', amount: metrics.investments, className: 'analytics-growth' },
    { label: 'Assets', amount: metrics.assets, className: 'analytics-caution' }
  ];
  const segments = rows.map(row => `
    <span class="${row.className}" style="width: ${getAnalyticsShare(row.amount, metrics.grossTrackedValue)}"></span>
  `).join('');
  const details = rows.map(row => `
    <div class="analytics-detail-row">
      <span>${getAnalyticsEscapedText(row.label)}</span>
      <strong>${getAnalyticsShare(row.amount, metrics.grossTrackedValue)}</strong>
    </div>
  `).join('');

  return `
    <div class="analytics-strip analytics-holdings-strip" aria-hidden="true">${segments}</div>
    ${details}
  `;
}

function getAnalyticsDataNextSteps(metrics) {
  const steps = [];

  if (!metrics.counts.recurringIncome) {
    steps.push('Add recurring income to improve cash-flow insights.');
  }

  if (!metrics.counts.bills) {
    steps.push('Add bills to understand monthly pressure.');
  }

  if (!metrics.counts.assets) {
    steps.push('Add assets to improve net worth tracking.');
  }

  if (!metrics.counts.investments) {
    steps.push('Add investments to improve holdings mix.');
  }

  return steps.length ? steps : ['Your core Analytics source areas have data. Keep them updated as money changes.'];
}

function renderAnalyticsDetailPanels(metrics) {
  const target = document.getElementById('analyticsDetailGrid');

  if (!target) {
    return;
  }

  const largestBill = getAnalyticsLargestMonthlyBill();
  const highestCash = getAnalyticsLargestCashAccount();
  const dueDayText = metrics.counts.bills
    ? `${metrics.billDueDayCount} of ${metrics.counts.bills} bills`
    : 'Add bills';
  const dataRows = [
    ['Accounts', metrics.counts.accounts],
    ['Bills', metrics.counts.bills],
    ['Recurring income', metrics.counts.recurringIncome],
    ['Assets', metrics.counts.assets],
    ['Investments', metrics.counts.investments],
    ['Allocations', metrics.counts.allocations]
  ];
  const dataNextSteps = getAnalyticsDataNextSteps(metrics).map(step => `<li>${getAnalyticsEscapedText(step)}</li>`).join('');

  target.innerHTML = `
    <article class="analytics-detail-card">
      <span class="analytics-kicker">Cash Strength</span>
      <h3>${metrics.emergencyMonths === null ? 'Add bills for runway' : `${metrics.emergencyMonths.toFixed(1)} months`}</h3>
      <div class="analytics-detail-row"><span>Liquid cash</span><strong>${money.format(metrics.cash)}</strong></div>
      <div class="analytics-detail-row"><span>Monthly bills</span><strong>${money.format(metrics.monthlyBills)}</strong></div>
      <div class="analytics-detail-row"><span>Highest cash account</span><strong>${highestCash.row ? `${getAnalyticsEscapedText(highestCash.row.name || 'Unnamed account')} · ${money.format(highestCash.amount)}` : 'Add cash account'}</strong></div>
      <p>${getAnalyticsEscapedText(metrics.emergencyMonths === null ? 'Add recurring bills to turn cash into a runway estimate.' : 'Cash strength compares liquid cash with normalized monthly bills.')}</p>
    </article>
    <article class="analytics-detail-card">
      <span class="analytics-kicker">Bill Pressure</span>
      <h3>${metrics.billsToIncomeRatio === null ? 'Add income' : `${Math.round(metrics.billsToIncomeRatio * 100)}% of income`}</h3>
      <div class="analytics-detail-row"><span>Monthly bills</span><strong>${money.format(metrics.monthlyBills)}</strong></div>
      <div class="analytics-detail-row"><span>Largest monthly bill</span><strong>${largestBill.row ? `${getAnalyticsEscapedText(largestBill.row.name || 'Unnamed bill')} · ${money.format(largestBill.amount)}/mo` : 'Add bills'}</strong></div>
      <div class="analytics-detail-row"><span>Bill count</span><strong>${metrics.counts.bills}</strong></div>
      <div class="analytics-detail-row"><span>Due-day completeness</span><strong>${getAnalyticsEscapedText(dueDayText)}</strong></div>
    </article>
    <article class="analytics-detail-card">
      <span class="analytics-kicker">Income Coverage</span>
      <h3>${metrics.monthlyIncome ? money.format(metrics.monthlySurplus) : 'Add income'}</h3>
      <div class="analytics-detail-row"><span>Monthly recurring income</span><strong>${money.format(metrics.monthlyIncome)}</strong></div>
      <div class="analytics-detail-row"><span>Surplus / shortfall</span><strong>${metrics.monthlyIncome ? money.format(metrics.monthlySurplus) : 'Add income'}</strong></div>
      <div class="analytics-detail-row"><span>Income sources</span><strong>${metrics.counts.recurringIncome}</strong></div>
      <p>${getAnalyticsEscapedText(metrics.monthlyIncome ? 'Coverage compares recurring income with recurring bill pressure.' : 'Add recurring income to see whether bills are covered each month.')}</p>
    </article>
    <article class="analytics-detail-card">
      <span class="analytics-kicker">Holdings Mix</span>
      <h3>${metrics.grossTrackedValue ? money.format(metrics.grossTrackedValue) : 'Add data'}</h3>
      ${getAnalyticsHoldingsMix(metrics)}
      <p>Shares use gross positive tracked value, so debt cannot distort the mix.</p>
    </article>
    <article class="analytics-detail-card analytics-detail-card-wide">
      <span class="analytics-kicker">Data Completeness</span>
      <h3>${dataRows.filter(row => row[1] > 0).length} of ${dataRows.length} areas tracked</h3>
      <div class="analytics-count-grid">
        ${dataRows.map(row => `<div><span>${getAnalyticsEscapedText(row[0])}</span><strong>${row[1]}</strong></div>`).join('')}
      </div>
      <ul class="analytics-next-steps">${dataNextSteps}</ul>
    </article>
  `;
}

function renderAnalyticsInsights(metrics) {
  const target = document.getElementById('analyticsInsightGrid');

  if (!target) {
    return;
  }

  const largestBill = getAnalyticsLargestMonthlyBill();
  const highestAccount = getAnalyticsLargestByAmount(data.accounts);
  const largestBillName = largestBill.row ? getAnalyticsEscapedText(largestBill.row.name || 'Unnamed bill') : '';
  const highestAccountName = highestAccount.row ? getAnalyticsEscapedText(highestAccount.row.name || 'Unnamed account') : '';
  const insights = [
    metrics.emergencyMonths === null ? 'Add recurring bills to see how many months your cash could cover.' : `You have enough liquid cash to cover ${metrics.emergencyMonths.toFixed(1)} months of recurring bills.`,
    metrics.billsToIncomeRatio === null ? 'Add recurring income to understand how much of income bills use.' : `Bills currently use ${Math.round(metrics.billsToIncomeRatio * 100)}% of recurring monthly income.`,
    metrics.investmentShare === null ? 'Add cash, investments, or assets to see your investment share.' : `Investments represent ${Math.round(metrics.investmentShare * 100)}% of tracked positive value.`,
    largestBill.row ? `Your largest recurring bill is ${largestBillName} at ${money.format(largestBill.amount)}/mo.` : 'Add bills to identify your largest recurring commitment.',
    highestAccount.row ? `Your highest-value account is ${highestAccountName} at ${money.format(highestAccount.amount)}.` : 'Add accounts to identify where your largest cash or debt balance sits.',
    metrics.assetShare === null || !metrics.assets ? 'Add assets such as a home or vehicle to improve tracked holdings.' : `Tracked assets make up ${Math.round(metrics.assetShare * 100)}% of tracked holdings.`
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
        <strong>${getAnalyticsEscapedText(title)}</strong>
        <div class="analytics-empty"><b>${getAnalyticsEscapedText(emptyTitle)}</b><br>${getAnalyticsEscapedText(emptyCopy)}</div>
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
      <div class="analytics-breakdown-heading"><strong>${getAnalyticsEscapedText(title)}</strong><span>${money.format(totalValue)}</span></div>
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
    <span class="${row.className}" style="width: ${getAnalyticsShare(row.amount, totalValue)}" title="${getAnalyticsEscapedText(row.label)}: ${getAnalyticsShare(row.amount, totalValue)}"></span>
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
      <strong>${getAnalyticsEscapedText(bucket.label)}</strong>
      <small>${getAnalyticsEscapedText(bucket.detail)}</small>
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
          <strong>${Math.round(percent)}%<em>${getAnalyticsEscapedText(detailText)}</em></strong>
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

  renderAnalyticsHealthScore(metrics);
  renderAnalyticsScoreBreakdown(metrics);
  renderAnalyticsSnapshot(metrics);
  renderAnalyticsInsights(metrics);
  renderAnalyticsDetailPanels(metrics);
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
