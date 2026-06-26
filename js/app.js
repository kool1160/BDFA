const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const data = {
  accounts: [
    { name: 'Chase Checking', type: 'Cash', amount: 8420 },
    { name: 'Huntington Savings', type: 'Cash', amount: 3211 },
    { name: 'Capital One', type: 'Credit Card', amount: -1104 },
    { name: 'Mortgage', type: 'Debt', amount: -40567 }
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

renderRows('accounts', data.accounts);
renderRows('bills', data.bills);
renderRows('allocations', data.allocations);
renderRows('investments', data.investments);

document.querySelectorAll('[data-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const panel = button.closest('.panel');
    panel.classList.toggle('collapsed');
    const body = panel.querySelector('.panel-body');
    body.hidden = !body.hidden;
  });
});
