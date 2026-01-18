import { supabaseAdmin } from '../lib/supabaseClient.js';

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
};
