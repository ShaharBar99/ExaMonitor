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

    const userId = req.user.id;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (!error && profile?.role === 'admin') {
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
/**
 * Allow access to users with specific roles: admin, supervisor, floor_supervisor
 */
export async function requireClassroomAccess(req, res, next) {
  try {
    const userId = req.user.id;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && profile) {
      const allowedRoles = ['admin', 'supervisor', 'floor_supervisor'];
      if (allowedRoles.includes(profile.role)) {
        return next();
      }
    }

    return res.status(403).json({ error: 'Classroom access required. Admin, Supervisor, or Floor Supervisor role needed.' });
  } catch (err) {
    next(err);
  }
}