/**
 * BDFA Monthly Flow runtime scaffold.
 *
 * Monthly Flow currently renders the live local bill list without adding
 * planning math or calendar placement.
 */
window.BDFA = window.BDFA || {};

let monthlyFlowSourceData;

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

function isMonthlyFlowBillRemainingThisMonth(bill, currentDay) {
  const dueDay = getMonthlyFlowBillDueDay(bill);

  return dueDay !== null && dueDay >= currentDay;
}

function getMonthlyFlowRemainingBillsThisMonth(bills) {
  const currentDay = getMonthlyFlowCurrentDay();

  return bills.reduce((summary, bill) => {
    if (isMonthlyFlowBillRemainingThisMonth(bill, currentDay)) {
      summary.count += 1;
      summary.total += getMonthlyFlowBillRawAmount(bill);
    }

    return summary;
  }, { count: 0, total: 0 });
}

function getMonthlyFlowNextBillDue(bills) {
  const currentDay = getMonthlyFlowCurrentDay();

  return bills.reduce((nextBill, bill) => {
    const dueDay = getMonthlyFlowBillDueDay(bill);

    if (dueDay === null || dueDay < currentDay) {
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
    countTarget.textContent = `Remaining this month: ${summary.count} ${summary.count === 1 ? 'bill' : 'bills'}`;
  }

  if (totalTarget) {
    totalTarget.textContent = `Remaining bill total: ${monthlyFlowMoney.format(summary.total)}`;
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
      labelTarget.textContent = 'Next bill due: None this month';
    }

    if (detailsTarget) {
      detailsTarget.textContent = 'No remaining dated bills';
    }

    return;
  }

  if (labelTarget) {
    labelTarget.textContent = `Next bill due: ${getMonthlyFlowBillName(nextBillDue.bill)}`;
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

    cashStatusTarget.textContent = isCashStatusNegative ? 'Cash dips below $0' : 'Looks safe';
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

function getMonthlyFlowIncomePayDayThisMonth(income) {
  const nextPayDay = income && income.nextPayDay;

  if (typeof nextPayDay === 'string') {
    const dayText = nextPayDay.trim();
    const dateMatch = dayText.match(/^(\d{4}-\d{2})-(\d{2})(?:$|T)/);

    if (dateMatch && dateMatch[1] !== getMonthlyFlowCurrentMonthKey()) {
      return null;
    }
  }

  return getMonthlyFlowIncomePayDay(income);
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
  const currentDay = getMonthlyFlowCurrentDay();
  const sortedBills = getMonthlyFlowSortedBills(Array.isArray(bills) ? bills : []);
  const sortedIncome = getMonthlyFlowSortedIncome(Array.isArray(recurringIncome) ? recurringIncome : []);
  const billRows = sortedBills.map(bill => ({ bill, projectedAfterBill: null }));
  const incomeRows = sortedIncome.map(income => ({ income, projectedAfterIncome: null }));
  const timelineEvents = [];

  billRows.forEach((billRowData, index) => {
    const dueDay = getMonthlyFlowBillDueDay(billRowData.bill);

    if (dueDay !== null && dueDay >= currentDay) {
      timelineEvents.push({
        day: dueDay,
        type: 'bill',
        sortOrder: 1,
        index,
        amount: getMonthlyFlowBillRawAmount(billRowData.bill)
      });
    }
  });

  incomeRows.forEach((incomeRowData, index) => {
    const payDay = getMonthlyFlowIncomePayDayThisMonth(incomeRowData.income);

    if (payDay !== null && payDay >= currentDay) {
      timelineEvents.push({
        day: payDay,
        type: 'income',
        sortOrder: 0,
        index,
        amount: getMonthlyFlowIncomeRawAmount(incomeRowData.income)
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

  let runningBalance = cashAvailable;
  let lowestProjectedCash = cashAvailable;

  timelineEvents.forEach(timelineEvent => {
    if (timelineEvent.type === 'income') {
      runningBalance += timelineEvent.amount;
      incomeRows[timelineEvent.index].projectedAfterIncome = runningBalance;
    } else {
      runningBalance -= timelineEvent.amount;
      billRows[timelineEvent.index].projectedAfterBill = runningBalance;
    }

    lowestProjectedCash = Math.min(lowestProjectedCash, runningBalance);
  });

  return {
    billRows,
    incomeRows,
    projectedAfterRemainingBills: runningBalance,
    lowestProjectedCash
  };
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

function renderMonthlyFlow(sourceData) {
  const target = document.getElementById('monthlyFlowBillsList');
  const bills = sourceData && Array.isArray(sourceData.bills) ? sourceData.bills : [];
  const accounts = sourceData && Array.isArray(sourceData.accounts) ? sourceData.accounts : [];
  const recurringIncome = sourceData && Array.isArray(sourceData.recurringIncome) ? sourceData.recurringIncome : [];
  const estimatedMonthlyBills = renderMonthlyFlowBillSummary(bills);
  renderMonthlyFlowRemainingBillsSummary(bills);
  const cashAvailable = getMonthlyFlowCashAvailable(accounts);
  const timeline = createMonthlyFlowTimeline(bills, recurringIncome, cashAvailable);

  renderMonthlyFlowNextBillDue(bills);
  renderMonthlyFlowCashSnapshot(
    accounts,
    estimatedMonthlyBills,
    timeline.projectedAfterRemainingBills,
    timeline.lowestProjectedCash
  );
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

window.BDFA.refreshMonthlyFlow = refreshMonthlyFlow;
window.addEventListener('bdfa:source-data-updated', refreshMonthlyFlow);
refreshMonthlyFlow();
