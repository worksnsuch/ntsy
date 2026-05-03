/**
 * supabaseClient.js
 *
 * Initializes the global Supabase client.
 * Credentials are read from window.SUPABASE_CONFIG which is
 * set inline in index.html — no build tool required.
 */
(function () {
  const config = window.SUPABASE_CONFIG || {};
  const supabaseUrl = config.url || '';
  const supabaseKey = config.key || '';

  if (!window.supabase) {
    console.error('[Supabase] CDN script missing from index.html. Supabase will not work.');
    window.supabaseClient = null;
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[Supabase] Missing credentials. Set window.SUPABASE_CONFIG in index.html ' +
      'with your Supabase URL and anon key.'
    );
    window.supabaseClient = null;
    return;
  }

  try {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('[Supabase] Failed to create client:', err);
    window.supabaseClient = null;
  }
})();
