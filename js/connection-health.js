(function () {
  'use strict';

  window.BDFA = window.BDFA || {};

  const storageKey = 'bdfa.connectionHealth';
  const refreshIntervalMs = 15 * 60 * 1000;
  const staleAfterMs = 24 * 60 * 60 * 1000;
  let refreshTimer = null;
  let state = readState();

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  }

  function writeState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Health display remains useful for the current session if storage is unavailable.
    }
  }

  function formatTime(value, fallback = 'Not yet') {
    if (!value) {
      return fallback;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? fallback
      : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function render() {
    const badge = document.getElementById('connectionHealthBadge');
    const warning = document.getElementById('connectionHealthWarning');
    const refreshButton = document.getElementById('cloudRefreshButton');
    const configured = Boolean(window.BDFA.supabaseClient && window.BDFA.supabaseClient.isConfigured());
    const userPromise = configured && typeof window.BDFA.supabaseClient.getUser === 'function'
      ? window.BDFA.supabaseClient.getUser()
      : Promise.resolve(null);

    setText('connectionLastSuccess', formatTime(state.lastSuccessfulAt));
    setText('connectionLastAttempt', formatTime(state.lastAttemptedAt));
    setText('connectionSourceTimestamp', formatTime(state.sourceTimestamp, 'Unavailable'));

    userPromise.then(user => {
      let label = configured ? (user ? 'Healthy' : 'Reauthentication required') : 'Local only';
      let tone = configured && user ? 'success' : 'neutral';

      if (state.status === 'failed' || state.status === 'invalid' || state.status === 'backup-failed') {
        label = 'Sync error';
        tone = 'error';
      } else if (state.status === 'local-dirty') {
        label = 'Local changes pending';
        tone = 'warning';
      } else if (state.lastSuccessfulAt && Date.now() - new Date(state.lastSuccessfulAt).getTime() > staleAfterMs) {
        label = 'Stale data';
        tone = 'warning';
      }

      if (badge) {
        badge.textContent = label;
        badge.dataset.tone = tone;
      }

      if (warning) {
        const message = state.status === 'failed'
          ? 'The last sync failed. Local data is still available; try again when the connection is ready.'
          : state.status === 'invalid'
            ? 'The cloud snapshot could not be trusted. Local data was kept.'
            : state.status === 'backup-failed'
              ? 'A local recovery backup could not be created, so cloud data was not applied.'
              : state.status === 'local-dirty'
                ? 'Local changes are waiting to be saved before cloud data can be loaded.'
                : state.lastSuccessfulAt && Date.now() - new Date(state.lastSuccessfulAt).getTime() > staleAfterMs
                  ? 'The last successful sync is more than 24 hours old. Refresh when the connection is ready.'
                : !user && configured
                  ? 'Sign in again to resume automatic sync.'
                  : state.status === 'attempted'
                    ? 'A sync was interrupted. Refresh to retry safely.'
                    : '';
        warning.hidden = !message;
        warning.textContent = message;
      }

      if (refreshButton) {
        refreshButton.disabled = !user || Boolean(state.refreshing);
      }
    }).catch(() => {
      if (badge) {
        badge.textContent = 'Reauthentication required';
        badge.dataset.tone = 'warning';
      }
    });
  }

  function handleSync(event) {
    const detail = event.detail || {};
    state.status = detail.status || 'attempted';
    state.lastAttemptedAt = detail.attemptedAt || new Date().toISOString();
    state.sourceTimestamp = detail.sourceTimestamp || state.sourceTimestamp || null;
    state.refreshing = false;

    if (['loaded', 'saved', 'saved-initial'].includes(detail.status)) {
      state.lastSuccessfulAt = state.lastAttemptedAt;
    }

    writeState();
    render();
  }

  async function refresh() {
    if (state.refreshing || !window.BDFA.dataAdapter || !window.BDFA.supabaseClient) {
      return null;
    }

    const user = await window.BDFA.supabaseClient.getUser();
    if (!user) {
      render();
      return null;
    }

    state.refreshing = true;
    state.status = 'attempted';
    writeState();
    render();
    return window.BDFA.dataAdapter.loadCloudSnapshot({ applySnapshot: true, saveMissingSnapshot: false });
  }

  function scheduleRefresh() {
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(() => {
      refresh();
    }, refreshIntervalMs);
  }

  window.addEventListener('bdfa:cloud-sync', handleSync);
  window.addEventListener('bdfa:supabase-status-changed', render);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      render();
    }
  });

  const refreshButton = document.getElementById('cloudRefreshButton');
  if (refreshButton) {
    refreshButton.addEventListener('click', refresh);
  }

  if (window.BDFA.supabaseClient && typeof window.BDFA.supabaseClient.onAuthStateChange === 'function') {
    window.BDFA.supabaseClient.onAuthStateChange(() => {
      render();
      scheduleRefresh();
    });
  }

  window.BDFA.connectionHealth = { getState: () => ({ ...state }), refresh };
  scheduleRefresh();
  render();
}());
