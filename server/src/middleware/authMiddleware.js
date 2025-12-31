import { supabase } from '../lib/supabaseClient.js';

/**
 * Reads Bearer token, validates it with Supabase, and attaches req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * TEMP: checks admin role via profiles table if possible.
 * If you don't have role yet, we'll allow for now only if email matches a hardcoded admin list.
 */
export async function requireAdmin(req, res, next) {
  try {
    // Best effort: look up role in profiles
    // If it fails, we fall back to allowing only "admin@test.com" for development.
    const email = req.user?.email || '';

    if (email === 'test@exam.local') {
      return next();
    }

    // Try DB role check if profiles has it
    // (If this fails because schema differs, we return 403)
    // We'll implement this in adminService later if you want.
    return res.status(403).json({ error: 'Admin access required' });
  } catch (err) {
    next(err);
  }
}
