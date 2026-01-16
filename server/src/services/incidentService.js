import { supabaseAdmin } from '../lib/supabaseClient.js';

export const IncidentService = {
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

  async callManager(roomId, reason) {
    console.log(`Calling manager to room ${roomId} for: ${reason}`);
    return { success: true };
  },
};
