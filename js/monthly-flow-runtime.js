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

function getMonthlyFlowBillAmount(bill) {
  const amount = Number(bill && bill.amount);

  if (!Number.isFinite(amount)) {
    return monthlyFlowMoney.format(0);
  }

  return monthlyFlowMoney.format(amount);
}

function getMonthlyFlowBillFrequencyLabel(bill) {
  if (!bill || typeof bill.frequency !== 'string' || !bill.frequency.trim()) {
    return 'Frequency not set';
  }

  return monthlyFlowBillFrequencyLabels[bill.frequency] || bill.frequency.trim();
}

function getMonthlyFlowBillMeta(bill) {
  const meta = [getMonthlyFlowBillFrequencyLabel(bill)];
  const dueDay = Number(bill && bill.dueDay);

  if (Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31) {
    meta.push(`Due ${dueDay}`);
  }

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

  if (!target) {
    return;
  }

  const bills = sourceData && Array.isArray(sourceData.bills) ? sourceData.bills : [];

  if (!bills.length) {
    renderMonthlyFlowEmptyState(target);
    return;
  }

  renderMonthlyFlowBills(target, bills);
}

function refreshMonthlyFlow(event) {
  const sourceData = getMonthlyFlowSourceData(event) || { bills: [] };

  monthlyFlowSourceData = sourceData;
  renderMonthlyFlow(monthlyFlowSourceData);
}

window.BDFA.refreshMonthlyFlow = refreshMonthlyFlow;
window.addEventListener('bdfa:source-data-updated', refreshMonthlyFlow);
refreshMonthlyFlow();
