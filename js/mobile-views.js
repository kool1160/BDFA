(function initMobileViews() {
  const mobileViewQuery = window.matchMedia('(max-width: 759px)');
  const defaultView = 'overview';
  let selectedView = defaultView;

  const viewSections = Array.from(document.querySelectorAll('[data-mobile-view]'));
  const navItems = Array.from(document.querySelectorAll('[data-mobile-view-target]'));

  function setSectionVisibility(isMobile) {
    viewSections.forEach(section => {
      const isActive = !isMobile || section.dataset.mobileView === selectedView;
      section.hidden = !isActive;
      if ('inert' in section) {
        section.inert = !isActive;
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

  function applyMobileView({ scrollToTop = false } = {}) {
    const isMobile = mobileViewQuery.matches;
    document.body.classList.toggle('has-mobile-views', isMobile);
    setSectionVisibility(isMobile);
    setNavState();

    if (isMobile && scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const nextView = item.dataset.mobileViewTarget;
      if (!nextView || nextView === selectedView) {
        return;
      }

      selectedView = nextView;
      applyMobileView({ scrollToTop: true });
    });
  });

  if (typeof mobileViewQuery.addEventListener === 'function') {
    mobileViewQuery.addEventListener('change', () => applyMobileView());
  } else if (typeof mobileViewQuery.addListener === 'function') {
    mobileViewQuery.addListener(() => applyMobileView());
  }

  applyMobileView();
}());
