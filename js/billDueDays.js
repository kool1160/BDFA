function hasBillDueDay(bill) {
  return Number.isInteger(bill.dueDay) && bill.dueDay >= 1 && bill.dueDay <= 31;
}

function getBillDueDayText(bill) {
  return hasBillDueDay(bill) ? ` · Due day ${bill.dueDay}` : '';
}

function getBillDueStatus(bill) {
  if (!hasBillDueDay(bill)) {
    return { className: '', label: '', group: 'no-due-day', groupLabel: 'No Due Day' };
  }

  const currentDay = new Date().getDate();
  const daysUntilDue = bill.dueDay - currentDay;

  if (daysUntilDue < 0) {
    return { className: 'past-due', label: 'Past due', group: 'past-due', groupLabel: 'Past Due' };
  }

  if (daysUntilDue <= 3) {
    return { className: 'due-soon', label: daysUntilDue === 0 ? 'Due today' : 'Due soon', group: 'due-soon', groupLabel: 'Due Soon' };
  }

  return { className: '', label: '', group: 'upcoming', groupLabel: 'Upcoming' };
}

function getBillDueStatusBadge(bill) {
  const status = getBillDueStatus(bill);

  if (!status.label) {
    return '';
  }

  return `<span class="bill-status-badge">${status.label}</span>`;
}

function getBillTimingLabel(status, previousGroup) {
  if (status.group === previousGroup) {
    return '';
  }

  return `<div class="bill-group-label">${status.groupLabel}</div>`;
}

function getSortedBillsForDisplay() {
  return [...data.bills].sort((firstBill, secondBill) => {
    const firstHasDueDay = hasBillDueDay(firstBill);
    const secondHasDueDay = hasBillDueDay(secondBill);

    if (firstHasDueDay && secondHasDueDay) {
      return firstBill.dueDay - secondBill.dueDay;
    }

    if (firstHasDueDay) {
      return -1;
    }

    if (secondHasDueDay) {
      return 1;
    }

    return 0;
  });
}

function getNextDueBill() {
  const currentDay = new Date().getDate();

  return data.bills
    .filter(hasBillDueDay)
    .map(bill => ({ bill, daysUntilDue: bill.dueDay - currentDay }))
    .filter(item => item.daysUntilDue >= 0)
    .sort((firstItem, secondItem) => firstItem.daysUntilDue - secondItem.daysUntilDue)[0]?.bill || null;
}

function renderNextDueBillHelper() {
  const target = document.getElementById('billsNextDue');

  if (!target) {
    return;
  }

  const nextDueBill = getNextDueBill();

  if (!nextDueBill) {
    target.hidden = true;
    target.textContent = '';
    return;
  }

  target.textContent = `Next due: ${nextDueBill.name} on day ${nextDueBill.dueDay}`;
  target.hidden = false;
}

function getBillDueDayFormValue() {
  const dueDayInput = document.getElementById('billDueDay').value;

  if (dueDayInput === '') {
    return null;
  }

  const dueDay = Number(dueDayInput);

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return null;
  }

  return dueDay;
}

function getBillFormDataWithDueDay() {
  const id = document.getElementById('billId').value;
  const name = document.getElementById('billName').value.trim();
  const detail = document.getElementById('billDetail').value.trim();
  const amount = Number(document.getElementById('billAmount').value);
  const frequency = document.getElementById('billFrequency').value;
  const dueDayInput = document.getElementById('billDueDay').value;
  const dueDay = getBillDueDayFormValue();

  if (!name || !detail || Number.isNaN(amount) || !billFrequencies[frequency] || (dueDayInput !== '' && !dueDay)) {
    return null;
  }

  return { id, name, detail, amount, frequency, dueDay };
}

function getBillPayloadWithDueDay(formData) {
  const bill = {
    name: formData.name,
    detail: formData.detail,
    amount: formData.amount,
    frequency: formData.frequency
  };

  if (formData.dueDay) {
    bill.dueDay = formData.dueDay;
  }

  return bill;
}

renderBills = function renderBillsWithDueDays() {
  const target = document.getElementById('billsList');

  renderNextDueBillHelper();

  if (!data.bills.length) {
    target.innerHTML = getEmptyState('No bills yet', 'Add a mock bill to keep Available to Allocate honest.');
    return;
  }

  let previousGroup = '';

  target.innerHTML = getSortedBillsForDisplay().map(bill => {
    const status = getBillDueStatus(bill);
    const timingLabel = getBillTimingLabel(status, previousGroup);
    previousGroup = status.group;

    return `
      ${timingLabel}
      <div class="row editable-row bill-row ${status.className}">
        <div>
          <strong>${bill.name}</strong>
          <small>${bill.detail} · ${getBillFrequency(bill).label}${getBillDueDayText(bill)}</small>
        </div>
        <div class="bill-amount">
          <strong>${money.format(bill.amount)}</strong>
          ${getMonthlyBillImpact(bill)}
          ${getBillDueStatusBadge(bill)}
        </div>
        <div class="row-actions" aria-label="Bill actions">
          <button type="button" data-edit-bill="${bill.id}">Edit</button>
          <button type="button" data-delete-bill="${bill.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
};

function handleBillSubmitWithDueDay(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const formData = getBillFormDataWithDueDay();

  if (!formData) {
    return;
  }

  const billPayload = getBillPayloadWithDueDay(formData);

  if (formData.id) {
    data.bills = data.bills.map(bill => (
      bill.id === formData.id
        ? { id: bill.id, ...billPayload }
        : bill
    ));
  } else {
    data.bills.push({
      id: crypto.randomUUID(),
      ...billPayload
    });
  }

  saveRows(billStorageKey, data.bills);
  resetBillForm();
  renderBillsDashboard();
}

function syncBillDueDayEditValue(event) {
  const editId = event.target.dataset.editBill;

  if (!editId) {
    return;
  }

  const bill = data.bills.find(item => item.id === editId);

  if (bill) {
    document.getElementById('billDueDay').value = hasBillDueDay(bill) ? bill.dueDay : '';
  }
}

const baseIsValidImport = isValidImport;

isValidImport = function isValidImportWithBillDueDays(importedData) {
  if (!baseIsValidImport(importedData)) {
    return false;
  }

  return importedData.bills.every(bill => (
    bill.dueDay === undefined ||
    bill.dueDay === null ||
    (Number.isInteger(bill.dueDay) && bill.dueDay >= 1 && bill.dueDay <= 31)
  ));
};

renderBills();
document.getElementById('billForm').addEventListener('submit', handleBillSubmitWithDueDay, true);
document.getElementById('billsList').addEventListener('click', syncBillDueDayEditValue);
