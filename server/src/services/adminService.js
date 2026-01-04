import { supabaseAdmin } from '../lib/supabaseClient.js';

export const AdminService = {
  /**
   * Returns users from profiles.
   * Adds placeholder fields if DB doesn't contain them yet.
   */
  async listUsers() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at');

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
      is_active: true,          // placeholder (no column yet)
      created_at: u.created_at, // real if exists
      permissions: [],          // placeholder (no column yet)
    }));
  },

  async updateUserRole(userId, role) {
    // We can update role if the column exists.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, full_name, email, role, created_at')
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
      role: data.role ?? role,
      is_active: true,     // placeholder
      created_at: data.created_at,
      permissions: [],     // placeholder
    };
  },

  async updateUserStatus(userId, is_active) {
    // Placeholder because DB might not have is_active column.
    // We'll just return the existing user with the requested status.
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
      is_active: !!is_active, // placeholder
      created_at: data.created_at,
      permissions: [],        // placeholder
    };
  },

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
      is_active: true,          // placeholder
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

  async listSecurityAlerts() {
    // Placeholder: no table yet.
    return [];
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
};
