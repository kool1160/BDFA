const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const accountStorageKey = 'bdfa.mockAccounts';

const data = {
  accounts: [
    { id: 'checking', name: 'Chase Checking', type: 'Cash', amount: 8420 },
    { id: 'savings', name: 'Huntington Savings', type: 'Cash', amount: 3211 },
    { id: 'capital-one', name: 'Capital One', type: 'Credit Card', amount: -1104 },
    { id: 'mortgage', name: 'Mortgage', type: 'Debt', amount: -40567 }
  ],
  bills: [
    { name: 'Mortgage', detail: 'Monthly reserve', amount: 1259 },
    { name: 'Consumers Energy', detail: 'Estimated monthly', amount: 182 },
    { name: 'Gas', detail: 'Estimated monthly', amount: 78 },
    { name: 'Car Insurance', detail: '$720 every 6 months', amount: 120 },
    { name: 'Subscriptions', detail: 'Monthly', amount: 77 }
  ],
  allocations: [
    { name: 'Emergency Reserve', detail: 'Target $10,000', amount: 6400 },
    { name: 'Vacation', detail: 'Growing monthly', amount: 950 },
    { name: 'Car Maintenance', detail: 'Oil, tires, repairs', amount: 420 },
    { name: 'HSA Contribution', detail: 'Available after bills', amount: 300 }
  ],
  investments: [
    { name: '401(k)', detail: 'Retirement', amount: 248000 },
    { name: 'HSA', detail: 'Invested medical savings', amount: 18540 },
    { name: 'Roth IRA', detail: 'Tax-free retirement', amount: 116000 },
    { name: 'Brokerage', detail: 'Taxable investing', amount: 105102 }
  ]
};

function total(rows) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function setMoneyText(targetId, amount) {
  const target = document.getElementById(targetId);

  if (target) {
    target.textContent = money.format(amount);
  }
}

function loadAccounts() {
  const savedAccounts = localStorage.getItem(accountStorageKey);

  if (!savedAccounts) {
    return;
  }

  try {
    const parsedAccounts = JSON.parse(savedAccounts);

    if (Array.isArray(parsedAccounts)) {
      data.accounts = parsedAccounts;
    }
  } catch {
    localStorage.removeItem(accountStorageKey);
  }
}

function saveAccounts() {
  localStorage.setItem(accountStorageKey, JSON.stringify(data.accounts));
}

function getDashboardTotals() {
  const cash = total(data.accounts.filter(account => account.type === 'Cash'));
  const investments = total(data.investments);
  const debt = Math.abs(total(data.accounts.filter(account => account.amount < 0)));
  const bills = total(data.bills);
  const allocations = total(data.allocations);

  return {
    cash,
    investments,
    debt,
    netWorth: cash + investments - debt,
    availableToAllocate: cash - bills - allocations
  };
}

function renderDashboardTotals() {
  const totals = getDashboardTotals();

  setMoneyText('availableToAllocate', totals.availableToAllocate);
  setMoneyText('netWorth', totals.netWorth);
  setMoneyText('cashTotal', totals.cash);
  setMoneyText('investmentTotal', totals.investments);
  setMoneyText('debtTotal', totals.debt);
}

function renderRows(targetId, rows) {
  const target = document.getElementById(targetId);
  target.innerHTML = rows.map(row => `
    <div class="row">
      <div>
        <strong>${row.name}</strong>
        <small>${row.detail || row.type}</small>
      </div>
      <strong>${money.format(row.amount)}</strong>
    </div>
  `).join('');
}

function resetAccountForm() {
  document.getElementById('accountForm').reset();
  document.getElementById('accountId').value = '';
  document.getElementById('accountSubmit').textContent = 'Add Account';
  document.getElementById('accountCancel').hidden = true;
}

function renderAccounts() {
  const target = document.getElementById('accountsList');

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

  saveAccounts();
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
    saveAccounts();
    resetAccountForm();
    renderAccountsDashboard();
  }
}

loadAccounts();
renderAccountsDashboard();
renderRows('bills', data.bills);
renderRows('allocations', data.allocations);
renderRows('investments', data.investments);

document.getElementById('accountForm').addEventListener('submit', handleAccountSubmit);
document.getElementById('accountCancel').addEventListener('click', resetAccountForm);
document.getElementById('accountsList').addEventListener('click', handleAccountActions);

document.querySelectorAll('[data-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const panel = button.closest('.panel');
    panel.classList.toggle('collapsed');
    const body = panel.querySelector('.panel-body');
    body.hidden = !body.hidden;
  });
});
