import { createClient } from '@supabase/supabase-js';

/**
 * Public client:
 * - respects RLS
 * - used for user-level operations
 */
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true, // This is key!
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

/**
 * Admin client:
 * - bypasses RLS
 * - used ONLY on server for admin actions
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: true, // This is key!
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
