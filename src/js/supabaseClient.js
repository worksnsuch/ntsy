/**
 * supabaseClient.js
 *
 * Initializes the global Supabase client using credentials injected at
 * build-time by Vite (via `define` in vite.config.js) or from Vercel env
 * vars at runtime. No credentials are hard-coded.
 */
(function () {
  // Vite replaces __SUPABASE_URL__ and __SUPABASE_ANON_KEY__ at build time.
  // At runtime on Vercel, the values come from Vercel's env var injection.
  let supabaseUrl = '';
  let supabaseKey = '';

  try {
    // Build-time injection via vite.config.js `define`
    if (typeof __SUPABASE_URL__ !== 'undefined') supabaseUrl = __SUPABASE_URL__;
    if (typeof __SUPABASE_ANON_KEY__ !== 'undefined') supabaseKey = __SUPABASE_ANON_KEY__;
  } catch (e) {
    // Swallow — running outside Vite build (e.g. direct HTML open)
  }

  if (!window.supabase) {
    console.error('[Supabase] CDN script missing from index.html. Supabase will not work.');
    window.supabaseClient = null;
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[Supabase] Missing credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
      'in your .env file (local) or Vercel environment variables (production).'
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
