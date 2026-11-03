import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Public client: only used to read the product catalogue. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let adminClient: SupabaseClient | null = null;

/**
 * Server-only client for orders and payments. Uses the service role key, which bypasses
 * row level security, so it must never be imported into code that runs in the browser.
 * Created on first use so that importing this file never needs the secret key.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() must only be called on the server');
  }
  if (!adminClient) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
