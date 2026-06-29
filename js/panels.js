function syncPanelToggleState(button) {
  const panel = button.closest('.panel');
  const body = panel.querySelector('.panel-body');
  const isExpanded = !body.hidden;

  button.setAttribute('aria-expanded', String(isExpanded));
  button.setAttribute('aria-controls', body.id);
}

document.querySelectorAll('[data-toggle]').forEach(button => {
  syncPanelToggleState(button);

  button.addEventListener('click', () => {
    syncPanelToggleState(button);
  });
});
