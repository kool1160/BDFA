const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const accountStorageKey = 'bdfa.mockAccounts';
const billStorageKey = 'bdfa.mockBills';
const allocationStorageKey = 'bdfa.mockAllocations';
const investmentStorageKey = 'bdfa.mockInvestments';

const billFrequencies = {
  monthly: { label: 'Monthly', months: 1 },
  quarterly: { label: 'Quarterly', months: 3 },
  'six-months': { label: 'Every 6 months', months: 6 },
  yearly: { label: 'Yearly', months: 12 }
};

const demoData = {
  accounts: [
    { id: 'checking', name: 'Chase Checking', type: 'Cash', amount: 8420 },
    { id: 'savings', name: 'Huntington Savings', type: 'Cash', amount: 3211 },
    { id: 'capital-one', name: 'Capital One', type: 'Credit Card', amount: -1104 },
    { id: 'mortgage', name: 'Mortgage', type: 'Debt', amount: -40567 }
  ],
  bills: [
    { id: 'mortgage-bill', name: 'Mortgage', detail: 'Monthly reserve', amount: 1259, frequency: 'monthly' },
    { id: 'consumers-energy', name: 'Consumers Energy', detail: 'Estimated monthly', amount: 182, frequency: 'monthly' },
    { id: 'gas', name: 'Gas', detail: 'Estimated monthly', amount: 78, frequency: 'monthly' },
    { id: 'car-insurance', name: 'Car Insurance', detail: 'Policy premium', amount: 720, frequency: 'six-months' },
    { id: 'subscriptions', name: 'Subscriptions', detail: 'Monthly', amount: 77, frequency: 'monthly' }
  ],
  allocations: [
    { id: 'emergency-reserve', name: 'Emergency Reserve', detail: 'Target $10,000', amount: 6400 },
    { id: 'vacation', name: 'Vacation', detail: 'Growing monthly', amount: 950 },
    { id: 'car-maintenance', name: 'Car Maintenance', detail: 'Oil, tires, repairs', amount: 420 },
    { id: 'hsa-contribution', name: 'HSA Contribution', detail: 'Available after bills', amount: 300 }
  ],
  investments: [
    { id: '401k', name: '401(k)', detail: 'Retirement', amount: 248000 },
    { id: 'hsa', name: 'HSA', detail: 'Invested medical savings', amount: 18540 },
    { id: 'roth-ira', name: 'Roth IRA', detail: 'Tax-free retirement', amount: 116000 },
    { id: 'brokerage', name: 'Brokerage', detail: 'Taxable investing', amount: 105102 }
  ]
};

const data = structuredClone(demoData);

function total(rows) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function setMoneyText(targetId, amount) {
  const target = document.getElementById(targetId);

  if (target) {
    target.textContent = money.format(amount);
  }
}

function setText(targetId, value) {
  const target = document.getElementById(targetId);

  if (target) {
    target.textContent = value;
  }
}

function getEmptyState(title, message) {
  return `
    <div class="empty-state">
      <strong>${title}</strong>
      <p>${message}</p>
    </div>
  `;
}

function getBillFrequency(bill) {
  return billFrequencies[bill.frequency] || billFrequencies.monthly;
}

function getMonthlyBillAmount(bill) {
  return bill.amount / getBillFrequency(bill).months;
}

function getMonthlyBillImpact(bill) {
  const frequency = getBillFrequency(bill);

  if (frequency.months === 1) {
    return '';
  }

  return `<small>${money.format(getMonthlyBillAmount(bill))}/mo impact</small>`;
}

function getMonthlyBillsTotal() {
  return data.bills.reduce((sum, bill) => sum + getMonthlyBillAmount(bill), 0);
}

function loadStoredRows(storageKey, targetKey) {
  const savedRows = localStorage.getItem(storageKey);

  if (!savedRows) {
    return;
  }

  try {
    const parsedRows = JSON.parse(savedRows);

    if (Array.isArray(parsedRows)) {
      data[targetKey] = parsedRows;
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function saveRows(storageKey, rows) {
  localStorage.setItem(storageKey, JSON.stringify(rows));
}

function getDashboardTotals() {
  const cash = total(data.accounts.filter(account => account.type === 'Cash'));
  const investments = total(data.investments);
  const debt = Math.abs(total(data.accounts.filter(account => account.amount < 0)));
  const bills = getMonthlyBillsTotal();
  const allocations = total(data.allocations);

  return {
    cash,
    investments,
    debt,
    netWorth: cash + investments - debt,
    availableToAllocate: cash - bills - allocations
  };
}

function renderSectionSummaries() {
  setMoneyText('accountsSummary', total(data.accounts));
  setText('billsSummary', `${money.format(getMonthlyBillsTotal())}/mo`);
  setMoneyText('allocationsSummary', total(data.allocations));
  setMoneyText('investmentsSummary', total(data.investments));
}

function renderDashboardTotals() {
  const totals = getDashboardTotals();

  setMoneyText('availableToAllocate', totals.availableToAllocate);
  setMoneyText('netWorth', totals.netWorth);
  setMoneyText('cashTotal', totals.cash);
  setMoneyText('investmentTotal', totals.investments);
  setMoneyText('debtTotal', -totals.debt);
  renderSectionSummaries();
}

function resetAccountForm() {
  document.getElementById('accountForm').reset();
  document.getElementById('accountId').value = '';
  document.getElementById('accountSubmit').textContent = 'Add Account';
  document.getElementById('accountCancel').hidden = true;
}

function renderAccounts() {
  const target = document.getElementById('accountsList');

  if (!data.accounts.length) {
    target.innerHTML = getEmptyState('No accounts yet', 'Add your first mock account to show cash, debt, and net worth clearly.');
    return;
  }

  target.innerHTML = data.accounts.map(account => `
    <div class="row editable-row">
      <div>
        <strong>${account.name}</strong>
        <small>${account.type}</small>
      </div>
      <strong>${money.format(account.amount)}</strong>
      <div class="row-actions" aria-label="Account actions">
        <button type="button" data-edit-account="${account.id}">Edit</button>
        <button type="button" data-delete-account="${account.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderAccountsDashboard() {
  renderAccounts();
  renderDashboardTotals();
}

function getAccountFormData() {
  const id = document.getElementById('accountId').value;
  const name = document.getElementById('accountName').value.trim();
  const type = document.getElementById('accountType').value;
  const amount = Number(document.getElementById('accountAmount').value);

  if (!name || Number.isNaN(amount)) {
    return null;
  }

  return { id, name, type, amount };
}

function handleAccountSubmit(event) {
  event.preventDefault();

  const formData = getAccountFormData();

  if (!formData) {
    return;
  }

  if (formData.id) {
    data.accounts = data.accounts.map(account => (
      account.id === formData.id
        ? { ...account, name: formData.name, type: formData.type, amount: formData.amount }
        : account
    ));
  } else {
    data.accounts.push({
      id: crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      amount: formData.amount
    });
  }

  saveRows(accountStorageKey, data.accounts);
  resetAccountForm();
  renderAccountsDashboard();
}

function handleAccountActions(event) {
  const editId = event.target.dataset.editAccount;
  const deleteId = event.target.dataset.deleteAccount;

  if (editId) {
    const account = data.accounts.find(item => item.id === editId);

    if (!account) {
      return;
    }

    document.getElementById('accountId').value = account.id;
    document.getElementById('accountName').value = account.name;
    document.getElementById('accountType').value = account.type;
    document.getElementById('accountAmount').value = account.amount;
    document.getElementById('accountSubmit').textContent = 'Save Account';
    document.getElementById('accountCancel').hidden = false;
  }

  if (deleteId) {
    data.accounts = data.accounts.filter(account => account.id !== deleteId);
    saveRows(accountStorageKey, data.accounts);
    resetAccountForm();
    renderAccountsDashboard();
  }
}

function resetBillForm() {
  document.getElementById('billForm').reset();
  document.getElementById('billId').value = '';
  document.getElementById('billFrequency').value = 'monthly';
  document.getElementById('billSubmit').textContent = 'Add Bill';
  document.getElementById('billCancel').hidden = true;
}

function renderBills() {
  const target = document.getElementById('billsList');

  if (!data.bills.length) {
    target.innerHTML = getEmptyState('No bills yet', 'Add a mock bill to keep Available to Allocate honest.');
    return;
  }

  target.innerHTML = data.bills.map(bill => `
    <div class="row editable-row">
      <div>
        <strong>${bill.name}</strong>
        <small>${bill.detail} · ${getBillFrequency(bill).label}</small>
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
}

function renderBillsDashboard() {
  renderBills();
  renderDashboardTotals();
}

function getBillFormData() {
  const id = document.getElementById('billId').value;
  const name = document.getElementById('billName').value.trim();
  const detail = document.getElementById('billDetail').value.trim();
  const amount = Number(document.getElementById('billAmount').value);
  const frequency = document.getElementById('billFrequency').value;

  if (!name || !detail || Number.isNaN(amount) || !billFrequencies[frequency]) {
    return null;
  }

  return { id, name, detail, amount, frequency };
}

function handleBillSubmit(event) {
  event.preventDefault();

  const formData = getBillFormData();

  if (!formData) {
    return;
  }

  if (formData.id) {
    data.bills = data.bills.map(bill => (
      bill.id === formData.id
        ? { ...bill, name: formData.name, detail: formData.detail, amount: formData.amount, frequency: formData.frequency }
        : bill
    ));
  } else {
    data.bills.push({
      id: crypto.randomUUID(),
      name: formData.name,
      detail: formData.detail,
      amount: formData.amount,
      frequency: formData.frequency
    });
  }

  saveRows(billStorageKey, data.bills);
  resetBillForm();
  renderBillsDashboard();
}

function handleBillActions(event) {
  const editId = event.target.dataset.editBill;
  const deleteId = event.target.dataset.deleteBill;

  if (editId) {
    const bill = data.bills.find(item => item.id === editId);

    if (!bill) {
      return;
    }

    document.getElementById('billId').value = bill.id;
    document.getElementById('billName').value = bill.name;
    document.getElementById('billDetail').value = bill.detail;
    document.getElementById('billAmount').value = bill.amount;
    document.getElementById('billFrequency').value = billFrequencies[bill.frequency] ? bill.frequency : 'monthly';
    document.getElementById('billSubmit').textContent = 'Save Bill';
    document.getElementById('billCancel').hidden = false;
  }

  if (deleteId) {
    data.bills = data.bills.filter(bill => bill.id !== deleteId);
    saveRows(billStorageKey, data.bills);
    resetBillForm();
    renderBillsDashboard();
  }
}

function resetAllocationForm() {
  document.getElementById('allocationForm').reset();
  document.getElementById('allocationId').value = '';
  document.getElementById('allocationSubmit').textContent = 'Add Allocation';
  document.getElementById('allocationCancel').hidden = true;
}

function renderAllocations() {
  const target = document.getElementById('allocationsList');

  if (!data.allocations.length) {
    target.innerHTML = getEmptyState('No allocations yet', 'Add a mock allocation to give your money a clear job.');
    return;
  }

  target.innerHTML = data.allocations.map(allocation => `
    <div class="row editable-row">
      <div>
        <strong>${allocation.name}</strong>
        <small>${allocation.detail}</small>
      </div>
      <strong>${money.format(allocation.amount)}</strong>
      <div class="row-actions" aria-label="Allocation actions">
        <button type="button" data-edit-allocation="${allocation.id}">Edit</button>
        <button type="button" data-delete-allocation="${allocation.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderAllocationsDashboard() {
  renderAllocations();
  renderDashboardTotals();
}

function getAllocationFormData() {
  const id = document.getElementById('allocationId').value;
  const name = document.getElementById('allocationName').value.trim();
  const detail = document.getElementById('allocationDetail').value.trim();
  const amount = Number(document.getElementById('allocationAmount').value);

  if (!name || !detail || Number.isNaN(amount)) {
    return null;
  }

  return { id, name, detail, amount };
}

function handleAllocationSubmit(event) {
  event.preventDefault();

  const formData = getAllocationFormData();

  if (!formData) {
    return;
  }

  if (formData.id) {
    data.allocations = data.allocations.map(allocation => (
      allocation.id === formData.id
        ? { ...allocation, name: formData.name, detail: formData.detail, amount: formData.amount }
        : allocation
    ));
  } else {
    data.allocations.push({
      id: crypto.randomUUID(),
      name: formData.name,
      detail: formData.detail,
      amount: formData.amount
    });
  }

  saveRows(allocationStorageKey, data.allocations);
  resetAllocationForm();
  renderAllocationsDashboard();
}

function handleAllocationActions(event) {
  const editId = event.target.dataset.editAllocation;
  const deleteId = event.target.dataset.deleteAllocation;

  if (editId) {
    const allocation = data.allocations.find(item => item.id === editId);

    if (!allocation) {
      return;
    }

    document.getElementById('allocationId').value = allocation.id;
    document.getElementById('allocationName').value = allocation.name;
    document.getElementById('allocationDetail').value = allocation.detail;
    document.getElementById('allocationAmount').value = allocation.amount;
    document.getElementById('allocationSubmit').textContent = 'Save Allocation';
    document.getElementById('allocationCancel').hidden = false;
  }

  if (deleteId) {
    data.allocations = data.allocations.filter(allocation => allocation.id !== deleteId);
    saveRows(allocationStorageKey, data.allocations);
    resetAllocationForm();
    renderAllocationsDashboard();
  }
}

function resetInvestmentForm() {
  document.getElementById('investmentForm').reset();
  document.getElementById('investmentId').value = '';
  document.getElementById('investmentSubmit').textContent = 'Add Investment';
  document.getElementById('investmentCancel').hidden = true;
}

function renderInvestments() {
  const target = document.getElementById('investmentsList');

  if (!data.investments.length) {
    target.innerHTML = getEmptyState('No investments yet', 'Add a mock investment to see how it supports net worth.');
    return;
  }

  target.innerHTML = data.investments.map(investment => `
    <div class="row editable-row">
      <div>
        <strong>${investment.name}</strong>
        <small>${investment.detail}</small>
      </div>
      <strong>${money.format(investment.amount)}</strong>
      <div class="row-actions" aria-label="Investment actions">
        <button type="button" data-edit-investment="${investment.id}">Edit</button>
        <button type="button" data-delete-investment="${investment.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderInvestmentsDashboard() {
  renderInvestments();
  renderDashboardTotals();
}

function getInvestmentFormData() {
  const id = document.getElementById('investmentId').value;
  const name = document.getElementById('investmentName').value.trim();
  const detail = document.getElementById('investmentDetail').value.trim();
  const amount = Number(document.getElementById('investmentAmount').value);

  if (!name || !detail || Number.isNaN(amount)) {
    return null;
  }

  return { id, name, detail, amount };
}

function handleInvestmentSubmit(event) {
  event.preventDefault();

  const formData = getInvestmentFormData();

  if (!formData) {
    return;
  }

  if (formData.id) {
    data.investments = data.investments.map(investment => (
      investment.id === formData.id
        ? { ...investment, name: formData.name, detail: formData.detail, amount: formData.amount }
        : investment
    ));
  } else {
    data.investments.push({
      id: crypto.randomUUID(),
      name: formData.name,
      detail: formData.detail,
      amount: formData.amount
    });
  }

  saveRows(investmentStorageKey, data.investments);
  resetInvestmentForm();
  renderInvestmentsDashboard();
}

function handleInvestmentActions(event) {
  const editId = event.target.dataset.editInvestment;
  const deleteId = event.target.dataset.deleteInvestment;

  if (editId) {
    const investment = data.investments.find(item => item.id === editId);

    if (!investment) {
      return;
    }

    document.getElementById('investmentId').value = investment.id;
    document.getElementById('investmentName').value = investment.name;
    document.getElementById('investmentDetail').value = investment.detail;
    document.getElementById('investmentAmount').value = investment.amount;
    document.getElementById('investmentSubmit').textContent = 'Save Investment';
    document.getElementById('investmentCancel').hidden = false;
  }

  if (deleteId) {
    data.investments = data.investments.filter(investment => investment.id !== deleteId);
    saveRows(investmentStorageKey, data.investments);
    resetInvestmentForm();
    renderInvestmentsDashboard();
  }
}

function renderAllSections() {
  renderAccounts();
  renderBills();
  renderAllocations();
  renderInvestments();
  renderDashboardTotals();
}

function getExportData() {
  return {
    accounts: data.accounts,
    bills: data.bills,
    allocations: data.allocations,
    investments: data.investments
  };
}

function exportDemoData() {
  const blob = new Blob([JSON.stringify(getExportData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'bdfa-demo-data.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clearDemoStorage() {
  localStorage.removeItem(accountStorageKey);
  localStorage.removeItem(billStorageKey);
  localStorage.removeItem(allocationStorageKey);
  localStorage.removeItem(investmentStorageKey);
}

function resetDemoData() {
  if (!confirm('Reset BDFA demo data back to the original mock dataset?')) {
    return;
  }

  const freshData = structuredClone(demoData);
  data.accounts = freshData.accounts;
  data.bills = freshData.bills;
  data.allocations = freshData.allocations;
  data.investments = freshData.investments;
  clearDemoStorage();
  resetAccountForm();
  resetBillForm();
  resetAllocationForm();
  resetInvestmentForm();
  renderAllSections();
}

loadStoredRows(accountStorageKey, 'accounts');
loadStoredRows(billStorageKey, 'bills');
loadStoredRows(allocationStorageKey, 'allocations');
loadStoredRows(investmentStorageKey, 'investments');
renderAllSections();

document.getElementById('accountForm').addEventListener('submit', handleAccountSubmit);
document.getElementById('accountCancel').addEventListener('click', resetAccountForm);
document.getElementById('accountsList').addEventListener('click', handleAccountActions);
document.getElementById('billForm').addEventListener('submit', handleBillSubmit);
document.getElementById('billCancel').addEventListener('click', resetBillForm);
document.getElementById('billsList').addEventListener('click', handleBillActions);
document.getElementById('allocationForm').addEventListener('submit', handleAllocationSubmit);
document.getElementById('allocationCancel').addEventListener('click', resetAllocationForm);
document.getElementById('allocationsList').addEventListener('click', handleAllocationActions);
document.getElementById('investmentForm').addEventListener('submit', handleInvestmentSubmit);
document.getElementById('investmentCancel').addEventListener('click', resetInvestmentForm);
document.getElementById('investmentsList').addEventListener('click', handleInvestmentActions);
document.getElementById('exportDemoData').addEventListener('click', exportDemoData);
document.getElementById('resetDemoData').addEventListener('click', resetDemoData);

document.querySelectorAll('[data-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const panel = button.closest('.panel');
    panel.classList.toggle('collapsed');
    const body = panel.querySelector('.panel-body');
    body.hidden = !body.hidden;
  });
});
