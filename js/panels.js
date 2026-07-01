function syncPanelToggleState(button) {
  const panel = button.closest('.panel');
  const body = panel.querySelector('.panel-body');
  const isExpanded = !body.hidden;

  button.setAttribute('aria-expanded', String(isExpanded));
  button.setAttribute('aria-controls', body.id);
}

function togglePanel(button) {
  const panel = button.closest('.panel');
  const body = panel.querySelector('.panel-body');

  panel.classList.toggle('collapsed');
  body.hidden = !body.hidden;
  syncPanelToggleState(button);
  saveCollapsedPanels();
}

document.querySelectorAll('[data-toggle]').forEach(button => {
  syncPanelToggleState(button);

  button.addEventListener('click', () => {
    togglePanel(button);
  });
});
