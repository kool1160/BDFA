const accountTypeOrder = ['Cash', 'Credit Card', 'Debt'];

function getSortedAccountsForDisplay() {
  return [...data.accounts].sort((firstAccount, secondAccount) => (
    accountTypeOrder.indexOf(firstAccount.type) - accountTypeOrder.indexOf(secondAccount.type)
  ));
}

function getAccountGroupLabel(account, previousType) {
  if (account.type === previousType) {
    return '';
  }

  return `<div class="account-group-label">${account.type}</div>`;
}

function getAccountMixText() {
  return accountTypeOrder
    .map(type => {
      const count = data.accounts.filter(account => account.type === type).length;
      return count ? `${count} ${type}` : '';
    })
    .filter(Boolean)
    .join(' • ');
}

function renderAccountsMixHelper() {
  const target = document.getElementById('accountsMix');

  if (!target) {
    return;
  }

  const mixText = getAccountMixText();

  if (!mixText) {
    target.hidden = true;
    target.textContent = '';
    return;
  }

  target.textContent = mixText;
  target.hidden = false;
}

function getAccountBalanceClass(account) {
  return account.amount < 0 ? 'negative-balance' : '';
}

renderAccounts = function renderGroupedAccounts() {
  const target = document.getElementById('accountsList');

  renderAccountsMixHelper();

  if (!data.accounts.length) {
    target.innerHTML = getEmptyState('No accounts yet', 'Add your first mock account to show cash, debt, and net worth clearly.');
    return;
  }

  let previousType = '';

  target.innerHTML = getSortedAccountsForDisplay().map(account => {
    const groupLabel = getAccountGroupLabel(account, previousType);
    previousType = account.type;

    return `
      ${groupLabel}
      <div class="row editable-row account-row ${getAccountBalanceClass(account)}">
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
    `;
  }).join('');
};

renderAccounts();
