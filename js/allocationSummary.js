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

renderAllocations = function renderAllocationsWithHelper() {
  const target = document.getElementById('allocationsList');

  renderAllocationsMixHelper();

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
      <strong class="row-money money-caution">${money.format(allocation.amount)}</strong>
      <div class="row-actions" aria-label="Allocation actions">
        <button type="button" data-edit-allocation="${allocation.id}">Edit</button>
        <button type="button" data-delete-allocation="${allocation.id}">Delete</button>
      </div>
    </div>
  `).join('');
};

renderAllocations();
