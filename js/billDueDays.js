function hasBillDueDay(bill) {
  return Number.isInteger(bill.dueDay) && bill.dueDay >= 1 && bill.dueDay <= 31;
}

function getBillDueDayText(bill) {
  return hasBillDueDay(bill) ? ` · Due day ${bill.dueDay}` : '';
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

  if (!data.bills.length) {
    target.innerHTML = getEmptyState('No bills yet', 'Add a mock bill to keep Available to Allocate honest.');
    return;
  }

  target.innerHTML = data.bills.map(bill => `
    <div class="row editable-row">
      <div>
        <strong>${bill.name}</strong>
        <small>${bill.detail} · ${getBillFrequency(bill).label}${getBillDueDayText(bill)}</small>
      </div>
      <div class="bill-amount">
        <strong>${money.format(bill.amount)}</strong>
        ${getMonthlyBillImpact(bill)}
      </div>
      <div class="row-actions" aria-label="Bill actions">
        <button type="button" data-edit-bill="${bill.id}">Edit</button>
        <button type="button" data-delete-bill="${bill.id}">Delete</button>
      </div>
    </div>
  `).join('');
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
