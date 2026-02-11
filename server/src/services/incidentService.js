import { supabaseAdmin } from '../lib/supabaseClient.js';

/**
 * Service for managing incidents.
 */
export const IncidentService = {
  /**
   * Reports a new incident.
   * @param {object} incidentData - The incident data.
   * @returns {Promise<object>} The created incident.
   */
  async report(incidentData) {
    console.log('Reporting incident to DB:', incidentData);

    const { data, error } = await supabaseAdmin
      .from('exam_incidents')
      .insert([{
        exam_id: incidentData.examId,
        room_number: incidentData.roomNumber,
        student_id_str: incidentData.studentId, // שים לב לשם העמודה
        incident_type: incidentData.incidentType,
        severity: incidentData.severity,
        description: incidentData.description,
        reporter_id: incidentData.reporterId // ה-ID של המשתמש המחובר
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }

    return { success: true, incident: data[0] };
  },

  /**
   * Calls the floor manager.
   * @param {string} roomId - The room ID.
   * @param {string} reason - The reason for the call.
   * @returns {Promise<object>} Success status.
   */
  async callManager(roomId, reason) {
    console.log(`Calling manager to room ${roomId} for: ${reason}`);
    return { success: true };
  },

  /**
   * Lists incidents, optionally filtered by exam.
   * @param {string} [examId] - The exam ID.
   * @returns {Promise<Array>} List of incidents.
   */
  async list(examId) {
    let query = supabaseAdmin
      .from('exam_incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },
  
  /**
   * Lists incidents specifically by exam ID (simplified).
   * @param {string} examId - The exam ID.
   * @returns {Promise<Array>} List of incidents.
   */
  async listByExam(examId) {
    console.log(`Fetching incidents for exam ID: ${examId}`);

    const { data, error } = await supabaseAdmin
      .from('exam_incidents')
      .select('id, severity')
      .eq('exam_id', examId);

    if (error) throw error;
    return data || [];
  }

};
