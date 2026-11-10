import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const appEnv = import.meta.env.VITE_APP_ENV || 'development';
export const isProduction = appEnv === 'production' || import.meta.env.PROD;

/**
 * Security audit guard: Checks whether a key appears to be a Supabase service-role key.
 * Service role keys MUST NEVER be exposed in frontend client code.
 */
export function isServiceRoleKey(key?: string): boolean {
  if (!key) return false;
  if (key.toLowerCase().includes('service_role')) return true;
  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      // Decode JWT payload (base64)
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (payload.role === 'service_role') {
        return true;
      }
    }
  } catch {
    // Non-JWT string
  }
  return false;
}

// Block accidental service-role key leakage
if (isServiceRoleKey(rawSupabaseAnonKey)) {
  console.error(
    'CRITICAL SECURITY ALERT: Supabase service_role key was provided to frontend client! ' +
    'The service-role key bypasses Row Level Security and must NEVER be used on the client. ' +
    'Falling back to secure placeholder.'
  );
}

const safeAnonKey = isServiceRoleKey(rawSupabaseAnonKey)
  ? undefined
  : rawSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
  safeAnonKey &&
  !rawSupabaseUrl.includes('your-project-id') &&
  !rawSupabaseUrl.includes('placeholder-fixia') &&
  !safeAnonKey.includes('YOUR_ANON_PUBLIC_KEY') &&
  !safeAnonKey.includes('placeholder-anon-key') &&
  safeAnonKey.startsWith('ey') &&
  safeAnonKey.length > 30
);

// Fallback values for local demo development when Supabase is not yet connected
const defaultUrl = rawSupabaseUrl && !rawSupabaseUrl.includes('your-project-id')
  ? rawSupabaseUrl
  : 'https://placeholder-fixia.supabase.co';

const defaultKey = safeAnonKey && !safeAnonKey.includes('your-anon-key')
  ? safeAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key-fixia';

// Production-ready Supabase client
export const supabase: SupabaseClient = createClient(defaultUrl, defaultKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'fixia_coachingos_sb_session',
  },
});
