import { supabaseAdmin } from '../lib/supabaseClient.js';

export const AuditTrailService = {
  /**
   * Logs an event into audit_trail.
   * - userId: profiles.id (uuid) OR null (if unknown)
   * - action: short string like "exam.extra_time_added"
   * - metadata: any JSON object (stored as JSONB in DB)
   */
  async log({ userId = null, action, metadata = {} }) {
    if (!action) return; // don't crash the app if caller forgets

    const { error } = await supabaseAdmin.from('audit_trail').insert([
      {
        user_id: userId,
        action,
        metadata,
      },
    ]);

    // We usually don't want auditing to break the main request.
    // So: log to console and continue.
    if (error) {
      console.error('AuditTrailService.log failed:', error.message);
    }
  },
};
