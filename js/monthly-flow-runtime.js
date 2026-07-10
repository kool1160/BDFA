/**
 * BDFA Monthly Flow runtime scaffold.
 *
 * Monthly Flow currently renders the live local bill list without adding
 * planning math or calendar placement.
 */
window.BDFA = window.BDFA || {};

let monthlyFlowSourceData;
let monthlyFlowSelectedMonth = getMonthlyFlowMonthState(new Date());
let monthlyFlowActiveWeek = getMonthlyFlowDefaultWeek();

const monthlyFlowMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const monthlyFlowBillFrequencyLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'six-months': 'Every 6 months',
  yearly: 'Yearly'
};

const monthlyFlowIncomeFrequencyLabels = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  semimonthly: 'Semimonthly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly'
};

function cloneMonthlyFlowSourceData(sourceData) {
  if (!sourceData) {
    return null;
  }

  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(sourceData);
    }

    return JSON.parse(JSON.stringify(sourceData));
  } catch {
    return null;
  }
}

function getMonthlyFlowSourceData(event) {
  if (event && event.detail) {
    return cloneMonthlyFlowSourceData(event.detail);
  }

  if (window.BDFA && typeof window.BDFA.getSourceData === 'function') {
    try {
      return cloneMonthlyFlowSourceData(window.BDFA.getSourceData());
    } catch {
      return null;
    }
  }

  return null;
}

function getMonthlyFlowBillName(bill) {
  return bill && typeof bill.name === 'string' && bill.name.trim() ? bill.name.trim() : 'Unnamed bill';
}

function getMonthlyFlowTimelineBillName(bill) {
  return bill && typeof bill.name === 'string' && bill.name.trim() ? bill.name.trim() : 'Bill';
}

function getMonthlyFlowBillRawAmount(bill) {
  const amount = Number(bill && bill.amount);

  return Number.isFinite(amount) ? amount : 0;
}

function getMonthlyFlowBillAmount(bill) {
  return monthlyFlowMoney.format(getMonthlyFlowBillRawAmount(bill));
}

function getMonthlyFlowBillFrequencyLabel(bill) {
  if (!bill || typeof bill.frequency !== 'string' || !bill.frequency.trim()) {
    return 'Frequency not set';
  }

  return monthlyFlowBillFrequencyLabels[bill.frequency] || bill.frequency.trim();
}

function getMonthlyFlowBillDueDay(bill) {
  const dueDay = Number(bill && bill.dueDay);

  return Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31 ? dueDay : null;
}

function getMonthlyFlowSortedBills(bills) {
  return bills.slice().sort((firstBill, secondBill) => {
    const firstDueDay = getMonthlyFlowBillDueDay(firstBill);
    const secondDueDay = getMonthlyFlowBillDueDay(secondBill);

    if (firstDueDay === null && secondDueDay === null) {
      return 0;
    }

    if (firstDueDay === null) {
      return 1;
    }

    if (secondDueDay === null) {
      return -1;
    }

    return firstDueDay - secondDueDay;
  });
}

function getMonthlyFlowBillMonthlyAmount(bill) {
  const amount = getMonthlyFlowBillRawAmount(bill);
  const frequency = bill && typeof bill.frequency === 'string' ? bill.frequency : '';

  if (frequency === 'quarterly') {
    return amount / 3;
  }

  if (frequency === 'six-months') {
    return amount / 6;
  }

  if (frequency === 'yearly') {
    return amount / 12;
  }

  return amount;
}

function getMonthlyFlowBillsEstimate(bills) {
  return bills.reduce((total, bill) => total + getMonthlyFlowBillMonthlyAmount(bill), 0);
}

function getMonthlyFlowCurrentDay() {
  const today = new Date();

  return today.getDate();
}

function getMonthlyFlowCurrentMonthKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  return `${today.getFullYear()}-${month}`;
}

function getMonthlyFlowMonthState(date) {
  const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = safeDate.getFullYear();
  const monthIndex = safeDate.getMonth();
  const month = String(monthIndex + 1).padStart(2, '0');

  return {
    year,
    monthIndex,
    key: `${year}-${month}`
  };
}

function getMonthlyFlowSelectedMonthDate(day) {
  return new Date(monthlyFlowSelectedMonth.year, monthlyFlowSelectedMonth.monthIndex, day || 1);
}

function getMonthlyFlowDaysInSelectedMonth() {
  return new Date(monthlyFlowSelectedMonth.year, monthlyFlowSelectedMonth.monthIndex + 1, 0).getDate();
}

function isMonthlyFlowSelectedMonthCurrent() {
  return monthlyFlowSelectedMonth.key === getMonthlyFlowCurrentMonthKey();
}

function isMonthlyFlowSelectedMonthPast() {
  return monthlyFlowSelectedMonth.key < getMonthlyFlowCurrentMonthKey();
}

function getMonthlyFlowMonthLabel() {
  return getMonthlyFlowSelectedMonthDate(1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

function getMonthlyFlowMonthShortLabel() {
  return getMonthlyFlowSelectedMonthDate(1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}

function getMonthlyFlowMonthName() {
  return getMonthlyFlowSelectedMonthDate(1).toLocaleDateString('en-US', {
    month: 'long'
  });
}

function getMonthlyFlowSelectedMonthContextPhrase() {
  return isMonthlyFlowSelectedMonthCurrent() ? 'this month' : getMonthlyFlowMonthName();
}

function getMonthlyFlowWeekRanges() {
  const daysInMonth = getMonthlyFlowDaysInSelectedMonth();
  const ranges = [];

  for (let startDay = 1; startDay <= daysInMonth; startDay += 7) {
    ranges.push({
      week: ranges.length + 1,
      startDay,
      endDay: Math.min(startDay + 6, daysInMonth)
    });
  }

  return ranges;
}

function getMonthlyFlowDefaultWeek() {
  if (!isMonthlyFlowSelectedMonthCurrent()) {
    return 1;
  }

  const currentDay = getMonthlyFlowCurrentDay();
  const matchingWeek = getMonthlyFlowWeekRanges().find(week => currentDay >= week.startDay && currentDay <= week.endDay);

  return matchingWeek ? matchingWeek.week : 1;
}

function resetMonthlyFlowActiveWeek() {
  monthlyFlowActiveWeek = getMonthlyFlowDefaultWeek();
}

function isMonthlyFlowBillRelevantForSelectedMonth(bill) {
  const dueDay = getMonthlyFlowBillDueDay(bill);

  if (dueDay === null || isMonthlyFlowSelectedMonthPast()) {
    return false;
  }

  return !isMonthlyFlowSelectedMonthCurrent() || dueDay >= getMonthlyFlowCurrentDay();
}

function getMonthlyFlowRemainingBillsThisMonth(bills) {
  return bills.reduce((summary, bill) => {
    if (isMonthlyFlowBillRelevantForSelectedMonth(bill)) {
      summary.count += 1;
      summary.total += getMonthlyFlowBillRawAmount(bill);
    }

    return summary;
  }, { count: 0, total: 0 });
}

function getMonthlyFlowNextBillDue(bills) {
  return bills.reduce((nextBill, bill) => {
    const dueDay = getMonthlyFlowBillDueDay(bill);

    if (dueDay === null || !isMonthlyFlowBillRelevantForSelectedMonth(bill)) {
      return nextBill;
    }

    if (!nextBill || dueDay < nextBill.dueDay) {
      return { bill, dueDay };
    }

    return nextBill;
  }, null);
}

function renderMonthlyFlowRemainingBillsSummary(bills) {
  const countTarget = document.getElementById('monthlyFlowRemainingBillsCount');
  const totalTarget = document.getElementById('monthlyFlowRemainingBillsTotal');
  const summary = getMonthlyFlowRemainingBillsThisMonth(bills);

  if (countTarget) {
    const contextPhrase = getMonthlyFlowSelectedMonthContextPhrase();
    countTarget.textContent = `Remaining ${isMonthlyFlowSelectedMonthCurrent() ? contextPhrase : `in ${contextPhrase}`}: ${summary.count} ${summary.count === 1 ? 'bill' : 'bills'}`;
  }

  if (totalTarget) {
    const totalLabel = isMonthlyFlowSelectedMonthCurrent() ? 'Remaining bill total' : `${getMonthlyFlowMonthName()} bill total`;
    totalTarget.textContent = `${totalLabel}: ${monthlyFlowMoney.format(summary.total)}`;
  }

  return summary;
}

function renderMonthlyFlowNextBillDue(bills) {
  const labelTarget = document.getElementById('monthlyFlowNextBillLabel');
  const detailsTarget = document.getElementById('monthlyFlowNextBillDetails');
  const nextBillDue = getMonthlyFlowNextBillDue(bills);

  if (!labelTarget && !detailsTarget) {
    return;
  }

  if (!nextBillDue) {
    if (labelTarget) {
      labelTarget.textContent = isMonthlyFlowSelectedMonthCurrent()
        ? 'Next bill due: None this month'
        : `Next bill in ${getMonthlyFlowMonthName()}: None`;
    }

    if (detailsTarget) {
      detailsTarget.textContent = isMonthlyFlowSelectedMonthCurrent()
        ? 'No remaining dated bills'
        : `No future dated bills for ${getMonthlyFlowMonthName()}`;
    }

    return;
  }

  if (labelTarget) {
    labelTarget.textContent = isMonthlyFlowSelectedMonthCurrent()
      ? `Next bill due: ${getMonthlyFlowBillName(nextBillDue.bill)}`
      : `Next bill in ${getMonthlyFlowMonthName()}: ${getMonthlyFlowBillName(nextBillDue.bill)}`;
  }

  if (detailsTarget) {
    detailsTarget.textContent = `Due ${nextBillDue.dueDay} · ${getMonthlyFlowBillAmount(nextBillDue.bill)}`;
  }
}

function getMonthlyFlowAccountRawAmount(account) {
  const amount = Number(account && (account.balance ?? account.amount ?? account.currentBalance));

  return Number.isFinite(amount) ? amount : 0;
}

function getMonthlyFlowAccountType(account) {
  return account && typeof account.type === 'string' ? account.type.trim().toLowerCase() : '';
}

function isMonthlyFlowCashAccount(account) {
  const type = getMonthlyFlowAccountType(account);
  const name = account && typeof account.name === 'string' ? account.name.trim().toLowerCase() : '';
  const detail = account && typeof account.detail === 'string' ? account.detail.trim().toLowerCase() : '';
  const cashAccountTypes = ['checking', 'savings', 'cash'];
  const excludedTerms = [
    'credit card',
    'credit-card',
    'debt',
    'loan',
    'mortgage',
    'investment',
    'investments',
    'brokerage',
    'retirement'
  ];
  const accountDescriptor = `${type} ${name} ${detail}`;

  if (cashAccountTypes.includes(type)) {
    return true;
  }

  if (excludedTerms.some(term => accountDescriptor.includes(term))) {
    return false;
  }

  return getMonthlyFlowAccountRawAmount(account) >= 0;
}

function getMonthlyFlowCashAvailable(accounts) {
  return accounts.reduce((total, account) => (
    isMonthlyFlowCashAccount(account) ? total + getMonthlyFlowAccountRawAmount(account) : total
  ), 0);
}

function applyMonthlyFlowMoneyTone(target, amount) {
  if (!target) {
    return;
  }

  target.classList.toggle('monthly-flow-cash-negative', amount < 0);
  target.classList.toggle('money-debt', amount < 0);
  target.classList.toggle('money-positive', amount >= 0);
}

function getMonthlyFlowLowestCashPoint(cashAvailable, timelineEvents) {
  const events = Array.isArray(timelineEvents) ? timelineEvents : [];

  return events.reduce((lowestPoint, timelineEvent) => {
    const balanceAfterEvent = Number(timelineEvent && timelineEvent.balanceAfterEvent);

    if (!Number.isFinite(balanceAfterEvent) || balanceAfterEvent >= lowestPoint.amount) {
      return lowestPoint;
    }

    return {
      amount: balanceAfterEvent,
      event: timelineEvent
    };
  }, { amount: Number.isFinite(cashAvailable) ? cashAvailable : 0, event: null });
}

function getMonthlyFlowLowestCashPointText(lowestPoint) {
  if (!lowestPoint || !lowestPoint.event) {
    return isMonthlyFlowSelectedMonthCurrent()
      ? 'Lowest point: starting cash'
      : `Lowest point: starting cash for ${getMonthlyFlowMonthName()}`;
  }

  const amount = Number(lowestPoint.amount);
  const event = lowestPoint.event;
  const eventName = typeof event.name === 'string' && event.name.trim()
    ? event.name.trim()
    : event.type === 'income' ? 'Income source' : 'Bill';

  return `Lowest point: ${monthlyFlowMoney.format(Number.isFinite(amount) ? amount : 0)} after ${eventName} on day ${event.day}`;
}

function renderMonthlyFlowLowestCashPointDetail(lowestPoint) {
  const target = document.getElementById('monthlyFlowLowestCashPointDetail');

  if (target) {
    target.textContent = getMonthlyFlowLowestCashPointText(lowestPoint);
  }
}

function renderMonthlyFlowCashSnapshot(accounts, estimatedMonthlyBills, projectedAfterRemainingBills, lowestProjectedCash) {
  const cashAvailableTarget = document.getElementById('monthlyFlowCashAvailable');
  const cashAfterBillsTarget = document.getElementById('monthlyFlowCashAfterBills');
  const projectedAfterRemainingBillsTarget = document.getElementById('monthlyFlowProjectedAfterRemainingBills');
  const lowestProjectedCashTarget = document.getElementById('monthlyFlowLowestProjectedCash');
  const cashStatusTarget = document.getElementById('monthlyFlowCashStatus');
  const cashAvailable = getMonthlyFlowCashAvailable(accounts);
  const cashAfterBills = cashAvailable - estimatedMonthlyBills;

  if (cashAvailableTarget) {
    cashAvailableTarget.textContent = monthlyFlowMoney.format(cashAvailable);
  }

  if (cashAfterBillsTarget) {
    cashAfterBillsTarget.textContent = monthlyFlowMoney.format(cashAfterBills);
    applyMonthlyFlowMoneyTone(cashAfterBillsTarget, cashAfterBills);
  }

  if (projectedAfterRemainingBillsTarget) {
    projectedAfterRemainingBillsTarget.textContent = monthlyFlowMoney.format(projectedAfterRemainingBills);
    applyMonthlyFlowMoneyTone(projectedAfterRemainingBillsTarget, projectedAfterRemainingBills);
  }

  if (lowestProjectedCashTarget) {
    lowestProjectedCashTarget.textContent = monthlyFlowMoney.format(lowestProjectedCash);
    applyMonthlyFlowMoneyTone(lowestProjectedCashTarget, lowestProjectedCash);
  }

  if (cashStatusTarget) {
    const isCashStatusNegative = lowestProjectedCash < 0;

    cashStatusTarget.textContent = isCashStatusNegative ? 'Cash dips below $0' : 'On track';
    cashStatusTarget.classList.toggle('monthly-flow-cash-status-negative', isCashStatusNegative);
    cashStatusTarget.classList.toggle('monthly-flow-cash-status-safe', !isCashStatusNegative);
  }
}


function renderMonthlyFlowBillSummary(bills) {
  const countTarget = document.getElementById('monthlyFlowBillsCount');
  const estimateTarget = document.getElementById('monthlyFlowBillsEstimate');
  const estimatedMonthlyBills = getMonthlyFlowBillsEstimate(bills);

  if (countTarget) {
    const billCount = bills.length;
    countTarget.textContent = `${billCount} ${billCount === 1 ? 'bill' : 'bills'}`;
  }

  if (estimateTarget) {
    estimateTarget.textContent = `Estimated monthly bills: ${monthlyFlowMoney.format(estimatedMonthlyBills)}`;
  }

  return estimatedMonthlyBills;
}

function getMonthlyFlowBillMeta(bill) {
  const meta = [getMonthlyFlowBillFrequencyLabel(bill)];
  const dueDay = getMonthlyFlowBillDueDay(bill);

  meta.push(dueDay === null ? 'Due day not set' : `Due ${dueDay}`);

  return meta.join(' · ');
}

function renderMonthlyFlowEmptyState(target) {
  const emptyState = document.createElement('p');

  emptyState.className = 'monthly-flow-bills-empty';
  emptyState.textContent = 'No bills added yet.';
  target.replaceChildren(emptyState);
}

function renderMonthlyFlowBills(target, billRows) {
  const fragment = document.createDocumentFragment();

  billRows.forEach(billRowData => {
    const bill = billRowData.bill;
    const projectedAfterBill = billRowData.projectedAfterBill;
    const billRow = document.createElement('div');
    const billCopy = document.createElement('div');
    const billName = document.createElement('strong');
    const billMeta = document.createElement('span');
    const billAmount = document.createElement('span');
    const projectedBalance = document.createElement('span');

    billRow.className = 'monthly-flow-bill-row';
    billCopy.className = 'monthly-flow-bill-copy';
    billAmount.className = 'monthly-flow-bill-amount';

    billName.textContent = getMonthlyFlowBillName(bill);
    billMeta.textContent = getMonthlyFlowBillMeta(bill);
    billAmount.textContent = getMonthlyFlowBillAmount(bill);

    billCopy.append(billName, billMeta);

    if (projectedAfterBill !== null) {
      projectedBalance.className = 'monthly-flow-bill-projected';
      projectedBalance.textContent = `Projected after bill: ${monthlyFlowMoney.format(projectedAfterBill)}`;
      applyMonthlyFlowMoneyTone(projectedBalance, projectedAfterBill);
      billCopy.append(projectedBalance);
    }
    billRow.append(billCopy, billAmount);
    fragment.append(billRow);
  });

  target.replaceChildren(fragment);
}

function getMonthlyFlowIncomeName(income) {
  return income && typeof income.name === 'string' && income.name.trim() ? income.name.trim() : 'Income source';
}

function getMonthlyFlowIncomeRawAmount(income) {
  const amount = Number(income && income.amount);

  return Number.isFinite(amount) ? amount : 0;
}

function getMonthlyFlowIncomeAmount(income) {
  return monthlyFlowMoney.format(getMonthlyFlowIncomeRawAmount(income));
}

function getMonthlyFlowIncomeFrequencyLabel(income) {
  const frequency = income && typeof income.frequency === 'string' ? income.frequency.trim().toLowerCase() : '';

  return monthlyFlowIncomeFrequencyLabels[frequency] || 'Monthly';
}

function getMonthlyFlowIncomePayDay(income) {
  const nextPayDay = income && income.nextPayDay;

  if (typeof nextPayDay === 'number' || typeof nextPayDay === 'string') {
    const dayText = String(nextPayDay).trim();
    const numericDay = Number(dayText);

    if (/^\d{1,2}$/.test(dayText) && Number.isInteger(numericDay) && numericDay >= 1 && numericDay <= 31) {
      return numericDay;
    }

    const dateMatch = dayText.match(/^\d{4}-\d{2}-(\d{2})(?:$|T)/);

    if (dateMatch) {
      const dateDay = Number(dateMatch[1]);

      if (Number.isInteger(dateDay) && dateDay >= 1 && dateDay <= 31) {
        return dateDay;
      }
    }
  }

  return null;
}

function getMonthlyFlowIncomePayDayForSelectedMonth(income) {
  const nextPayDay = income && income.nextPayDay;

  if (isMonthlyFlowSelectedMonthPast()) {
    return null;
  }

  if (typeof nextPayDay === 'string') {
    const dayText = nextPayDay.trim();
    const dateMatch = dayText.match(/^(\d{4}-\d{2})-(\d{2})(?:$|T)/);

    if (dateMatch && dateMatch[1] !== monthlyFlowSelectedMonth.key) {
      return null;
    }
  }

  const payDay = getMonthlyFlowIncomePayDay(income);

  if (payDay === null) {
    return null;
  }

  if (isMonthlyFlowSelectedMonthCurrent() && payDay < getMonthlyFlowCurrentDay()) {
    return null;
  }

  return payDay;
}

function getMonthlyFlowSortedIncome(recurringIncome) {
  return recurringIncome.slice().sort((firstIncome, secondIncome) => {
    const firstPayDay = getMonthlyFlowIncomePayDay(firstIncome);
    const secondPayDay = getMonthlyFlowIncomePayDay(secondIncome);

    if (firstPayDay === null && secondPayDay === null) {
      return 0;
    }

    if (firstPayDay === null) {
      return 1;
    }

    if (secondPayDay === null) {
      return -1;
    }

    return firstPayDay - secondPayDay;
  });
}

function getMonthlyFlowIncomeMeta(income) {
  const frequency = getMonthlyFlowIncomeFrequencyLabel(income);
  const payDay = getMonthlyFlowIncomePayDay(income);

  return `${frequency} · ${payDay === null ? 'Pay day not set' : `Due ${payDay}`}`;
}

function createMonthlyFlowTimeline(bills, recurringIncome, cashAvailable) {
  const sortedBills = getMonthlyFlowSortedBills(Array.isArray(bills) ? bills : []);
  const sortedIncome = getMonthlyFlowSortedIncome(Array.isArray(recurringIncome) ? recurringIncome : []);
  const billRows = sortedBills.map(bill => ({ bill, projectedAfterBill: null }));
  const incomeRows = sortedIncome.map(income => ({ income, projectedAfterIncome: null }));
  const timelineEvents = [];

  billRows.forEach((billRowData, index) => {
    const dueDay = getMonthlyFlowBillDueDay(billRowData.bill);

    if (dueDay !== null && isMonthlyFlowBillRelevantForSelectedMonth(billRowData.bill)) {
      timelineEvents.push({
        day: dueDay,
        type: 'bill',
        sortOrder: 1,
        index,
        amount: getMonthlyFlowBillRawAmount(billRowData.bill),
        name: getMonthlyFlowTimelineBillName(billRowData.bill)
      });
    }
  });

  incomeRows.forEach((incomeRowData, index) => {
    const payDay = getMonthlyFlowIncomePayDayForSelectedMonth(incomeRowData.income);

    if (payDay !== null) {
      timelineEvents.push({
        day: payDay,
        type: 'income',
        sortOrder: 0,
        index,
        amount: getMonthlyFlowIncomeRawAmount(incomeRowData.income),
        name: getMonthlyFlowIncomeName(incomeRowData.income)
      });
    }
  });

  timelineEvents.sort((firstEvent, secondEvent) => {
    if (firstEvent.day !== secondEvent.day) {
      return firstEvent.day - secondEvent.day;
    }

    if (firstEvent.sortOrder !== secondEvent.sortOrder) {
      return firstEvent.sortOrder - secondEvent.sortOrder;
    }

    return firstEvent.index - secondEvent.index;
  });

  let runningBalance = Number.isFinite(cashAvailable) ? cashAvailable : 0;
  let lowestProjectedCash = runningBalance;

  timelineEvents.forEach(timelineEvent => {
    if (timelineEvent.type === 'income') {
      runningBalance += timelineEvent.amount;
      incomeRows[timelineEvent.index].projectedAfterIncome = runningBalance;
    } else {
      runningBalance -= timelineEvent.amount;
      billRows[timelineEvent.index].projectedAfterBill = runningBalance;
    }

    timelineEvent.balanceAfterEvent = runningBalance;
    lowestProjectedCash = Math.min(lowestProjectedCash, runningBalance);
  });

  return {
    billRows,
    incomeRows,
    timelineEvents,
    projectedAfterRemainingBills: runningBalance,
    lowestProjectedCash
  };
}

function createMonthlyFlowTimelineRow(timelineEvent, isLowestPoint) {
  const row = document.createElement('div');
  const details = document.createElement('div');
  const eventLine = document.createElement('span');
  const balanceLine = document.createElement('span');
  const amount = document.createElement('span');
  const label = document.createElement('span');
  const typeLabel = timelineEvent.type === 'income' ? 'Income' : 'Bill';
  const signedAmount = timelineEvent.type === 'income' ? timelineEvent.amount : -timelineEvent.amount;

  row.className = `monthly-flow-timeline-row monthly-flow-timeline-row-${timelineEvent.type}`;
  row.classList.toggle('monthly-flow-timeline-row-lowest', Boolean(isLowestPoint));
  details.className = 'monthly-flow-timeline-details';
  eventLine.className = 'monthly-flow-timeline-event-line';
  balanceLine.className = 'monthly-flow-timeline-balance-line';
  amount.className = 'monthly-flow-timeline-amount';
  label.className = 'monthly-flow-timeline-lowest-label';

  eventLine.textContent = `Day ${timelineEvent.day} · ${typeLabel} · ${timelineEvent.name}`;
  balanceLine.textContent = `Balance ${monthlyFlowMoney.format(timelineEvent.balanceAfterEvent)} · `;
  amount.textContent = `${signedAmount >= 0 ? '+' : '-'}${monthlyFlowMoney.format(Math.abs(signedAmount))}`;
  amount.classList.toggle('monthly-flow-timeline-amount-income', timelineEvent.type === 'income');
  amount.classList.toggle('monthly-flow-timeline-amount-bill', timelineEvent.type === 'bill');
  applyMonthlyFlowMoneyTone(balanceLine, timelineEvent.balanceAfterEvent);
  balanceLine.append(amount);
  details.append(eventLine, balanceLine);

  if (isLowestPoint) {
    label.textContent = 'Lowest point';
    details.append(label);
  }

  row.append(details);

  return row;
}

function getMonthlyFlowCashTimelineEmptyText() {
  if (isMonthlyFlowSelectedMonthCurrent()) {
    return 'No upcoming cash events this month.';
  }

  if (isMonthlyFlowSelectedMonthPast()) {
    return `No future cash events for ${getMonthlyFlowMonthName()}.`;
  }

  return `No cash events scheduled for ${getMonthlyFlowMonthName()}.`;
}

function renderMonthlyFlowCashTimeline(cashAvailable, timelineEvents, lowestPoint) {
  const target = document.getElementById('monthlyFlowCashTimeline');

  if (!target) {
    return;
  }

  const events = Array.isArray(timelineEvents) ? timelineEvents : [];
  const fragment = document.createDocumentFragment();
  const startingRow = document.createElement('div');
  const startingLabel = document.createElement('span');
  const startingAmount = document.createElement('strong');

  startingRow.className = 'monthly-flow-timeline-starting-row';
  startingLabel.textContent = 'Starting cash:';
  startingAmount.textContent = monthlyFlowMoney.format(cashAvailable);
  applyMonthlyFlowMoneyTone(startingAmount, cashAvailable);
  startingRow.append(startingLabel, startingAmount);
  fragment.append(startingRow);

  if (!events.length) {
    const emptyState = document.createElement('p');

    emptyState.className = 'monthly-flow-timeline-empty';
    emptyState.textContent = getMonthlyFlowCashTimelineEmptyText();
    fragment.append(emptyState);
  } else {
    events.forEach(timelineEvent => {
      const isLowestPoint = Boolean(lowestPoint && lowestPoint.event === timelineEvent);

      fragment.append(createMonthlyFlowTimelineRow(timelineEvent, isLowestPoint));
    });
  }

  target.replaceChildren(fragment);
}

function renderMonthlyFlowIncomeEmptyState(target) {
  const emptyState = document.createElement('p');

  emptyState.className = 'monthly-flow-income-empty';
  emptyState.textContent = 'No recurring income added yet.';
  target.replaceChildren(emptyState);
}

function renderMonthlyFlowIncome(incomeRows) {
  const target = document.getElementById('monthlyFlowIncomeList');
  const incomeEntries = Array.isArray(incomeRows) ? incomeRows : [];

  if (!target) {
    return;
  }

  if (!incomeEntries.length) {
    renderMonthlyFlowIncomeEmptyState(target);
    return;
  }

  const fragment = document.createDocumentFragment();

  incomeEntries.forEach(incomeRowData => {
    const income = incomeRowData.income;
    const projectedAfterIncome = incomeRowData.projectedAfterIncome;
    const incomeRow = document.createElement('div');
    const incomeCopy = document.createElement('div');
    const incomeName = document.createElement('strong');
    const incomeMeta = document.createElement('span');
    const incomeAmount = document.createElement('span');
    const projectedBalance = document.createElement('span');

    incomeRow.className = 'monthly-flow-income-row';
    incomeCopy.className = 'monthly-flow-income-copy';
    incomeAmount.className = 'monthly-flow-income-amount';

    incomeName.textContent = getMonthlyFlowIncomeName(income);
    incomeMeta.textContent = getMonthlyFlowIncomeMeta(income);
    incomeAmount.textContent = getMonthlyFlowIncomeAmount(income);

    incomeCopy.append(incomeName, incomeMeta);

    if (projectedAfterIncome !== null) {
      projectedBalance.className = 'monthly-flow-income-projected';
      projectedBalance.textContent = `Projected after income: ${monthlyFlowMoney.format(projectedAfterIncome)}`;
      applyMonthlyFlowMoneyTone(projectedBalance, projectedAfterIncome);
      incomeCopy.append(projectedBalance);
    }
    incomeRow.append(incomeCopy, incomeAmount);
    fragment.append(incomeRow);
  });

  target.replaceChildren(fragment);
}

function resetMonthlyFlowSelectedMonthToCurrent() {
  monthlyFlowSelectedMonth = getMonthlyFlowMonthState(new Date());
  resetMonthlyFlowActiveWeek();
  renderMonthlyFlow(monthlyFlowSourceData || { accounts: [], bills: [], recurringIncome: [] });
}

function renderMonthlyFlowMonthControls() {
  const labelTarget = document.getElementById('monthlyFlowSelectedMonthLabel');
  const currentButton = document.getElementById('monthlyFlowCurrentMonth');

  if (labelTarget) {
    labelTarget.textContent = getMonthlyFlowMonthLabel();
    labelTarget.setAttribute('aria-label', `Selected month: ${getMonthlyFlowMonthLabel()}`);
  }

  if (currentButton) {
    const isCurrentMonth = isMonthlyFlowSelectedMonthCurrent();

    currentButton.hidden = isCurrentMonth;
    currentButton.disabled = isCurrentMonth;
    currentButton.setAttribute('aria-label', `Return to current month from ${getMonthlyFlowMonthShortLabel()}`);
    currentButton.classList.toggle('is-muted', isCurrentMonth);
  }
}

function renderMonthlyFlowWeekSelector() {
  const target = document.getElementById('monthlyFlowWeeklyTimeline');

  if (!target) {
    return;
  }

  const todayDay = getMonthlyFlowCurrentDay();
  const isCurrentMonth = isMonthlyFlowSelectedMonthCurrent();
  const ranges = getMonthlyFlowWeekRanges();

  if (!ranges.some(week => week.week === monthlyFlowActiveWeek)) {
    resetMonthlyFlowActiveWeek();
  }

  const fragment = document.createDocumentFragment();

  ranges.forEach(week => {
    const weekButton = document.createElement('span');
    const containsToday = isCurrentMonth && todayDay >= week.startDay && todayDay <= week.endDay;

    weekButton.textContent = `Week ${week.week}`;
    weekButton.classList.toggle('is-selected', week.week === monthlyFlowActiveWeek);
    weekButton.classList.toggle('weekly-marker-today', containsToday);

    if (containsToday) {
      const marker = document.createElement('i');
      const todayLabel = document.createElement('em');

      marker.setAttribute('aria-hidden', 'true');
      todayLabel.textContent = 'Today';
      weekButton.append(marker, todayLabel);
    }

    weekButton.addEventListener('click', () => {
      monthlyFlowActiveWeek = week.week;
      renderMonthlyFlow(monthlyFlowSourceData || {});
    });

    fragment.append(weekButton);
  });

  target.replaceChildren(fragment);
}

function getMonthlyFlowEventsByDay(bills, recurringIncome) {
  const eventsByDay = new Map();

  getMonthlyFlowSortedBills(Array.isArray(bills) ? bills : []).forEach(bill => {
    const dueDay = getMonthlyFlowBillDueDay(bill);

    if (dueDay !== null && isMonthlyFlowBillRelevantForSelectedMonth(bill)) {
      const events = eventsByDay.get(dueDay) || [];

      events.push({ type: 'bill', name: getMonthlyFlowTimelineBillName(bill) });
      eventsByDay.set(dueDay, events);
    }
  });

  getMonthlyFlowSortedIncome(Array.isArray(recurringIncome) ? recurringIncome : []).forEach(income => {
    const payDay = getMonthlyFlowIncomePayDayForSelectedMonth(income);

    if (payDay !== null) {
      const events = eventsByDay.get(payDay) || [];

      events.push({ type: 'income', name: getMonthlyFlowIncomeName(income) });
      eventsByDay.set(payDay, events);
    }
  });

  return eventsByDay;
}

function renderMonthlyFlowDayStrip(bills, recurringIncome, timelineEvents, cashAvailable) {
  const dayTarget = document.getElementById('monthlyFlowDailyDateStrip');
  const balanceTarget = document.getElementById('monthlyFlowRunningBalanceRow');

  if (!dayTarget && !balanceTarget) {
    return;
  }

  const week = getMonthlyFlowWeekRanges().find(weekRange => weekRange.week === monthlyFlowActiveWeek) || getMonthlyFlowWeekRanges()[0];
  const eventsByDay = getMonthlyFlowEventsByDay(bills, recurringIncome);
  const timelineEventEntries = Array.isArray(timelineEvents) ? timelineEvents : [];
  let eventIndex = 0;
  let runningBalance = Number.isFinite(cashAvailable) ? cashAvailable : 0;

  const dayFragment = document.createDocumentFragment();
  const balanceFragment = document.createDocumentFragment();
  const todayDay = getMonthlyFlowCurrentDay();

  for (let day = week.startDay; day <= week.endDay; day += 1) {
    const date = getMonthlyFlowSelectedMonthDate(day);
    const dayCell = document.createElement('span');
    const dayName = document.createElement('small');
    const dayNumber = document.createElement('strong');
    const balanceChip = document.createElement('span');
    const dayEvents = eventsByDay.get(day) || [];

    while (eventIndex < timelineEventEntries.length && timelineEventEntries[eventIndex].day <= day) {
      runningBalance = timelineEventEntries[eventIndex].balanceAfterEvent;
      eventIndex += 1;
    }

    dayCell.classList.toggle('daily-date-today', isMonthlyFlowSelectedMonthCurrent() && day === todayDay);
    dayName.textContent = date.toLocaleDateString('en-US', { weekday: 'short' });
    dayNumber.textContent = String(day).padStart(2, '0');
    dayCell.append(dayName, dayNumber);

    if (dayEvents.length) {
      const eventWrapper = document.createElement('span');

      eventWrapper.className = 'day-events';
      dayEvents.forEach(event => {
        const eventMarker = document.createElement('b');

        eventMarker.className = `bill-event-marker ${event.type === 'income' ? 'income-event-marker income-event-payday' : 'bill-event-rent'}`;
        eventMarker.textContent = event.name;
        eventWrapper.append(eventMarker);
      });
      dayCell.append(eventWrapper);
    }

    balanceChip.textContent = monthlyFlowMoney.format(runningBalance);
    dayFragment.append(dayCell);
    balanceFragment.append(balanceChip);
  }

  if (dayTarget) {
    dayTarget.replaceChildren(dayFragment);
  }

  if (balanceTarget) {
    balanceTarget.replaceChildren(balanceFragment);
  }
}

function getMonthlyFlowBillCalendarHelperText() {
  if (isMonthlyFlowSelectedMonthCurrent()) {
    return 'Upcoming dated bills for this month.';
  }

  if (isMonthlyFlowSelectedMonthPast()) {
    return `No future bill events for ${getMonthlyFlowMonthName()}.`;
  }

  return `Dated bills for ${getMonthlyFlowMonthName()}.`;
}

function getMonthlyFlowBillCalendarEmptyText() {
  if (isMonthlyFlowSelectedMonthCurrent()) {
    return 'No remaining dated bills';
  }

  if (isMonthlyFlowSelectedMonthPast()) {
    return 'No future dated bills';
  }

  return `No dated bills in ${getMonthlyFlowMonthName()}`;
}

function renderMonthlyFlowBillCalendarStrip(bills) {
  const helperTarget = document.getElementById('monthlyFlowBillCalendarHelper');
  const target = document.getElementById('monthlyFlowBillDateChipList');

  if (helperTarget) {
    helperTarget.textContent = getMonthlyFlowBillCalendarHelperText();
  }

  if (!target) {
    return;
  }

  const relevantBills = getMonthlyFlowSortedBills(Array.isArray(bills) ? bills : [])
    .filter(isMonthlyFlowBillRelevantForSelectedMonth);
  const fragment = document.createDocumentFragment();

  if (!relevantBills.length) {
    const emptyChip = document.createElement('span');

    emptyChip.className = 'bill-date-chip';
    emptyChip.textContent = getMonthlyFlowBillCalendarEmptyText();
    fragment.append(emptyChip);
  } else {
    relevantBills.forEach(bill => {
      const chip = document.createElement('span');
      const day = document.createElement('strong');
      const name = document.createElement('span');

      chip.className = 'bill-date-chip';
      day.textContent = String(getMonthlyFlowBillDueDay(bill)).padStart(2, '0');
      name.textContent = getMonthlyFlowBillName(bill);
      chip.append(day, name);
      fragment.append(chip);
    });
  }

  target.replaceChildren(fragment);
}

function renderMonthlyFlow(sourceData) {
  const target = document.getElementById('monthlyFlowBillsList');
  const bills = sourceData && Array.isArray(sourceData.bills) ? sourceData.bills : [];
  const accounts = sourceData && Array.isArray(sourceData.accounts) ? sourceData.accounts : [];
  const recurringIncome = sourceData && Array.isArray(sourceData.recurringIncome) ? sourceData.recurringIncome : [];
  const estimatedMonthlyBills = renderMonthlyFlowBillSummary(bills);
  renderMonthlyFlowRemainingBillsSummary(bills);
  const cashAvailable = getMonthlyFlowCashAvailable(accounts);
  const timeline = createMonthlyFlowTimeline(bills, recurringIncome, cashAvailable);
  renderMonthlyFlowMonthControls();
  renderMonthlyFlowWeekSelector();
  renderMonthlyFlowDayStrip(bills, recurringIncome, timeline.timelineEvents, cashAvailable);
  renderMonthlyFlowBillCalendarStrip(bills);

  renderMonthlyFlowNextBillDue(bills);
  renderMonthlyFlowCashSnapshot(
    accounts,
    estimatedMonthlyBills,
    timeline.projectedAfterRemainingBills,
    timeline.lowestProjectedCash
  );
  const lowestPoint = getMonthlyFlowLowestCashPoint(cashAvailable, timeline.timelineEvents);

  renderMonthlyFlowLowestCashPointDetail(lowestPoint);
  renderMonthlyFlowCashTimeline(cashAvailable, timeline.timelineEvents, lowestPoint);
  renderMonthlyFlowIncome(timeline.incomeRows);

  if (!target) {
    return;
  }

  if (!bills.length) {
    renderMonthlyFlowEmptyState(target);
    return;
  }

  renderMonthlyFlowBills(target, timeline.billRows);
}

function refreshMonthlyFlow(event) {
  const sourceData = getMonthlyFlowSourceData(event) || { accounts: [], bills: [], recurringIncome: [] };

  monthlyFlowSourceData = sourceData;
  renderMonthlyFlow(monthlyFlowSourceData);
}

function shiftMonthlyFlowSelectedMonth(offset) {
  const nextMonthDate = new Date(monthlyFlowSelectedMonth.year, monthlyFlowSelectedMonth.monthIndex + offset, 1);

  monthlyFlowSelectedMonth = getMonthlyFlowMonthState(nextMonthDate);
  resetMonthlyFlowActiveWeek();
  renderMonthlyFlow(monthlyFlowSourceData || { accounts: [], bills: [], recurringIncome: [] });
}

function wireMonthlyFlowMonthControls() {
  const previousButton = document.getElementById('monthlyFlowPreviousMonth');
  const nextButton = document.getElementById('monthlyFlowNextMonth');
  const currentButton = document.getElementById('monthlyFlowCurrentMonth');

  if (previousButton) {
    previousButton.addEventListener('click', () => {
      shiftMonthlyFlowSelectedMonth(-1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      shiftMonthlyFlowSelectedMonth(1);
    });
  }

  if (currentButton) {
    currentButton.addEventListener('click', resetMonthlyFlowSelectedMonthToCurrent);
  }
}

window.BDFA.refreshMonthlyFlow = refreshMonthlyFlow;
window.addEventListener('bdfa:source-data-updated', refreshMonthlyFlow);
wireMonthlyFlowMonthControls();
refreshMonthlyFlow();
