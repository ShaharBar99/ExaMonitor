import { supabase, supabaseAdmin } from '../lib/supabaseClient.js';

async function fetchUserProfile(column, value) {
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, username')
    .eq(column, value)
    .single();
  if (profileErr) {
    const err = new Error(profileErr.message);
    err.status = 500;
    throw err;
  }

  return profile;
}

    // Fetch role from profiles (server-side)
    //  .eq('id', authUser.id)


export const AuthService = {
  /**
   * Uses Supabase Auth to sign in.
   * Validates requested role against profiles.role.
   * Returns the access token + user (including role).
   */
  async login(username, password, requestedRole) {
    // "username" in the contract is your login identifier.
    // In your project you use email auth, so treat username as email.

    const user = await fetchUserProfile('username', username);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
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

    const profile = await fetchUserProfile('id', authUser.id);

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

  async register(name, username, password, role) {
    // "username" in the contract is your login identifier.
    // In your project you use email auth, so treat username as email.
    
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    if (existingUser) {
        const err = new Error('User with this username already exists');
        err.status = 409;
        throw err;
    }

    const { data, error } = await supabase.auth.signUp({
      email: username,
      password: password,
      options: {
        data: {
          full_name: name,
          role: role,
          username: username,
        }
      }
    });

    if (error) {
      const err = new Error(error.message);
      err.status = error.status || 500;
      throw err;
    }

    const user = data.user;

    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
        { id: user.id, email: user.email, full_name: name, role, username },
    ]);

    if (profileError) {
        // If profile creation fails, we should probably delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        const err = new Error(profileError.message);
        err.status = 500;
        throw err;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: name,
        role: role,
      },
    };
  },
};
