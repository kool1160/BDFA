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

function getMonthlyFlowRemainingBillsThisMonth(bills) {
  const currentDay = getMonthlyFlowCurrentDay();

  return bills.reduce((summary, bill) => {
    const dueDay = getMonthlyFlowBillDueDay(bill);

    if (dueDay !== null && dueDay >= currentDay) {
      summary.count += 1;
      summary.total += getMonthlyFlowBillRawAmount(bill);
    }

    return summary;
  }, { count: 0, total: 0 });
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

function renderMonthlyFlowCashSnapshot(accounts, estimatedMonthlyBills) {
  const cashAvailableTarget = document.getElementById('monthlyFlowCashAvailable');
  const cashAfterBillsTarget = document.getElementById('monthlyFlowCashAfterBills');
  const cashAvailable = getMonthlyFlowCashAvailable(accounts);
  const cashAfterBills = cashAvailable - estimatedMonthlyBills;

  if (cashAvailableTarget) {
    cashAvailableTarget.textContent = monthlyFlowMoney.format(cashAvailable);
  }

  if (cashAfterBillsTarget) {
    cashAfterBillsTarget.textContent = monthlyFlowMoney.format(cashAfterBills);
    cashAfterBillsTarget.classList.toggle('monthly-flow-cash-negative', cashAfterBills < 0);
    cashAfterBillsTarget.classList.toggle('money-debt', cashAfterBills < 0);
    cashAfterBillsTarget.classList.toggle('money-positive', cashAfterBills >= 0);
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

function renderMonthlyFlowBills(target, bills) {
  const fragment = document.createDocumentFragment();

  bills.forEach(bill => {
    const billRow = document.createElement('div');
    const billCopy = document.createElement('div');
    const billName = document.createElement('strong');
    const billMeta = document.createElement('span');
    const billAmount = document.createElement('span');

    billRow.className = 'monthly-flow-bill-row';
    billCopy.className = 'monthly-flow-bill-copy';
    billAmount.className = 'monthly-flow-bill-amount';

    billName.textContent = getMonthlyFlowBillName(bill);
    billMeta.textContent = getMonthlyFlowBillMeta(bill);
    billAmount.textContent = getMonthlyFlowBillAmount(bill);

    billCopy.append(billName, billMeta);
    billRow.append(billCopy, billAmount);
    fragment.append(billRow);
  });

  target.replaceChildren(fragment);
}

function renderMonthlyFlow(sourceData) {
  const target = document.getElementById('monthlyFlowBillsList');
  const bills = sourceData && Array.isArray(sourceData.bills) ? sourceData.bills : [];
  const accounts = sourceData && Array.isArray(sourceData.accounts) ? sourceData.accounts : [];
  const estimatedMonthlyBills = renderMonthlyFlowBillSummary(bills);

  renderMonthlyFlowRemainingBillsSummary(bills);
  renderMonthlyFlowCashSnapshot(accounts, estimatedMonthlyBills);

  if (!target) {
    return;
  }

  if (!bills.length) {
    renderMonthlyFlowEmptyState(target);
    return;
  }

  renderMonthlyFlowBills(target, getMonthlyFlowSortedBills(bills));
}

function refreshMonthlyFlow(event) {
  const sourceData = getMonthlyFlowSourceData(event) || { accounts: [], bills: [] };

  monthlyFlowSourceData = sourceData;
  renderMonthlyFlow(monthlyFlowSourceData);
}

window.BDFA.refreshMonthlyFlow = refreshMonthlyFlow;
window.addEventListener('bdfa:source-data-updated', refreshMonthlyFlow);
refreshMonthlyFlow();
