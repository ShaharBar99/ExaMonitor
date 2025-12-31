import { supabase, supabaseAdmin } from '../lib/supabaseClient.js';

export const AuthService = {
  /**
   * Uses Supabase Auth to sign in.
   * Validates requested role against profiles.role.
   * Returns the access token + user (including role).
   */
  async login(username, password, requestedRole) {
    // "username" in the contract is your login identifier.
    // In your project you use email auth, so treat username as email.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      const err = new Error(error.message);
      err.status = 401;
      throw err;
    }

    const authUser = data.user;
    const token = data.session?.access_token;

    if (!authUser || !token) {
      const err = new Error('Login failed');
      err.status = 401;
      throw err;
    }

    // Fetch role from profiles (server-side)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', authUser.id)
      .single();

    if (profileErr) {
      const err = new Error(profileErr.message);
      err.status = 500;
      throw err;
    }

    const actualRole = profile?.role ?? 'student';

    // Enforce role match
    if (requestedRole !== actualRole) {
      const err = new Error('Role mismatch');
      err.status = 403;
      throw err;
    }

    return {
      token,
      user: {
        id: authUser.id,
        email: profile.email ?? authUser.email ?? '',
        full_name: profile.full_name ?? '',
        role: actualRole,
      },
    };
  },

  async getMe(accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      const err = new Error('Invalid or expired token');
      err.status = 401;
      throw err;
    }

    return { user: data.user };
  },

  async logout() {
    return { ok: true };
  },
};
