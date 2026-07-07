const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const panelStateStorageKey = 'bdfa.panelState';
let statusTimer;

const billFrequencies = {
  monthly: { label: 'Monthly', months: 1 },
  quarterly: { label: 'Quarterly', months: 3 },
  'six-months': { label: 'Every 6 months', months: 6 },
  yearly: { label: 'Yearly', months: 12 }
};

const accountTypes = ['Cash', 'Credit Card', 'Debt'];
const assetTypes = ['Home', 'Vehicle', 'Equipment', 'Personal Property', 'Other'];
const recurringIncomeFrequencies = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  semimonthly: 'Semimonthly',
  monthly: 'Monthly'
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
    { id: 'emergency-reserve', name: 'Emergency Reserve', detail: 'Target $10,000', amount: 6400, targetAmount: 10000 },
    { id: 'vacation', name: 'Vacation', detail: 'Growing monthly', amount: 950, targetAmount: 2500 },
    { id: 'car-maintenance', name: 'Car Maintenance', detail: 'Oil, tires, repairs', amount: 420, targetAmount: 1200 },
    { id: 'hsa-contribution', name: 'HSA Contribution', detail: 'Available after bills', amount: 300 }
  ],
  investments: [
    { id: '401k', name: '401(k)', detail: 'Retirement', amount: 248000 },
    { id: 'hsa', name: 'HSA', detail: 'Invested medical savings', amount: 18540 },
    { id: 'roth-ira', name: 'Roth IRA', detail: 'Tax-free retirement', amount: 116000 },
    { id: 'brokerage', name: 'Brokerage', detail: 'Taxable investing', amount: 105102 }
  ],
  assets: [],
  recurringIncome: [
    { id: 'primary-paycheck', name: 'Primary Paycheck', amount: 2100, frequency: 'biweekly', nextPayDay: '2026-07-08' },
    { id: 'side-income', name: 'Side Income', amount: 375, frequency: 'monthly', nextPayDay: '10' }
  ]
};

const data = structuredClone(demoData);

window.BDFA = window.BDFA || {};

function total(rows) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function setMoneyTone(element, amount) {
  if (!element) {
    return;
  }

  element.classList.toggle('money-debt', amount < 0);
  element.classList.toggle('money-positive', amount >= 0);
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

function showStatus(message, tone = 'success') {
  const target = document.getElementById('statusMessage');

  if (!target) {
    return;
  }

  clearTimeout(statusTimer);
  target.textContent = message;
  target.dataset.tone = tone;
  target.hidden = false;

  statusTimer = setTimeout(() => {
    target.hidden = true;
  }, 3600);
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

function hasAllocationTarget(allocation) {
  return typeof allocation.targetAmount === 'number' && Number.isFinite(allocation.targetAmount) && allocation.targetAmount > 0;
}

function getAllocationProgress(allocation) {
  if (!hasAllocationTarget(allocation)) {
    return '';
  }

  const rawPercent = (allocation.amount / allocation.targetAmount) * 100;
  const percent = Math.min(Math.max(rawPercent, 0), 100);
  const remaining = Math.max(allocation.targetAmount - allocation.amount, 0);
  const complete = allocation.amount >= allocation.targetAmount;
  const statusText = complete ? 'Complete' : `${money.format(remaining)} left`;

  return `
    <div class="allocation-progress ${complete ? 'complete' : ''}" aria-label="${Math.round(percent)}% funded toward ${money.format(allocation.targetAmount)} target">
      <div class="allocation-progress-label">
        <span>${complete ? '100% funded' : `${Math.round(percent)}% funded`}</span>
        <span>Target ${money.format(allocation.targetAmount)}</span>
      </div>
      <div class="allocation-progress-track">
        <span style="width: ${percent}%"></span>
      </div>
      <div class="allocation-progress-status">${statusText}</div>
    </div>
  `;
}

function cloneSourceData(sourceData) {
  if (typeof structuredClone === 'function') {
    return structuredClone(sourceData);
  }

  return JSON.parse(JSON.stringify(sourceData));
}

function applySourceDataSnapshot(sourceData) {
  ['accounts', 'bills', 'allocations', 'investments', 'assets', 'recurringIncome'].forEach(collection => {
    if (Array.isArray(sourceData[collection])) {
      data[collection] = cloneSourceData(sourceData[collection]);
    }
  });
}

function validateSourceSnapshot(sourceData) {
  if (window.BDFA.dataAdapter && typeof window.BDFA.dataAdapter.validateSourceSnapshot === 'function') {
    return window.BDFA.dataAdapter.validateSourceSnapshot(sourceData);
  }

  if (!sourceData || typeof sourceData !== 'object' || Array.isArray(sourceData)) {
    return { valid: false, data: null };
  }

  const snapshot = {};

  for (const collection of ['accounts', 'bills', 'allocations', 'investments', 'assets', 'recurringIncome']) {
    if (sourceData[collection] === undefined) {
      snapshot[collection] = [];
    } else if (Array.isArray(sourceData[collection])) {
      snapshot[collection] = cloneSourceData(sourceData[collection]);
    } else {
      return { valid: false, data: null };
    }
  }

  return { valid: true, data: snapshot };
}

function resetFormsAfterSourceDataChange() {
  resetAccountForm();
  resetBillForm();
  resetAllocationForm();
  resetInvestmentForm();
  resetAssetForm();
  resetRecurringIncomeForm();
}

function applyPersistedSourceData(sourceData) {
  applySourceDataSnapshot(sourceData);
  resetFormsAfterSourceDataChange();
  renderAllSections();
  window.dispatchEvent(new CustomEvent('bdfa:source-data-updated', {
    detail: cloneSourceData(sourceData)
  }));
}

function saveSourceDataLocally(sourceData) {
  if (window.BDFA.dataAdapter && typeof window.BDFA.dataAdapter.saveLocalSourceData === 'function') {
    return window.BDFA.dataAdapter.saveLocalSourceData(sourceData);
  }

  return window.BDFA.dataAdapter.importData(sourceData);
}

function saveAllRows() {
  saveSourceDataLocally(getExportData());
  setLocalChangesPendingCloudSave(true);
  dispatchSourceDataUpdated();
}

function getDashboardTotals() {
  const cash = total(data.accounts.filter(account => account.type === 'Cash'));
  const investments = total(data.investments);
  const assets = getAssetsTotal();
  const debt = Math.abs(total(data.accounts.filter(account => account.amount < 0)));
  const bills = getMonthlyBillsTotal();
  const allocations = total(data.allocations);

  return {
    cash,
    investments,
    assets,
    debt,
    netWorth: cash + investments + assets - debt,
    availableToAllocate: cash - bills - allocations
  };
}

function renderSectionSummaries() {
  setMoneyText('accountsSummary', total(data.accounts));
  setText('billsSummary', `${money.format(getMonthlyBillsTotal())}/mo`);
  setMoneyText('allocationsSummary', total(data.allocations));
  setMoneyText('investmentsSummary', total(data.investments));
  setMoneyText('assetsSummary', getAssetsTotal());
  setMoneyText('recurringIncomeSummary', getRecurringIncomeTotal());
}

function renderDashboardTotals() {
  const totals = getDashboardTotals();

  setMoneyText('availableToAllocate', totals.availableToAllocate);
  setMoneyTone(document.getElementById('availableToAllocate'), totals.availableToAllocate);
  setMoneyText('netWorth', totals.netWorth);
  setMoneyTone(document.getElementById('netWorth'), totals.netWorth);
  setMoneyText('cashTotal', totals.cash);
  setMoneyTone(document.getElementById('cashTotal'), totals.cash);
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

  saveAllRows();
  resetAccountForm();
  renderAccountsDashboard();
  dispatchSourceDataUpdated();
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
    saveAllRows();
    resetAccountForm();
    renderAccountsDashboard();
    dispatchSourceDataUpdated();
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

  saveAllRows();
  resetBillForm();
  renderBillsDashboard();
  dispatchSourceDataUpdated();
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
    saveAllRows();
    resetBillForm();
    renderBillsDashboard();
    dispatchSourceDataUpdated();
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
    <div class="row editable-row allocation-row">
      <div>
        <strong>${allocation.name}</strong>
        <small>${allocation.detail}</small>
        ${getAllocationProgress(allocation)}
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
  const targetInput = document.getElementById('allocationTarget').value;
  const targetAmount = targetInput === '' ? null : Number(targetInput);

  if (!name || !detail || Number.isNaN(amount) || (targetInput !== '' && (!Number.isFinite(targetAmount) || targetAmount <= 0))) {
    return null;
  }

  return { id, name, detail, amount, targetAmount };
}

function getAllocationPayload(formData) {
  const allocation = {
    name: formData.name,
    detail: formData.detail,
    amount: formData.amount
  };

  if (formData.targetAmount) {
    allocation.targetAmount = formData.targetAmount;
  }

  return allocation;
}

function handleAllocationSubmit(event) {
  event.preventDefault();

  const formData = getAllocationFormData();

  if (!formData) {
    return;
  }

  const allocationPayload = getAllocationPayload(formData);

  if (formData.id) {
    data.allocations = data.allocations.map(allocation => (
      allocation.id === formData.id
        ? { id: allocation.id, ...allocationPayload }
        : allocation
    ));
  } else {
    data.allocations.push({
      id: crypto.randomUUID(),
      ...allocationPayload
    });
  }

  saveAllRows();
  resetAllocationForm();
  renderAllocationsDashboard();
  dispatchSourceDataUpdated();
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
    document.getElementById('allocationTarget').value = hasAllocationTarget(allocation) ? allocation.targetAmount : '';
    document.getElementById('allocationSubmit').textContent = 'Save Allocation';
    document.getElementById('allocationCancel').hidden = false;
  }

  if (deleteId) {
    data.allocations = data.allocations.filter(allocation => allocation.id !== deleteId);
    saveAllRows();
    resetAllocationForm();
    renderAllocationsDashboard();
    dispatchSourceDataUpdated();
  }
}

function getAssetsTotal() {
  return data.assets.reduce((sum, asset) => (
    Number.isFinite(asset.value) ? sum + asset.value : sum
  ), 0);
}

function resetAssetForm() {
  document.getElementById('assetForm').reset();
  document.getElementById('assetId').value = '';
  document.getElementById('assetType').value = 'Home';
  document.getElementById('assetSubmit').textContent = 'Add Asset';
  document.getElementById('assetCancel').hidden = true;
}

function renderAssets() {
  const target = document.getElementById('assetsList');

  if (!target) {
    return;
  }

  setMoneyText('assetsTotal', getAssetsTotal());

  if (!data.assets.length) {
    target.innerHTML = getEmptyState('No assets yet', 'Add a home, vehicle, equipment, or other manual asset to make net worth equity-aware.');
    return;
  }

  target.innerHTML = data.assets.map(asset => `
    <div class="row editable-row">
      <div>
        <strong>${asset.name}</strong>
        <small>${asset.type}${asset.notes ? ` · ${asset.notes}` : ''}</small>
      </div>
      <strong>${money.format(asset.value)}</strong>
      <div class="row-actions" aria-label="Asset actions">
        <button type="button" data-edit-asset="${asset.id}">Edit</button>
        <button type="button" data-delete-asset="${asset.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderAssetsDashboard() {
  renderAssets();
  renderDashboardTotals();
}

function getAssetFormData() {
  const id = document.getElementById('assetId').value;
  const name = document.getElementById('assetName').value.trim();
  const type = document.getElementById('assetType').value;
  const value = Number(document.getElementById('assetValue').value);
  const notes = document.getElementById('assetNotes').value.trim();

  if (!name || !assetTypes.includes(type) || !Number.isFinite(value)) {
    return null;
  }

  return { id, name, type, value, notes };
}

function handleAssetSubmit(event) {
  event.preventDefault();

  const formData = getAssetFormData();

  if (!formData) {
    return;
  }

  if (formData.id) {
    data.assets = data.assets.map(asset => (
      asset.id === formData.id
        ? { ...asset, name: formData.name, type: formData.type, value: formData.value, notes: formData.notes }
        : asset
    ));
  } else {
    data.assets.push({
      id: crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      value: formData.value,
      notes: formData.notes
    });
  }

  saveAllRows();
  resetAssetForm();
  renderAssetsDashboard();
  dispatchSourceDataUpdated();
}

function handleAssetActions(event) {
  const editId = event.target.dataset.editAsset;
  const deleteId = event.target.dataset.deleteAsset;

  if (editId) {
    const asset = data.assets.find(item => item.id === editId);

    if (!asset) {
      return;
    }

    document.getElementById('assetId').value = asset.id;
    document.getElementById('assetName').value = asset.name;
    document.getElementById('assetType').value = assetTypes.includes(asset.type) ? asset.type : 'Other';
    document.getElementById('assetValue').value = asset.value;
    document.getElementById('assetNotes').value = asset.notes || '';
    document.getElementById('assetSubmit').textContent = 'Save Asset';
    document.getElementById('assetCancel').hidden = false;
  }

  if (deleteId) {
    data.assets = data.assets.filter(asset => asset.id !== deleteId);
    saveAllRows();
    resetAssetForm();
    renderAssetsDashboard();
    dispatchSourceDataUpdated();
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

  saveAllRows();
  resetInvestmentForm();
  renderInvestmentsDashboard();
  dispatchSourceDataUpdated();
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
    saveAllRows();
    resetInvestmentForm();
    renderInvestmentsDashboard();
    dispatchSourceDataUpdated();
  }
}


function getRecurringIncomeTotal() {
  return data.recurringIncome.reduce((sum, income) => (
    Number.isFinite(income.amount) ? sum + income.amount : sum
  ), 0);
}

function getRecurringIncomeFrequencyLabel(frequency) {
  return recurringIncomeFrequencies[frequency] || recurringIncomeFrequencies.monthly;
}

function resetRecurringIncomeForm() {
  const form = document.getElementById('recurringIncomeForm');

  if (form) {
    form.reset();
  }

  const id = document.getElementById('recurringIncomeId');
  const frequency = document.getElementById('recurringIncomeFrequency');
  const submit = document.getElementById('recurringIncomeSubmit');
  const cancel = document.getElementById('recurringIncomeCancel');

  if (id) {
    id.value = '';
  }

  if (frequency) {
    frequency.value = 'biweekly';
  }

  if (submit) {
    submit.textContent = 'Add Income';
  }

  if (cancel) {
    cancel.hidden = true;
  }
}

function renderRecurringIncome() {
  const target = document.getElementById('recurringIncomeList');

  if (!target) {
    return;
  }

  if (!data.recurringIncome.length) {
    target.innerHTML = getEmptyState('No recurring income yet', 'Add a source to keep income timing ready for future Monthly Flow planning.');
    return;
  }

  target.innerHTML = data.recurringIncome.map(income => `
    <div class="row editable-row">
      <div>
        <strong>${income.name || 'Income source'}</strong>
        <small>${getRecurringIncomeFrequencyLabel(income.frequency)} · Next pay day ${income.nextPayDay || 'Not set'}</small>
      </div>
      <strong>${money.format(Number.isFinite(income.amount) ? income.amount : 0)}</strong>
      <div class="row-actions" aria-label="Recurring income actions">
        <button type="button" data-edit-recurring-income="${income.id}">Edit</button>
        <button type="button" data-delete-recurring-income="${income.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderRecurringIncomeDashboard() {
  renderRecurringIncome();
  renderSectionSummaries();
}

function getRecurringIncomeFormData() {
  const id = document.getElementById('recurringIncomeId');
  const name = document.getElementById('recurringIncomeName');
  const amount = document.getElementById('recurringIncomeAmount');
  const frequency = document.getElementById('recurringIncomeFrequency');
  const nextPayDay = document.getElementById('recurringIncomeNextPayDay');

  if (!id || !name || !amount || !frequency || !nextPayDay) {
    return null;
  }

  const parsedAmount = Number(amount.value);

  if (!name.value.trim() || !Number.isFinite(parsedAmount)) {
    return null;
  }

  return {
    id: id.value,
    name: name.value.trim(),
    amount: parsedAmount,
    frequency: recurringIncomeFrequencies[frequency.value] ? frequency.value : 'monthly',
    nextPayDay: nextPayDay.value.trim()
  };
}

function isValidRecurringIncomeRow(row) {
  return Boolean(row) &&
    isText(row.id) &&
    isText(row.name) &&
    isAmount(row.amount) &&
    (!row.frequency || Boolean(recurringIncomeFrequencies[row.frequency])) &&
    (row.nextPayDay === undefined || typeof row.nextPayDay === 'string');
}

function handleRecurringIncomeSubmit(event) {
  event.preventDefault();

  const formData = getRecurringIncomeFormData();

  if (!formData) {
    return;
  }

  if (formData.id) {
    data.recurringIncome = data.recurringIncome.map(income => (
      income.id === formData.id
        ? { ...income, name: formData.name, amount: formData.amount, frequency: formData.frequency, nextPayDay: formData.nextPayDay }
        : income
    ));
  } else {
    data.recurringIncome.push({
      id: crypto.randomUUID(),
      name: formData.name,
      amount: formData.amount,
      frequency: formData.frequency,
      nextPayDay: formData.nextPayDay
    });
  }

  saveAllRows();
  resetRecurringIncomeForm();
  renderRecurringIncomeDashboard();
  dispatchSourceDataUpdated();
}

function handleRecurringIncomeActions(event) {
  const editId = event.target.dataset.editRecurringIncome;
  const deleteId = event.target.dataset.deleteRecurringIncome;

  if (editId) {
    const income = data.recurringIncome.find(item => item.id === editId);

    if (!income) {
      return;
    }

    document.getElementById('recurringIncomeId').value = income.id;
    document.getElementById('recurringIncomeName').value = income.name || '';
    document.getElementById('recurringIncomeAmount').value = Number.isFinite(income.amount) ? income.amount : '';
    document.getElementById('recurringIncomeFrequency').value = recurringIncomeFrequencies[income.frequency] ? income.frequency : 'monthly';
    document.getElementById('recurringIncomeNextPayDay').value = income.nextPayDay || '';
    document.getElementById('recurringIncomeSubmit').textContent = 'Save Income';
    document.getElementById('recurringIncomeCancel').hidden = false;
  }

  if (deleteId) {
    data.recurringIncome = data.recurringIncome.filter(income => income.id !== deleteId);
    saveAllRows();
    resetRecurringIncomeForm();
    renderRecurringIncomeDashboard();
    dispatchSourceDataUpdated();
  }
}

function renderAllSections() {
  renderAccounts();
  renderBills();
  renderAllocations();
  renderInvestments();
  renderAssets();
  renderRecurringIncome();
  renderDashboardTotals();
}

function getSavedCollapsedPanels() {
  const savedPanels = localStorage.getItem(panelStateStorageKey);

  if (!savedPanels) {
    return [];
  }

  try {
    const parsedPanels = JSON.parse(savedPanels);
    return Array.isArray(parsedPanels) ? parsedPanels : [];
  } catch {
    localStorage.removeItem(panelStateStorageKey);
    return [];
  }
}

function saveCollapsedPanels() {
  const collapsedPanels = Array.from(document.querySelectorAll('[data-toggle]'))
    .filter(button => button.closest('.panel').classList.contains('collapsed'))
    .map(button => button.dataset.toggle);

  localStorage.setItem(panelStateStorageKey, JSON.stringify(collapsedPanels));
}

function syncPanelToggleAriaState(button) {
  const panel = button.closest('.panel');
  const body = panel.querySelector('.panel-body');
  const isExpanded = !body.hidden;

  button.setAttribute('aria-expanded', String(isExpanded));

  if (body.id) {
    button.setAttribute('aria-controls', body.id);
  }
}

function applySavedPanelState() {
  const collapsedPanels = getSavedCollapsedPanels();

  document.querySelectorAll('[data-toggle]').forEach(button => {
    const panel = button.closest('.panel');
    const body = panel.querySelector('.panel-body');
    const shouldCollapse = collapsedPanels.includes(button.dataset.toggle);

    panel.classList.toggle('collapsed', shouldCollapse);
    body.hidden = shouldCollapse;
    syncPanelToggleAriaState(button);
  });
}

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAmount(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBasicMoneyRow(row) {
  return row && isText(row.id) && isText(row.name) && isText(row.detail) && isAmount(row.amount);
}

function isValidAssetRow(row) {
  return Boolean(row) &&
    isText(row.id) &&
    isText(row.name) &&
    assetTypes.includes(row.type) &&
    isAmount(row.value) &&
    (row.notes === undefined || typeof row.notes === 'string');
}

function isValidAllocationRow(row) {
  return isBasicMoneyRow(row) && (
    row.targetAmount === undefined ||
    row.targetAmount === null ||
    (isAmount(row.targetAmount) && row.targetAmount > 0)
  );
}

function areImportRowsValid(sourceData) {
  const { accounts, bills, allocations, investments, assets, recurringIncome } = sourceData;
  const accountsValid = accounts.every(account => (
    account &&
    isText(account.id) &&
    isText(account.name) &&
    accountTypes.includes(account.type) &&
    isAmount(account.amount)
  ));

  const billsValid = bills.every(bill => (
    isBasicMoneyRow(bill) &&
    Boolean(billFrequencies[bill.frequency])
  ));

  const recurringIncomeValid = recurringIncome.every(isValidRecurringIncomeRow);

  return accountsValid && billsValid && allocations.every(isValidAllocationRow) && investments.every(isBasicMoneyRow) && assets.every(isValidAssetRow) && recurringIncomeValid;
}

function getValidImportSnapshot(importedData) {
  const validation = validateSourceSnapshot(importedData);

  if (!validation.valid || !areImportRowsValid(validation.data)) {
    return null;
  }

  return validation.data;
}

function isValidImport(importedData) {
  const validation = validateSourceSnapshot(importedData);

  return validation.valid && areImportRowsValid(validation.data);
}

function sourceSnapshotsMatch(firstSnapshot, secondSnapshot) {
  const firstValidation = validateSourceSnapshot(firstSnapshot);
  const secondValidation = validateSourceSnapshot(secondSnapshot);

  if (!firstValidation.valid || !secondValidation.valid) {
    return false;
  }

  return JSON.stringify(firstValidation.data) === JSON.stringify(secondValidation.data);
}

function applyImportedData(importedData) {
  const importSnapshot = getValidImportSnapshot(importedData);

  if (!importSnapshot) {
    return false;
  }

  const persistedData = saveSourceDataLocally(importSnapshot);

  if (!sourceSnapshotsMatch(importSnapshot, persistedData)) {
    return false;
  }

  applySourceDataSnapshot(persistedData);
  resetAccountForm();
  resetBillForm();
  resetAllocationForm();
  resetInvestmentForm();
  resetAssetForm();
  resetRecurringIncomeForm();
  renderAllSections();
  setLocalChangesPendingCloudSave(true);
  dispatchSourceDataUpdated();

  return true;
}

function importDemoData() {
  const importField = document.getElementById('importData');
  const rawImport = importField ? importField.value.trim() : '';

  if (!rawImport) {
    showStatus('Import failed. Paste exported BDFA JSON before importing.', 'error');
    return;
  }

  try {
    const importedData = JSON.parse(rawImport);

    if (!isValidImport(importedData)) {
      showStatus('Import failed. That JSON does not match the BDFA demo format.', 'error');
      return;
    }

    const normalizedImportSnapshot = getValidImportSnapshot(importedData);

    if (!normalizedImportSnapshot || !applyImportedData(normalizedImportSnapshot)) {
      showStatus('Import failed. That JSON does not match the BDFA demo format.', 'error');
      return;
    }

    if (importField) {
      importField.value = '';
    }

    showStatus('Demo data imported successfully.');
  } catch {
    showStatus('Import failed. That text could not be read as valid JSON.', 'error');
  }
}

function getExportData() {
  return {
    accounts: data.accounts,
    bills: data.bills,
    allocations: data.allocations,
    investments: data.investments,
    recurringIncome: data.recurringIncome,
    assets: data.assets
  };
}

function getRuntimeSourceData() {
  return cloneSourceData(getExportData());
}

window.BDFA.getSourceData = getRuntimeSourceData;

let cloudOperationInProgress = false;
let cloudLastSyncMessage = 'Using local save only';
let localChangesPendingCloudSave = false;
let cloudDirtyIndicatorEligible = false;

function renderCloudSaveButtonState() {
  const cloudSaveButton = document.getElementById('cloudSaveButton');

  if (!cloudSaveButton) {
    return;
  }

  const shouldShowDirtyState = localChangesPendingCloudSave && cloudDirtyIndicatorEligible;

  cloudSaveButton.textContent = shouldShowDirtyState ? 'Save Changes to Cloud' : 'Save to Cloud';
  cloudSaveButton.dataset.cloudDirty = shouldShowDirtyState ? 'true' : 'false';
}

function renderCloudDirtyIndicator() {
  const indicator = document.getElementById('cloudDirtyIndicator');
  const shouldShowIndicator = localChangesPendingCloudSave && cloudDirtyIndicatorEligible;

  renderCloudSaveButtonState();

  if (!indicator) {
    return;
  }

  indicator.hidden = !shouldShowIndicator;
  indicator.textContent = shouldShowIndicator ? 'Local changes not saved to cloud.' : '';
}

function setLocalChangesPendingCloudSave(isPending) {
  localChangesPendingCloudSave = Boolean(isPending);
  renderCloudDirtyIndicator();
}

function hydrateLocalChangesPendingCloudSave() {
  const dataAdapter = window.BDFA.dataAdapter;

  if (!dataAdapter || typeof dataAdapter.hasLocalChangesPendingCloudSave !== 'function') {
    return;
  }

  setLocalChangesPendingCloudSave(dataAdapter.hasLocalChangesPendingCloudSave());
}

function formatCloudSyncTime(updatedAt) {
  if (!updatedAt) {
    return '';
  }

  const syncDate = new Date(updatedAt);

  if (Number.isNaN(syncDate.getTime())) {
    return '';
  }

  return syncDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}


function formatLocalBackupTime(createdAt) {
  if (!createdAt) {
    return '';
  }

  const backupDate = new Date(createdAt);

  if (Number.isNaN(backupDate.getTime())) {
    return '';
  }

  return backupDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getSnapshotSummary(sourceData) {
  if (window.BDFA.dataAdapter && typeof window.BDFA.dataAdapter.summarizeSourceSnapshot === 'function') {
    return window.BDFA.dataAdapter.summarizeSourceSnapshot(sourceData);
  }

  const validation = validateSourceSnapshot(sourceData);

  if (!validation.valid) {
    return { valid: false, summary: null };
  }

  const snapshot = validation.data;
  const accountsAmount = snapshot.accounts.reduce((sum, account) => {
    const amount = Number(account && account.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  return {
    valid: true,
    summary: {
      accountCount: snapshot.accounts.length,
      billCount: snapshot.bills.length,
      allocationCount: snapshot.allocations.length,
      investmentCount: snapshot.investments.length,
      recurringIncomeCount: snapshot.recurringIncome.length,
      assetCount: snapshot.assets.length,
      accountsAmount
    }
  };
}

function getSnapshotComparison(localSnapshot, cloudSnapshot) {
  if (window.BDFA.dataAdapter && typeof window.BDFA.dataAdapter.compareSourceSnapshots === 'function') {
    return window.BDFA.dataAdapter.compareSourceSnapshots(localSnapshot, cloudSnapshot);
  }

  const localSummaryResult = getSnapshotSummary(localSnapshot);
  const cloudSummaryResult = getSnapshotSummary(cloudSnapshot);

  if (!localSummaryResult.valid || !cloudSummaryResult.valid) {
    return { valid: false, comparison: null };
  }

  const localSummary = localSummaryResult.summary;
  const cloudSummary = cloudSummaryResult.summary;

  return {
    valid: true,
    comparison: {
      accountCount: cloudSummary.accountCount - localSummary.accountCount,
      billCount: cloudSummary.billCount - localSummary.billCount,
      allocationCount: cloudSummary.allocationCount - localSummary.allocationCount,
      investmentCount: cloudSummary.investmentCount - localSummary.investmentCount,
      recurringIncomeCount: cloudSummary.recurringIncomeCount - localSummary.recurringIncomeCount,
      assetCount: cloudSummary.assetCount - localSummary.assetCount,
      accountsAmount: cloudSummary.accountsAmount - localSummary.accountsAmount
    }
  };
}

function pluralizeSnapshotLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getSnapshotSummaryLines(summary) {
  const lines = [
    `- ${pluralizeSnapshotLabel(summary.accountCount, 'account')}`,
    `- ${pluralizeSnapshotLabel(summary.billCount, 'bill')}`,
    `- ${pluralizeSnapshotLabel(summary.allocationCount, 'allocation')}`,
    `- ${pluralizeSnapshotLabel(summary.investmentCount, 'investment')}`,
    `- ${pluralizeSnapshotLabel(summary.recurringIncomeCount, 'income row', 'income rows')}`,
    `- ${pluralizeSnapshotLabel(summary.assetCount, 'asset')}`
  ];

  if (Number.isFinite(summary.accountsAmount)) {
    lines.push(`- ${money.format(summary.accountsAmount)} total account amount`);
  }

  return lines;
}

function formatSnapshotDifference(diff, sameLabel, singular, plural = `${singular}s`) {
  if (diff === 0) {
    return `same ${sameLabel}`;
  }

  const prefix = diff > 0 ? '+' : '';
  const absoluteDiff = Math.abs(diff);
  const label = absoluteDiff === 1 ? singular : plural;

  return `${prefix}${diff} ${label}`;
}

function formatSnapshotAmountDifference(amount) {
  if (!Number.isFinite(amount)) {
    return '';
  }

  if (amount === 0) {
    return 'same account amount';
  }

  const amountPrefix = amount > 0 ? '+' : '-';
  return `${amountPrefix}${money.format(Math.abs(amount))} account amount`;
}

function getCompactSnapshotComparison(comparison) {
  const differences = [
    comparison.accountCount === 0 ? '' : formatSnapshotDifference(comparison.accountCount, 'account count', 'account'),
    comparison.billCount === 0 ? '' : formatSnapshotDifference(comparison.billCount, 'bill count', 'bill'),
    comparison.allocationCount === 0 ? '' : formatSnapshotDifference(comparison.allocationCount, 'allocations', 'allocation'),
    comparison.investmentCount === 0 ? '' : formatSnapshotDifference(comparison.investmentCount, 'investments', 'investment'),
    comparison.recurringIncomeCount === 0 ? '' : formatSnapshotDifference(comparison.recurringIncomeCount, 'income rows', 'income row', 'income rows'),
    comparison.assetCount === 0 ? '' : formatSnapshotDifference(comparison.assetCount, 'assets', 'asset'),
    comparison.accountsAmount === 0 ? '' : formatSnapshotAmountDifference(comparison.accountsAmount)
  ].filter(Boolean);

  if (!differences.length) {
    return 'Cloud preview: same source counts and account amount as this device.';
  }

  return `Cloud preview vs this device: ${differences.join(', ')}.`;
}


function getCompactLocalSnapshotComparison(comparison) {
  const differences = [
    comparison.accountCount === 0 ? '' : formatSnapshotDifference(comparison.accountCount, 'account count', 'account'),
    comparison.billCount === 0 ? '' : formatSnapshotDifference(comparison.billCount, 'bill count', 'bill'),
    comparison.allocationCount === 0 ? '' : formatSnapshotDifference(comparison.allocationCount, 'allocations', 'allocation'),
    comparison.investmentCount === 0 ? '' : formatSnapshotDifference(comparison.investmentCount, 'investments', 'investment'),
    comparison.recurringIncomeCount === 0 ? '' : formatSnapshotDifference(comparison.recurringIncomeCount, 'income rows', 'income row', 'income rows'),
    comparison.assetCount === 0 ? '' : formatSnapshotDifference(comparison.assetCount, 'assets', 'asset'),
    comparison.accountsAmount === 0 ? '' : formatSnapshotAmountDifference(comparison.accountsAmount)
  ].filter(Boolean);

  if (!differences.length) {
    return 'Save preview: same source counts and account amount as cloud.';
  }

  return `Save preview vs cloud: ${differences.join(', ')}.`;
}

function formatCloudSaveConfirmation(summary, comparison, hasCloudSnapshot) {
  const lines = [
    'Save current local BDFA data to cloud?',
    '',
    'Local snapshot includes:',
    ...getSnapshotSummaryLines(summary)
  ];

  if (hasCloudSnapshot && comparison) {
    lines.push(
      '',
      'Compared with current cloud:',
      `- ${formatSnapshotDifference(comparison.accountCount, 'account count', 'account')}`,
      `- ${formatSnapshotDifference(comparison.billCount, 'bill count', 'bill')}`,
      `- ${formatSnapshotDifference(comparison.allocationCount, 'allocations', 'allocation')}`,
      `- ${formatSnapshotDifference(comparison.investmentCount, 'investments', 'investment')}`,
      `- ${formatSnapshotDifference(comparison.recurringIncomeCount, 'income rows', 'income row', 'income rows')}`,
      `- ${formatSnapshotDifference(comparison.assetCount, 'assets', 'asset')}`
    );

    if (Number.isFinite(comparison.accountsAmount)) {
      lines.push(`- ${formatSnapshotAmountDifference(comparison.accountsAmount)}`);
    }

    lines.push('', 'This will replace the current cloud snapshot.');
  } else {
    lines.push('', 'No current cloud snapshot was found.');
  }

  lines.push('Local data on this device will not be changed.');

  return lines.join('\n');
}

function formatCloudLoadConfirmation(updatedAt, summary, comparison) {
  const syncTime = formatCloudSyncTime(updatedAt) || 'the cloud';
  const lines = [
    `Load cloud snapshot from ${syncTime}?`,
    '',
    'Cloud snapshot includes:',
    ...getSnapshotSummaryLines(summary)
  ];

  lines.push(
    '',
    'Compared with this device:',
    `- ${formatSnapshotDifference(comparison.accountCount, 'account count', 'account')}`,
    `- ${formatSnapshotDifference(comparison.billCount, 'bill count', 'bill')}`,
    `- ${formatSnapshotDifference(comparison.allocationCount, 'allocations', 'allocation')}`,
    `- ${formatSnapshotDifference(comparison.investmentCount, 'investments', 'investment')}`,
    `- ${formatSnapshotDifference(comparison.recurringIncomeCount, 'income rows', 'income row', 'income rows')}`,
    `- ${formatSnapshotDifference(comparison.assetCount, 'assets', 'asset')}`
  );

  if (Number.isFinite(comparison.accountsAmount)) {
    lines.push(`- ${formatSnapshotAmountDifference(comparison.accountsAmount)}`);
  }

  lines.push(
    '',
    'This will replace current local BDFA data on this device.',
    'A local backup will be created first.'
  );

  return lines.join('\n');
}

function formatRestoreLocalBackupConfirmation(backupCreatedAt, summary) {
  const backupTime = formatLocalBackupTime(backupCreatedAt) || 'the saved backup';
  const lines = [
    `Restore local backup from ${backupTime}?`,
    '',
    'Local backup includes:',
    ...getSnapshotSummaryLines(summary),
    '',
    'This will replace current local BDFA data on this device.'
  ];

  return lines.join('\n');
}

function formatClearLocalBackupConfirmation(backupCreatedAt) {
  const backupTime = formatLocalBackupTime(backupCreatedAt) || 'the saved backup';
  const lines = [
    `Clear local restore backup from ${backupTime}?`,
    '',
    'This only removes the stored restore backup on this device.',
    'Current local BDFA data and cloud data will not be changed.'
  ];

  return lines.join('\n');
}

function waitForStatusPaint() {
  return new Promise(resolve => {
    window.setTimeout(resolve, 0);
  });
}

function updateLocalBackupTimestamp() {
  const backupTimestamp = document.getElementById('localBackupCreatedAt');

  if (!backupTimestamp) {
    return;
  }

  const createdAt = window.BDFA.dataAdapter
    && typeof window.BDFA.dataAdapter.getPreCloudRestoreBackupCreatedAt === 'function'
    ? window.BDFA.dataAdapter.getPreCloudRestoreBackupCreatedAt()
    : null;
  const backupTime = formatLocalBackupTime(createdAt);

  backupTimestamp.hidden = !backupTime;
  backupTimestamp.textContent = backupTime ? `Local restore backup created: ${backupTime}` : '';
}

function getCloudSavedMessage(updatedAt) {
  const syncTime = formatCloudSyncTime(updatedAt);
  return syncTime ? `Cloud last saved: ${syncTime}` : 'Cloud last saved: just now';
}

function getCloudLoadedMessage(updatedAt) {
  const syncTime = formatCloudSyncTime(updatedAt);
  return syncTime ? `Cloud snapshot loaded: ${syncTime}` : 'Cloud snapshot loaded: just now';
}

function setCloudLastSyncMessage(message) {
  cloudLastSyncMessage = message || 'Using local save only';
  const lastSync = document.getElementById('cloudLastSync');

  if (lastSync) {
    lastSync.textContent = cloudLastSyncMessage;
  }
}

function dispatchSourceDataUpdated() {
  window.dispatchEvent(new CustomEvent('bdfa:source-data-updated', {
    detail: window.BDFA.getSourceData()
  }));
}

async function getAuthUser() {
  const supabaseClient = window.BDFA.supabaseClient;

  if (!supabaseClient || !supabaseClient.isConfigured()) {
    return null;
  }

  return supabaseClient.getUser();
}

async function renderAuthStatus(message, tone = 'neutral') {
  updateLocalBackupTimestamp();

  const status = document.getElementById('authStatus');
  const signOutButton = document.getElementById('authSignOut');
  const signUpButton = document.getElementById('authSignUp');
  const signInButton = document.getElementById('authSignIn');
  const cloudSaveButton = document.getElementById('cloudSaveButton');
  const cloudLoadButton = document.getElementById('cloudLoadButton');
  const restoreLocalBackupButton = document.getElementById('restoreLocalBackupButton');
  const clearLocalBackupButton = document.getElementById('clearLocalBackupButton');
  const authInputs = document.querySelectorAll('[data-auth-input]');
  const supabaseClient = window.BDFA.supabaseClient;

  if (!status) {
    return;
  }

  if (!supabaseClient || !supabaseClient.isConfigured()) {
    cloudDirtyIndicatorEligible = false;
    renderCloudDirtyIndicator();
    status.textContent = supabaseClient ? supabaseClient.getConfigurationLabel() : 'Local mode';
    status.dataset.tone = 'neutral';
    setCloudLastSyncMessage('Using local save only');
    authInputs.forEach(input => {
      input.disabled = true;
    });
    if (signOutButton) {
      signOutButton.hidden = true;
    }
    [cloudSaveButton, cloudLoadButton, restoreLocalBackupButton, clearLocalBackupButton].forEach(button => {
      if (button) {
        button.disabled = true;
      }
    });
    [restoreLocalBackupButton, clearLocalBackupButton].forEach(button => {
      if (button) {
        button.hidden = true;
      }
    });
    return;
  }

  const user = await getAuthUser();
  const fallbackMessage = user ? `Signed in as ${user.email || 'Supabase user'} · Cloud save ready` : 'Signed out · Local mode';
  cloudDirtyIndicatorEligible = Boolean(user);
  renderCloudDirtyIndicator();

  status.textContent = message || fallbackMessage;
  if (!user) {
    setCloudLastSyncMessage('Using local save only');
  } else {
    setCloudLastSyncMessage(cloudLastSyncMessage);
  }
  status.dataset.tone = tone;
  authInputs.forEach(input => {
    input.disabled = Boolean(user);
  });

  if (signUpButton) {
    signUpButton.hidden = Boolean(user);
  }

  if (signInButton) {
    signInButton.hidden = Boolean(user);
  }

  if (signOutButton) {
    signOutButton.hidden = !user;
  }

  [cloudSaveButton, cloudLoadButton].forEach(button => {
    if (button) {
      button.disabled = !user || cloudOperationInProgress;
    }
  });

  const hasBackup = window.BDFA.dataAdapter
    && typeof window.BDFA.dataAdapter.hasPreCloudRestoreBackup === 'function'
    && window.BDFA.dataAdapter.hasPreCloudRestoreBackup();

  if (restoreLocalBackupButton) {
    restoreLocalBackupButton.disabled = cloudOperationInProgress || !hasBackup;
    restoreLocalBackupButton.hidden = !hasBackup;
  }

  if (clearLocalBackupButton) {
    clearLocalBackupButton.disabled = cloudOperationInProgress || !hasBackup;
    clearLocalBackupButton.hidden = !hasBackup;
  }
}

async function runCloudOperation(statusMessage, operation) {
  if (cloudOperationInProgress) {
    return null;
  }

  cloudOperationInProgress = true;
  await renderAuthStatus(statusMessage, 'neutral');

  try {
    return await operation();
  } finally {
    cloudOperationInProgress = false;
  }
}

async function handleAuthAction(action) {
  const supabaseClient = window.BDFA.supabaseClient;
  const emailField = document.getElementById('authEmail');
  const passwordField = document.getElementById('authPassword');
  const email = emailField ? emailField.value.trim() : '';
  const password = passwordField ? passwordField.value : '';

  if (!supabaseClient || !supabaseClient.isConfigured()) {
    await renderAuthStatus('Supabase not configured');
    return;
  }

  if (!email || !password) {
    await renderAuthStatus('Enter an email and password to continue.', 'error');
    return;
  }

  const result = action === 'signup' ? await supabaseClient.signUp(email, password) : await supabaseClient.signIn(email, password);

  if (result.error) {
    await renderAuthStatus(result.error.message || 'Auth failed.', 'error');
    return;
  }

  await syncCloudSnapshotAfterAuth();
}

async function syncCloudSnapshotAfterAuth() {
  const result = await window.BDFA.dataAdapter.loadCloudSnapshot();

  if (result.status === 'saved-initial') {
    setLocalChangesPendingCloudSave(false);
    setCloudLastSyncMessage(getCloudSavedMessage(result.updatedAt));
    await renderAuthStatus('Signed in. Local snapshot saved to cloud.', 'success');
    return;
  }

  if (result.status === 'initial-save-failed') {
    await renderAuthStatus('Cloud save failed, using local fallback.', 'error');
    return;
  }

  if (result.status === 'invalid') {
    await renderAuthStatus('Cloud snapshot is invalid. Local data was kept.', 'error');
    return;
  }

  if (result.status === 'backup-failed') {
    await renderAuthStatus('Could not create local backup. Cloud load was canceled.', 'error');
    return;
  }

  if (result.status === 'loaded') {
    setLocalChangesPendingCloudSave(false);
    setCloudLastSyncMessage(getCloudLoadedMessage(result.updatedAt));
    await renderAuthStatus('Signed in. Cloud snapshot loaded.', 'success');
    return;
  }

  await renderAuthStatus();
}

async function handleManualCloudSave() {
  if (cloudOperationInProgress) {
    return;
  }

  if (!window.BDFA.dataAdapter || typeof window.BDFA.dataAdapter.saveCloudSnapshot !== 'function') {
    await renderAuthStatus('Cloud save failed, using local fallback.', 'error');
    return;
  }

  const sourceData = typeof window.BDFA.getSourceData === 'function'
    ? window.BDFA.getSourceData()
    : window.BDFA.dataAdapter.exportData();
  const validation = validateSourceSnapshot(sourceData);

  if (!validation.valid) {
    await renderAuthStatus('Local snapshot is invalid. Cloud save was canceled.', 'error');
    return;
  }

  const summaryResult = getSnapshotSummary(validation.data);

  if (!summaryResult.valid || !summaryResult.summary) {
    await renderAuthStatus('Local snapshot is invalid. Cloud save was canceled.', 'error');
    return;
  }

  if (typeof window.BDFA.dataAdapter.loadCloudSnapshot !== 'function') {
    await renderAuthStatus('Cloud save failed, using local fallback.', 'error');
    return;
  }

  const previewResult = await runCloudOperation('Checking current cloud snapshot...', () => window.BDFA.dataAdapter.loadCloudSnapshot({
    applySnapshot: false,
    saveMissingSnapshot: false
  }));

  if (!previewResult) {
    return;
  }

  if (previewResult.status === 'local') {
    setCloudLastSyncMessage('Using local save only');
    await renderAuthStatus('Signed out · Local mode', 'neutral');
    return;
  }

  if (previewResult.status === 'failed') {
    await renderAuthStatus('Cloud save failed, using local fallback.', 'error');
    return;
  }

  if (previewResult.status === 'invalid') {
    await renderAuthStatus('Cloud snapshot is invalid. Cloud save was canceled.', 'error');
    return;
  }

  let comparison = null;
  const hasCloudSnapshot = previewResult.status !== 'missing' && Boolean(previewResult.data);

  if (hasCloudSnapshot) {
    const cloudValidation = validateSourceSnapshot(previewResult.data);

    if (!cloudValidation.valid) {
      await renderAuthStatus('Cloud snapshot is invalid. Cloud save was canceled.', 'error');
      return;
    }

    const comparisonResult = getSnapshotComparison(cloudValidation.data, validation.data);

    if (!comparisonResult.valid || !comparisonResult.comparison) {
      await renderAuthStatus('Cloud snapshot is invalid. Cloud save was canceled.', 'error');
      return;
    }

    comparison = comparisonResult.comparison;
    setCloudLastSyncMessage(getCompactLocalSnapshotComparison(comparison));
  } else {
    setCloudLastSyncMessage('Cloud last saved: never');
  }

  await renderAuthStatus('Review local snapshot before saving to cloud.', 'neutral');
  await waitForStatusPaint();

  if (!confirm(formatCloudSaveConfirmation(summaryResult.summary, comparison, hasCloudSnapshot))) {
    await renderAuthStatus('Signed in · Cloud save ready', 'neutral');
    return;
  }

  const result = await runCloudOperation('Saving to cloud...', () => window.BDFA.dataAdapter.saveCloudSnapshot(validation.data));

  if (!result) {
    return;
  }

  if (result.status === 'saved') {
    setLocalChangesPendingCloudSave(false);
    setCloudLastSyncMessage(getCloudSavedMessage(result.updatedAt));
    await renderAuthStatus('Saved to cloud.', 'success');
    return;
  }

  if (result.status === 'local') {
    setCloudLastSyncMessage('Using local save only');
    await renderAuthStatus('Signed out · Local mode', 'neutral');
    return;
  }

  if (result.status === 'invalid') {
    await renderAuthStatus('Local snapshot is invalid. Cloud save was canceled.', 'error');
    return;
  }

  await renderAuthStatus('Cloud save failed, using local fallback.', 'error');
}

async function handleManualCloudLoad() {
  if (cloudOperationInProgress) {
    return;
  }

  if (!window.BDFA.dataAdapter || typeof window.BDFA.dataAdapter.loadCloudSnapshot !== 'function') {
    await renderAuthStatus('Cloud load failed, using local fallback.', 'error');
    return;
  }

  const result = await runCloudOperation('Loading cloud snapshot...', () => window.BDFA.dataAdapter.loadCloudSnapshot({
    applySnapshot: false,
    saveMissingSnapshot: false
  }));

  if (!result) {
    return;
  }

  if (result.status === 'missing') {
    setCloudLastSyncMessage('Cloud last saved: never');
    await renderAuthStatus('No cloud snapshot found.', 'neutral');
    return;
  }

  if (result.status === 'local') {
    setCloudLastSyncMessage('Using local save only');
    await renderAuthStatus('Signed out · Local mode', 'neutral');
    return;
  }

  if (result.status === 'failed' || !result.data) {
    await renderAuthStatus('Cloud load failed, using local fallback.', 'error');
    return;
  }

  const validation = validateSourceSnapshot(result.data);

  if (result.status === 'invalid' || !validation.valid) {
    await renderAuthStatus('Cloud snapshot is invalid. Local data was kept.', 'error');
    return;
  }

  const summaryResult = getSnapshotSummary(validation.data);

  if (!summaryResult.valid || !summaryResult.summary) {
    await renderAuthStatus('Cloud snapshot is invalid. Local data was kept.', 'error');
    return;
  }

  const localSourceData = typeof window.BDFA.getSourceData === 'function'
    ? window.BDFA.getSourceData()
    : window.BDFA.dataAdapter.exportData();
  const localValidation = validateSourceSnapshot(localSourceData);

  if (!localValidation.valid) {
    await renderAuthStatus('Local snapshot is invalid. Cloud load was canceled.', 'error');
    return;
  }

  const comparisonResult = getSnapshotComparison(localValidation.data, validation.data);

  if (!comparisonResult.valid || !comparisonResult.comparison) {
    await renderAuthStatus('Cloud snapshot is invalid. Local data was kept.', 'error');
    return;
  }

  await renderAuthStatus('Review cloud snapshot differences before loading.', 'neutral');
  setCloudLastSyncMessage(getCompactSnapshotComparison(comparisonResult.comparison));
  await waitForStatusPaint();

  if (!confirm(formatCloudLoadConfirmation(result.updatedAt, summaryResult.summary, comparisonResult.comparison))) {
    await renderAuthStatus('Signed in · Cloud save ready', 'neutral');
    return;
  }

  const applyResult = await runCloudOperation('Loading cloud snapshot...', async () => {
    if (!window.BDFA.dataAdapter.createPreCloudRestoreBackup()) {
      return { status: 'backup-failed' };
    }

    const persistedData = saveSourceDataLocally(validation.data);
    applyPersistedSourceData(persistedData);
    return { status: 'loaded' };
  });

  if (!applyResult) {
    return;
  }

  if (applyResult.status === 'backup-failed') {
    await renderAuthStatus('Could not create local backup. Cloud load was canceled.', 'error');
    return;
  }

  setCloudLastSyncMessage(getCloudLoadedMessage(result.updatedAt));
  setLocalChangesPendingCloudSave(false);
  updateLocalBackupTimestamp();
  await renderAuthStatus('Cloud snapshot loaded. Previous local data was backed up.', 'success');
}

async function handleRestoreLocalBackup() {
  if (cloudOperationInProgress) {
    return;
  }

  if (!window.BDFA.dataAdapter || typeof window.BDFA.dataAdapter.readPreCloudRestoreBackup !== 'function') {
    await renderAuthStatus('Local backup could not be restored.', 'error');
    return;
  }

  const backup = window.BDFA.dataAdapter.readPreCloudRestoreBackup();

  if (!backup.valid) {
    await renderAuthStatus('Local backup could not be restored.', 'error');
    return;
  }

  const summaryResult = getSnapshotSummary(backup.data);

  if (!summaryResult.valid || !summaryResult.summary) {
    await renderAuthStatus('Local backup could not be restored.', 'error');
    return;
  }

  if (!confirm(formatRestoreLocalBackupConfirmation(backup.createdAt, summaryResult.summary))) {
    return;
  }

  const result = await runCloudOperation('Restoring local backup...', async () => {
    const persistedData = saveSourceDataLocally(backup.data);

    if (!persistedData) {
      return { status: 'invalid' };
    }

    applyPersistedSourceData(persistedData);
    setLocalChangesPendingCloudSave(true);
    return { status: 'restored' };
  });

  if (!result) {
    return;
  }

  if (result.status !== 'restored') {
    await renderAuthStatus('Local backup could not be restored.', 'error');
    return;
  }

  await renderAuthStatus('Local backup restored.', 'success');
}

async function handleClearLocalBackup() {
  if (cloudOperationInProgress) {
    return;
  }

  if (!window.BDFA.dataAdapter
    || typeof window.BDFA.dataAdapter.readPreCloudRestoreBackup !== 'function'
    || typeof window.BDFA.dataAdapter.clearPreCloudRestoreBackup !== 'function') {
    await renderAuthStatus('Local backup could not be cleared.', 'error');
    return;
  }

  const backup = window.BDFA.dataAdapter.readPreCloudRestoreBackup();

  if (!backup.valid) {
    await renderAuthStatus('No local restore backup to clear.', 'neutral');
    return;
  }

  if (!confirm(formatClearLocalBackupConfirmation(backup.createdAt))) {
    return;
  }

  if (!window.BDFA.dataAdapter.clearPreCloudRestoreBackup()) {
    await renderAuthStatus('Local backup could not be cleared.', 'error');
    return;
  }

  updateLocalBackupTimestamp();
  await renderAuthStatus('Local restore backup cleared.', 'success');
}

async function handleSignOut() {
  const supabaseClient = window.BDFA.supabaseClient;

  if (!supabaseClient) {
    return;
  }

  const result = await supabaseClient.signOut();

  if (result.error) {
    await renderAuthStatus(result.error.message || 'Sign out failed.', 'error');
    return;
  }

  setCloudLastSyncMessage('Using local save only');
  await renderAuthStatus('Signed out · Local mode');
}

function exportDemoData() {
  const exportedJson = JSON.stringify(window.BDFA.dataAdapter.exportData(getExportData()), null, 2);
  const exportField = document.getElementById('exportData');

  if (exportField) {
    exportField.value = exportedJson;
  }

  const blob = new Blob([exportedJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'bdfa-demo-data.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showStatus('Demo data exported as JSON.');
}

function resetDemoData() {
  if (!confirm('Reset BDFA demo data back to the original mock dataset?')) {
    return;
  }

  const freshData = saveSourceDataLocally(demoData);
  data.accounts = freshData.accounts;
  data.bills = freshData.bills;
  data.allocations = freshData.allocations;
  data.investments = freshData.investments;
  data.assets = freshData.assets;
  data.recurringIncome = freshData.recurringIncome;
  resetAccountForm();
  resetBillForm();
  resetAllocationForm();
  resetInvestmentForm();
  resetAssetForm();
  resetRecurringIncomeForm();
  renderAllSections();
  setLocalChangesPendingCloudSave(true);
  dispatchSourceDataUpdated();
  showStatus('Demo data reset to the original mock dataset.');
}

function handleSourceDataUpdated(event) {
  if (!event.detail) {
    return;
  }

  applySourceDataSnapshot(event.detail);
  renderAllSections();
}

function addOptionalEventListener(id, eventName, handler, options) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener(eventName, handler, options);
  }
}

function togglePanel(button) {
  const panel = button.closest('.panel');
  const body = panel ? panel.querySelector('.panel-body') : null;

  if (!panel || !body) {
    return;
  }

  const shouldCollapse = !body.hidden;

  panel.classList.toggle('collapsed', shouldCollapse);
  body.hidden = shouldCollapse;
  syncPanelToggleAriaState(button);
  saveCollapsedPanels();
}

addOptionalEventListener('accountForm', 'submit', handleAccountSubmit);
addOptionalEventListener('accountCancel', 'click', resetAccountForm);
addOptionalEventListener('accountsList', 'click', handleAccountActions);
addOptionalEventListener('billForm', 'submit', handleBillSubmit);
addOptionalEventListener('billCancel', 'click', resetBillForm);
addOptionalEventListener('billsList', 'click', handleBillActions);
addOptionalEventListener('allocationForm', 'submit', handleAllocationSubmit);
addOptionalEventListener('allocationCancel', 'click', resetAllocationForm);
addOptionalEventListener('allocationsList', 'click', handleAllocationActions);
addOptionalEventListener('investmentForm', 'submit', handleInvestmentSubmit);
addOptionalEventListener('assetForm', 'submit', handleAssetSubmit);
addOptionalEventListener('assetCancel', 'click', resetAssetForm);
addOptionalEventListener('assetsList', 'click', handleAssetActions);
addOptionalEventListener('investmentCancel', 'click', resetInvestmentForm);
addOptionalEventListener('investmentsList', 'click', handleInvestmentActions);
addOptionalEventListener('recurringIncomeForm', 'submit', handleRecurringIncomeSubmit);
addOptionalEventListener('recurringIncomeCancel', 'click', resetRecurringIncomeForm);
addOptionalEventListener('recurringIncomeList', 'click', handleRecurringIncomeActions);
addOptionalEventListener('importButton', 'click', importDemoData);
addOptionalEventListener('exportButton', 'click', exportDemoData);
addOptionalEventListener('resetButton', 'click', resetDemoData);
addOptionalEventListener('authForm', 'submit', event => {
  event.preventDefault();
  handleAuthAction('signin');
});
addOptionalEventListener('authSignUp', 'click', () => handleAuthAction('signup'));
addOptionalEventListener('authSignIn', 'click', () => handleAuthAction('signin'));
addOptionalEventListener('authSignOut', 'click', handleSignOut);
addOptionalEventListener('cloudSaveButton', 'click', handleManualCloudSave);
addOptionalEventListener('cloudLoadButton', 'click', handleManualCloudLoad);
addOptionalEventListener('restoreLocalBackupButton', 'click', handleRestoreLocalBackup);
addOptionalEventListener('clearLocalBackupButton', 'click', handleClearLocalBackup);

window.addEventListener('bdfa:source-data-updated', handleSourceDataUpdated);
window.addEventListener('bdfa:supabase-status-changed', event => {
  const status = event.detail || {};
  renderAuthStatus(status.message, status.tone);
});

if (window.BDFA.supabaseClient) {
  window.BDFA.supabaseClient.onAuthStateChange(() => {
    syncCloudSnapshotAfterAuth();
  });
}

document.querySelectorAll('[data-toggle]').forEach(button => {
  button.addEventListener('click', () => togglePanel(button));
});

applySourceDataSnapshot(window.BDFA.dataAdapter.loadSourceData(demoData));
hydrateLocalChangesPendingCloudSave();
renderAllSections();
applySavedPanelState();
renderAuthStatus();
window.BDFA.dataAdapter.loadCloudSnapshot().then(result => {
  if (!result) {
    return;
  }

  if (result.status === 'saved-initial') {
    setLocalChangesPendingCloudSave(false);
    setCloudLastSyncMessage(getCloudSavedMessage(result.updatedAt));
    renderAuthStatus('Signed in. Local snapshot saved to cloud.', 'success');
  }

  if (result.status === 'loaded') {
    setLocalChangesPendingCloudSave(false);
    setCloudLastSyncMessage(getCloudLoadedMessage(result.updatedAt));
    renderAuthStatus('Signed in. Cloud snapshot loaded.', 'success');
  }
}).catch(() => {
  renderAuthStatus('Cloud load failed, using local fallback.', 'error');
});
