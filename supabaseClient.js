/**
 * supabaseClient.js
 *
 * Initializes the global Supabase client using Vite environment variables.
 * Credentials are read from .env / .env.local files via import.meta.env
 */

// Get Supabase config from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[Supabase] Initializing with URL:', supabaseUrl ? 'configured' : 'missing');

if (!window.supabase) {
  console.error('[Supabase] CDN script missing from index.html. Supabase will not work.');
  window.supabaseClient = null;
} else if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Missing credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or .env.local'
  );
  window.supabaseClient = null;
} else {
  try {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log('[Supabase] Client initialized successfully');
  } catch (err) {
    console.error('[Supabase] Failed to create client:', err);
    window.supabaseClient = null;
  }
}

export default window.supabaseClient;
