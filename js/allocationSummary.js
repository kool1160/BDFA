function getAllocationMixText() {
  const targetedAllocations = data.allocations.filter(hasAllocationTarget);

  if (!targetedAllocations.length) {
    return data.allocations.length ? `${data.allocations.length} allocations` : '';
  }

  const completedCount = targetedAllocations.filter(allocation => allocation.amount >= allocation.targetAmount).length;
  const targetText = targetedAllocations.length === 1 ? '1 target' : `${targetedAllocations.length} targets`;

  return completedCount ? `${targetText} • ${completedCount} complete` : targetText;
}

function renderAllocationsMixHelper() {
  const target = document.getElementById('allocationsMix');

  if (!target) {
    return;
  }

  const mixText = getAllocationMixText();

  if (!mixText) {
    target.hidden = true;
    target.textContent = '';
    return;
  }

  target.textContent = mixText;
  target.hidden = false;
}

const baseRenderAllocations = renderAllocations;

renderAllocations = function renderAllocationsWithHelper() {
  renderAllocationsMixHelper();
  baseRenderAllocations();
};

renderAllocations();
