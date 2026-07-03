(function initMobileViews() {
  const mobileViewQuery = window.matchMedia('(max-width: 759px)');
  const defaultView = 'overview';
  let selectedView = defaultView;

  const viewSections = Array.from(document.querySelectorAll('[data-mobile-view]'));
  const navItems = Array.from(document.querySelectorAll('[data-mobile-view-target]'));
  const openPanelTargetsByView = {
    bills: 'bills',
    income: 'recurringIncome'
  };

  function getActiveViewStart() {
    return viewSections.find(section => (
      section.dataset.mobileView === selectedView &&
      section.classList.contains('mobile-view-header')
    )) || viewSections.find(section => section.dataset.mobileView === selectedView) || null;
  }

  function setSectionVisibility(isMobile) {
    viewSections.forEach(section => {
      const isActive = !isMobile || section.dataset.mobileView === selectedView;

      section.hidden = !isActive;

      if ('inert' in section) {
        section.inert = isMobile && !isActive;
      }
    });
  }

  function setNavState() {
    navItems.forEach(item => {
      const isActive = item.dataset.mobileViewTarget === selectedView;

      item.classList.toggle('is-active', isActive);

      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  function openPanel(targetId) {
    if (!targetId) {
      return;
    }

    const panelBody = document.getElementById(targetId);
    const panel = panelBody ? panelBody.closest('.panel') : null;
    const button = panel ? panel.querySelector(`[data-toggle="${targetId}"]`) : null;

    if (!panel || !panelBody) {
      return;
    }

    panel.classList.remove('collapsed');
    panelBody.hidden = false;

    if (button) {
      button.setAttribute('aria-expanded', 'true');

      if (panelBody.id) {
        button.setAttribute('aria-controls', panelBody.id);
      }
    }
  }

  function prepareSelectedView(isMobile) {
    if (!isMobile) {
      return;
    }

    openPanel(openPanelTargetsByView[selectedView]);
  }

  function scrollSelectedViewIntoPlace() {
    const activeSection = getActiveViewStart();

    if (!activeSection) {
      return;
    }

    requestAnimationFrame(() => {
      activeSection.scrollIntoView({
        block: 'start',
        behavior: 'smooth'
      });
    });
  }

  function applyMobileView({ scrollToView = false } = {}) {
    const isMobile = mobileViewQuery.matches;

    document.body.classList.toggle('has-mobile-views', isMobile);
    setSectionVisibility(isMobile);
    prepareSelectedView(isMobile);
    setNavState();

    if (isMobile && scrollToView) {
      scrollSelectedViewIntoPlace();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const nextView = item.dataset.mobileViewTarget;

      if (!nextView) {
        return;
      }

      selectedView = nextView;
      applyMobileView({ scrollToView: true });
    });
  });

  if (typeof mobileViewQuery.addEventListener === 'function') {
    mobileViewQuery.addEventListener('change', () => applyMobileView());
  } else if (typeof mobileViewQuery.addListener === 'function') {
    mobileViewQuery.addListener(() => applyMobileView());
  }

  applyMobileView();
}());
