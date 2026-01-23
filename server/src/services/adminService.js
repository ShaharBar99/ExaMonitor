import { supabaseAdmin } from '../lib/supabaseClient.js';
import xlsx from 'xlsx';

export const AdminService = {
  /**
   * Returns users from profiles.
   * Adds placeholder fields if DB doesn't contain them yet.
   */
  async listUsers() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at, username, is_active')
    console.log('AdminService.listUsers: fetched', data); // Debug log

    if (error) {
      const err = new Error(error.message);
      err.status = 500;
      throw err;
    }

    // contract expects: id, full_name, email, role, is_active, created_at, permissions :contentReference[oaicite:1]{index=1}
    return (data || []).map((u) => ({
      id: u.id,
      full_name: u.full_name ?? '',
      email: u.email ?? '',
      role: u.role ?? 'student',
      username: u.username ?? '',
      is_active: u.is_active ?? true,          // placeholder (no column yet)
      created_at: u.created_at, // real if exists
      permissions: [],          // placeholder (no column yet)
    }));
  },

  async updateUserStatus(userId, is_active) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: !!is_active })
      .eq('id', userId)
      .select('id, full_name, email, role, created_at, username, is_active')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return {
      id: data.id,
      full_name: data.full_name ?? '',
      email: data.email ?? '',
      role: data.role ?? 'student',
      username: data.username ?? '',
      is_active: data.is_active ?? true,
      created_at: data.created_at,
      permissions: [],
    };
  }
  ,

  async updateUserPermissions(userId, permissions) {
    // Placeholder because DB might not have permissions column.
    // We'll just return the existing user + requested permissions.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return {
      id: data.id,
      full_name: data.full_name ?? '',
      email: data.email ?? '',
      role: data.role ?? 'student',
      is_active: data.is_active ?? true,          // placeholder
      created_at: data.created_at,
      permissions: permissions || [], // placeholder
    };
  },

  async getAudit(limit = 50, offset = 0) {
    const { data, error, count } = await supabaseAdmin
      .from('audit_trail')
      .select('id, user_id, action, metadata, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return { items: data || [], total: count ?? 0 };
  },

  async listSecurityAlerts(status) {
    let q = supabaseAdmin
      .from("failed_login_attempts")
      .select("id, created_at, attempted_username, attempted_role, ip_address, reason, status")
      .order("created_at", { ascending: false });

    if (status) q = q.eq("status", status);

    const { data, error } = await q;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return (data || []).map((r) => ({
      id: r.id,
      ts: r.created_at,
      username: r.attempted_username,
      role: r.attempted_role,
      ip: r.ip_address,
      reason: r.reason,
      status: r.status,
    }));
  },

  async resolveSecurityAlert(id) {
    const { data, error } = await supabaseAdmin
      .from("failed_login_attempts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, created_at, attempted_username, attempted_role, ip_address, reason, status")
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return {
      alert: {
        id: data.id,
        ts: data.created_at,
        username: data.attempted_username,
        role: data.attempted_role,
        ip: data.ip_address,
        reason: data.reason,
        status: data.status,
      },
    };
  },


  async resolveSecurityAlert(id) {
    // Placeholder: no table yet.
    // Return the shape the frontend expects.
    return {
      alert: {
        id,
        status: 'resolved',
      },
    };
  },

  async createUser({ full_name, username, email, password, role }) {
    // 1. Check if user already exists in profiles (optional, but good for custom error)
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      const err = new Error('User with this username already exists');
      err.status = 409;
      throw err;
    }

    // 2. Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, username }
    });

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    const user = data.user;

    // 3. Upsert into profiles table
    // Note: If you have a Trigger, this might be redundant or cause conflict depending on logic.
    // Assuming manual sync is safe/required as per authService logic.
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([
      {
        id: user.id,
        email: user.email,
        full_name: full_name,
        role,
        username,
        is_active: true
      },
    ]);

    if (profileError) {
      // Cleanup auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      const err = new Error(profileError.message);
      err.status = 500;
      throw err;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: full_name,
      role: role,
      username: username,
      is_active: true,
      created_at: new Date().toISOString(),
      permissions: [],
    };
  },

  async bulkUsersFromExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      created: []
    };

    for (const row of rows) {
      // Normalize keys to lowercase to be more forgiving
      const normalized = {};
      Object.keys(row).forEach((k) => {
        normalized[k.toLowerCase()] = row[k];
      });

      // Expected valid keys: name (or full id), username, email, password, role
      const name = normalized.name || normalized.full_name || normalized['שם מלא'];
      const username = normalized.username || normalized['שם משתמש'];
      const email = normalized.email || normalized['אימייל'];
      const password = normalized.password || normalized['סיסמה'];
      const role = normalized.role || normalized['תפקיד'] || 'student';

      if (!username || !email || !password) {
        results.failed++;
        results.errors.push({
          username: username || 'Unknown',
          error: 'Missing required fields (username, email, password)'
        });
        continue;
      }

      try {
        const newUser = await this.createUser({
          full_name: name,
          username,
          email,
          password,
          role
        });
        results.success++;
        results.created.push(newUser.username);
      } catch (err) {
        results.failed++;
        results.errors.push({ username, error: err.message });
      }
    }

    return results;
  },
};
