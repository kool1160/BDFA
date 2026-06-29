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

const baseRenderInvestments = renderInvestments;

renderInvestments = function renderInvestmentsWithHelper() {
  renderInvestmentsMixHelper();
  baseRenderInvestments();
};

renderInvestments();
