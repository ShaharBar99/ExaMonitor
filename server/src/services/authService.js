import { supabase, supabaseAdmin } from '../lib/supabaseClient.js';

async function fetchUserProfile(column, value) {
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, username, is_active')
    .eq(column, value)
    .single();
  if (profileErr) {
    const err = new Error(profileErr.message);
    err.status = 500;
    throw err;
  }

  return profile;
}
async function logFailedLoginAttempt({ username, role, ip, reason }) { // Log failed login attempt
      try { // Never break login flow if logging fails
        await supabaseAdmin.from("failed_login_attempts").insert([ // Insert one row
          { // Row
            attempted_username: String(username || ""), // Username used
            attempted_role: role ? String(role) : null, // Role used
            ip_address: ip ? String(ip) : null, // IP if provided
            reason: String(reason || "Login failed"), // Failure reason
            status: "open", // Default status
          }, // End row
        ]); // End insert
      } catch (e) { // Ignore logging errors
        // intentionally ignored
      } // End try/catch
    } // End logFailedLoginAttempt

    // Fetch role from profiles (server-side)
    //  .eq('id', authUser.id)


export const AuthService = {
  /**
   * Uses Supabase Auth to sign in.
   * Validates requested role against profiles.role.
   * Returns the access token + user (including role).
   */

  async login(username, password, requestedRole, meta = {}) { // Login + role validation + active check
    const ctx = { // Context for logging
      username, // Attempted username
      role: requestedRole, // Attempted role
      ip: meta.ip, // Request IP
    }; // End ctx

    const fail = async (message, status) => { // Centralized failure handler
      await logFailedLoginAttempt({ ...ctx, reason: message }); // Log attempt
      const err = new Error(message); // Create error
      err.status = status; // Attach status code
      throw err; // Throw
    }; // End fail

    // 1) Username not found / profile fetch error
    let user; // Profile row for the username
    try { // Catch not-found or DB error from fetchUserProfile
      user = await fetchUserProfile("username", username); // Lookup by username
    } catch (e) { // Any error -> treat as invalid credentials
      return fail("Invalid username or password", 401); // Log + throw
    } // End try/catch

    if (!user?.email) { // Extra safety guard
      return fail("Invalid username or password", 401); // Log + throw
    } // End guard

    // 2) Supabase signInWithPassword error
    let data; // Supabase auth response data
    try { // Catch sign-in errors
      const res = await supabase.auth.signInWithPassword({ // Sign in using email from profile
        email: user.email, // Email
        password, // Password
      }); // End sign-in

      data = res.data; // Extract data
      const error = res.error; // Extract error

      if (error) { // If Supabase returned an error
        return fail("Invalid username or password", 401); // Log + throw (don’t leak details)
      } // End error check
    } catch (e) { // Unexpected error
      return fail("Invalid username or password", 401); // Log + throw
    } // End try/catch

    const authUser = data?.user; // Auth user
    const token = data?.session?.access_token; // Access token
    const refreshToken = data?.session?.refresh_token; // Refresh token

    if (!authUser || !token) { // Missing session/token
      return fail("Login failed", 401); // Log + throw
    } // End guard

    // 3) Profile fetch error after login (by id)
    let profile; // Full profile row
    try { // Catch DB errors
      profile = await fetchUserProfile("id", authUser.id); // Fetch profile by user id
    } catch (e) { // Profile lookup failed
      return fail("Login failed", 401); // Log + throw
    } // End try/catch

    const actualRole = profile?.role ?? "student"; // Actual role from DB
    const status = profile?.is_active ?? true; // Active flag from DB

    // 4) Inactive user
    if (!status) { // If user is inactive
      return fail("User account is inactive", 403); // Log + throw
    } // End inactive check

    // 5) Role mismatch
    if (requestedRole !== actualRole) { // If requested role doesn't match
      return fail("Role mismatch", 403); // Log + throw
    } // End role check

    return { // Success response
      token, // JWT access token
      refreshToken, // Refresh token
      user: { // User object
        id: authUser.id, // User id
        email: profile.email ?? authUser.email ?? "", // Email
        full_name: profile.full_name ?? "", // Name
        role: actualRole, // Role
      }, // End user
    }; // End return
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

  async refreshToken(refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      const err = new Error('Invalid refresh token');
      err.status = 401;
      throw err;
    }

    const newToken = data?.session?.access_token;
    const newRefreshToken = data?.session?.refresh_token;

    if (!newToken) {
      const err = new Error('Refresh failed');
      err.status = 401;
      throw err;
    }

    return {
      token: newToken,
      refreshToken: newRefreshToken
    };
  },

  async register(name, username, email, password, role) {
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
      email: email,
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

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([
        { id: user.id, email: user.email, full_name: name, role, username, is_active: true },
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
