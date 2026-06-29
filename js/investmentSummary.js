function getInvestmentMixText() {
  const count = data.investments.length;

  if (!count) {
    return '';
  }

  return count === 1 ? '1 holding' : `${count} holdings`;
}

function renderInvestmentsMixHelper() {
  const target = document.getElementById('investmentsMix');

  if (!target) {
    return;
  }

  const mixText = getInvestmentMixText();

  if (!mixText) {
    target.hidden = true;
    target.textContent = '';
    return;
  }

  target.textContent = mixText;
  target.hidden = false;
}

renderInvestments = function renderInvestmentsWithHelper() {
  const target = document.getElementById('investmentsList');

  renderInvestmentsMixHelper();

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
      <strong class="row-money money-growth">${money.format(investment.amount)}</strong>
      <div class="row-actions" aria-label="Investment actions">
        <button type="button" data-edit-investment="${investment.id}">Edit</button>
        <button type="button" data-delete-investment="${investment.id}">Delete</button>
      </div>
    </div>
  `).join('');
};

renderInvestments();
