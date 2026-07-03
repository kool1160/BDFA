(function () {
  'use strict';

  window.BDFA = window.BDFA || {};

  const snapshotsTable = 'bdfa_source_snapshots';
  const config = window.BDFA_SUPABASE_CONFIG || {};
  let client = null;
  let lastStatusMessage = '';
  let lastStatusTone = 'neutral';

  function hasConfig() {
    return Boolean(config.url && config.anonKey);
  }

  function hasLibrary() {
    return Boolean(window.supabase && typeof window.supabase.createClient === 'function');
  }

  function setStatus(message, tone = 'neutral') {
    lastStatusMessage = message;
    lastStatusTone = tone;
    window.dispatchEvent(new CustomEvent('bdfa:supabase-status-changed', {
      detail: getStatus()
    }));
  }

  function getClient() {
    if (client || !hasConfig() || !hasLibrary()) {
      return client;
    }

    client = window.supabase.createClient(config.url, config.anonKey);
    return client;
  }

  function isConfigured() {
    return hasConfig() && hasLibrary() && Boolean(getClient());
  }

  function getConfigurationLabel() {
    if (!hasConfig()) {
      return 'Supabase not configured';
    }

    if (!hasLibrary()) {
      return 'Supabase script not loaded';
    }

    return 'Supabase configured';
  }

  async function getSession() {
    const supabase = getClient();

    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setStatus(error.message || 'Could not read Supabase session.', 'error');
        return null;
      }

      return data.session || null;
    } catch {
      setStatus('Could not read Supabase session.', 'error');
      return null;
    }
  }

  async function getUser() {
    const session = await getSession();
    return session ? session.user : null;
  }

  async function signUp(email, password) {
    const supabase = getClient();

    if (!supabase) {
      return { data: null, error: new Error(getConfigurationLabel()) };
    }

    const result = await supabase.auth.signUp({ email, password });

    if (result.error) {
      setStatus(result.error.message || 'Sign up failed.', 'error');
    } else {
      setStatus('Sign up complete. Check your email if confirmation is required.', 'success');
    }

    return result;
  }

  async function signIn(email, password) {
    const supabase = getClient();

    if (!supabase) {
      return { data: null, error: new Error(getConfigurationLabel()) };
    }

    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setStatus(result.error.message || 'Sign in failed.', 'error');
    } else {
      setStatus('Signed in. Cloud save ready.', 'success');
    }

    return result;
  }

  async function signOut() {
    const supabase = getClient();

    if (!supabase) {
      return { error: null };
    }

    const result = await supabase.auth.signOut();

    if (result.error) {
      setStatus(result.error.message || 'Sign out failed.', 'error');
    } else {
      setStatus('Signed out. Local mode active.', 'neutral');
    }

    return result;
  }

  async function loadSnapshot() {
    const supabase = getClient();
    const user = await getUser();

    if (!supabase || !user) {
      return { data: null, error: null, status: 'local' };
    }

    try {
      const { data, error } = await supabase
        .from(snapshotsTable)
        .select('source_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        setStatus('Cloud load failed, using local fallback.', 'error');
        return { data: null, error, status: 'failed' };
      }

      if (!data || !data.source_data) {
        setStatus('Signed in. No cloud snapshot yet.', 'neutral');
        return { data: null, error: null, status: 'missing' };
      }

      setStatus('Cloud snapshot loaded.', 'success');
      return { data: data.source_data, error: null, status: 'loaded' };
    } catch (error) {
      setStatus('Cloud load failed, using local fallback.', 'error');
      return { data: null, error, status: 'failed' };
    }
  }

  async function saveSnapshot(sourceData) {
    const supabase = getClient();
    const user = await getUser();

    if (!supabase || !user) {
      return { data: null, error: null, status: 'local' };
    }

    try {
      const { data, error } = await supabase
        .from(snapshotsTable)
        .upsert({
          user_id: user.id,
          source_data: sourceData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select('source_data')
        .single();

      if (error) {
        setStatus('Cloud save failed, using local fallback.', 'error');
        return { data: null, error, status: 'failed' };
      }

      setStatus('Cloud save ready.', 'success');
      return { data, error: null, status: 'saved' };
    } catch (error) {
      setStatus('Cloud save failed, using local fallback.', 'error');
      return { data: null, error, status: 'failed' };
    }
  }

  function onAuthStateChange(callback) {
    const supabase = getClient();

    if (!supabase || !supabase.auth || typeof supabase.auth.onAuthStateChange !== 'function') {
      return { unsubscribe() {} };
    }

    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
  }

  function getStatus() {
    return {
      configured: isConfigured(),
      configurationLabel: getConfigurationLabel(),
      message: lastStatusMessage,
      tone: lastStatusTone
    };
  }

  window.BDFA.supabaseClient = {
    isConfigured,
    getConfigurationLabel,
    getStatus,
    getSession,
    getUser,
    signUp,
    signIn,
    signOut,
    loadSnapshot,
    saveSnapshot,
    onAuthStateChange
  };
}());
